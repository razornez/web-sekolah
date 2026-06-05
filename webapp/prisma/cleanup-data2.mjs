/**
 * Cleanup data wave 2 — BUG-027, 026, 028(periodeId), 029, 031, 009.
 * Run: node prisma/cleanup-data2.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

const CITIES = ["Yogyakarta","Sleman","Bantul","Magelang","Klaten","Solo","Semarang","Purworejo","Kebumen","Wonosobo","Temanggung","Boyolali","Salatiga","Kulon Progo","Gunungkidul"];
const BLOOD = ["A","B","AB","O"];
const TINGGAL = ["Orang Tua","Wali","Kakek/Nenek","Asrama","Kos"];
const TRANSPORT = ["Jalan Kaki","Sepeda","Sepeda Motor","Antar Jemput","Angkutan Umum","Mobil Pribadi"];

function pick(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
function hash(s) { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))|0; return h; }

// Deskripsi capaian sesuai band nilai (Kurikulum Merdeka style)
function deskripsi(nilai, mapel) {
  const m = mapel || "mata pelajaran ini";
  if (nilai >= 90) return `Menunjukkan penguasaan yang sangat baik pada ${m}. Mampu menerapkan konsep secara mandiri dan konsisten.`;
  if (nilai >= 80) return `Menguasai kompetensi ${m} dengan baik. Memahami sebagian besar materi dan mampu menerapkannya.`;
  if (nilai >= 70) return `Cukup menguasai kompetensi ${m}. Perlu pemantapan pada beberapa konsep agar lebih optimal.`;
  return `Masih memerlukan bimbingan dan latihan soal lebih banyak pada ${m} untuk mencapai kompetensi minimal.`;
}

async function fixNilaiPeriode() {
  const aktif = await p.periode.findFirst({ where: { aktif: true, tahunAjaran: { sekolahId: SID } }, select: { id: true } });
  if (!aktif) return;
  const r1 = await p.nilaiRapor.updateMany({ where: { sekolahId: SID, periodeId: { not: aktif.id } }, data: { periodeId: aktif.id } }).catch((e) => ({ count: 0, err: e.message }));
  const r2 = await p.entriNilai.updateMany({ where: { sekolahId: SID, periodeId: { not: aktif.id } }, data: { periodeId: aktif.id } }).catch(() => ({ count: 0 }));
  console.log(`✓ BUG-027 Nilai → periode aktif: ${r1.count ?? 0} nilaiRapor, ${r2.count ?? 0} entriNilai${r1.err ? " (err: "+r1.err+")" : ""}`);
}

async function fixDeskripsi() {
  const rows = await p.nilaiRapor.findMany({ where: { sekolahId: SID }, select: { id: true, nilaiAkhir: true, nilaiPengetahuan: true, mapel: { select: { namaMapel: true } } } });
  let n = 0;
  for (const r of rows) {
    const nilai = r.nilaiAkhir ?? r.nilaiPengetahuan ?? 0;
    await p.nilaiRapor.update({ where: { id: r.id }, data: { deskripsiCapaian: deskripsi(nilai, r.mapel?.namaMapel) } });
    n++;
  }
  console.log(`✓ BUG-026 Deskripsi capaian: ${n} disesuaikan dengan band nilai`);
}

async function setKehadiranPeriode() {
  const aktif = await p.periode.findFirst({ where: { aktif: true, tahunAjaran: { sekolahId: SID } }, select: { id: true } });
  if (!aktif) return;
  const r = await p.kehadiranSiswa.updateMany({ where: { sekolahId: SID, periodeId: null }, data: { periodeId: aktif.id } });
  console.log(`✓ BUG-028 kehadiran.periodeId diisi: ${r.count} record → periode aktif`);
}

async function fillProfileData() {
  // Tentukan tingkat tiap siswa dari rombel
  const anggota = await p.anggotaRombel.findMany({
    where: { rombel: { sekolahId: SID } },
    select: { siswaId: true, rombel: { select: { tingkat: { select: { nama: true } } } } },
  });
  const tingkatBySiswa = new Map();
  for (const a of anggota) tingkatBySiswa.set(a.siswaId, a.rombel?.tingkat?.nama ?? "X");

  // Tahun lahir realistis utk TA 2025/2026: X→2009, XI→2008, XII→2007
  const birthYear = { X: 2009, XI: 2008, XII: 2007 };

  const siswa = await p.siswa.findMany({
    where: { sekolahId: SID },
    select: { id: true, namaLengkap: true, nis: true, tempatLahir: true, tanggalLahir: true, golonganDarah: true, tinggiBadan: true, beratBadan: true, tinggalDengan: true, transportasi: true },
  });
  let filled = 0, birthFixed = 0;
  for (const s of siswa) {
    const seed = hash(s.namaLengkap + s.id);
    const tingkat = tingkatBySiswa.get(s.id) ?? "X";
    const data = {};
    if (!s.tempatLahir) data.tempatLahir = pick(CITIES, seed);
    if (!s.golonganDarah) data.golonganDarah = pick(BLOOD, seed >> 2);
    if (!s.tinggiBadan) data.tinggiBadan = String(150 + (Math.abs(seed) % 30)); // 150-179
    if (!s.beratBadan) data.beratBadan = String(42 + (Math.abs(seed >> 3) % 28)); // 42-69
    if (!s.tinggalDengan) data.tinggalDengan = pick(TINGGAL, seed >> 4);
    if (!s.transportasi) data.transportasi = pick(TRANSPORT, seed >> 5);
    if (!s.nis) data.nis = String(10000 + (Math.abs(seed) % 89999));
    // Tanggal lahir realistis (perbaiki yang tidak masuk akal / kosong)
    const yr = birthYear[tingkat] ?? 2009;
    const curYr = s.tanggalLahir ? new Date(s.tanggalLahir).getUTCFullYear() : null;
    if (!curYr || curYr < yr - 1 || curYr > yr + 1) {
      const month = (Math.abs(seed) % 12);
      const day = 1 + (Math.abs(seed >> 6) % 27);
      data.tanggalLahir = new Date(Date.UTC(yr, month, day));
      birthFixed++;
    }
    if (Object.keys(data).length) { await p.siswa.update({ where: { id: s.id }, data }); filled++; }
  }
  console.log(`✓ BUG-029/031 Profil: ${filled} siswa dilengkapi, ${birthFixed} tanggal lahir disesuaikan jenjang`);
}

async function fixSuratYear() {
  const aktifTahun = "2025/2026";
  const yr = "2026";
  const surat = await p.surat.findMany({ where: { sekolahId: SID }, select: { id: true, nomorSurat: true, tanggal: true } }).catch(() => []);
  let n = 0;
  for (const s of surat) {
    if (s.nomorSurat && /\/2024$|\/2025$/.test(s.nomorSurat)) {
      const newNomor = s.nomorSurat.replace(/\/(2024|2025)$/, `/${yr}`);
      await p.surat.update({ where: { id: s.id }, data: { nomorSurat: newNomor } }).catch(() => {});
      n++;
    }
  }
  console.log(`✓ BUG-009 Nomor surat: ${n} disesuaikan ke /${yr}`);
}

async function main() {
  console.log("=== CLEANUP WAVE 2 ===\n");
  await fixNilaiPeriode();
  await fixDeskripsi();
  await setKehadiranPeriode();
  await fillProfileData();
  await fixSuratYear();
  console.log("\n=== SELESAI ===");
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
