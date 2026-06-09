// Seed data-completeness Detail Siswa (idempotent, TENANT-SCOPED ke 1 sekolah saja).
// Mengisi: foto dummy (DiceBear, avatar ilustrasi — bukan wajah asli), koordinat rumah+sekolah,
// alamat/transportasi, biometri & tgl lahir (utk persona/BMI), lalu untuk N siswa "target":
// nilai rapor + catatan wali + P5 (projek+penilaian) + orang tua + prestasi + kasus BK.
//
// Jalankan (ganti 7 dengan sekolahId tujuan; default 2 = showcase):
//   node --env-file=.env prisma/seed-foto-geo.mjs 7
//   node --env-file=.env prisma/seed-foto-geo.mjs 7 8     (8 = jumlah siswa target lengkap)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SEKOLAH_ID = Number(process.argv[2] || process.env.SEED_SEKOLAH_ID || 2);
const N_TARGET = Number(process.argv[3] || 8); // siswa pertama yg dilengkapi SEMUA kategori

// Titik sekolah per id (fallback Jakarta). Siswa disebar ~0.3–5 km di sekitarnya.
const COORDS = { 2: { lat: -6.9175, lng: 107.6191 }, 7: { lat: -6.2615, lng: 106.8106 } };
const SCHOOL = COORDS[SEKOLAH_ID] || { lat: -6.2, lng: 106.8 };

const dicebear = (nama) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(nama)}&radius=12&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const TRANSPORT = ["Jalan kaki", "Sepeda", "Sepeda motor", "Antar jemput", "Angkutan umum"];
const PEKERJAAN = ["PNS", "Wiraswasta", "Karyawan swasta", "Guru", "Pedagang", "Petani"];
const PENDIDIKAN = ["SMA", "D3", "S1", "S2"];
const PRESTASI = [{ n: "Juara 1 OSN Matematika", t: "Kabupaten" }, { n: "Juara 2 Lomba Pidato", t: "Sekolah" }, { n: "Juara 3 Futsal", t: "Kecamatan" }, { n: "Finalis Karya Tulis Ilmiah", t: "Provinsi" }];
const KASUS = [{ n: "Terlambat masuk kelas", p: 5 }, { n: "Atribut tidak lengkap", p: 10 }, { n: "Tidak mengerjakan tugas", p: 15 }];
const PRED = ["BSH", "SAB", "MB", "SB"];
const CAPAIAN = ["Memahami konsep dengan sangat baik dan aktif di kelas. Perlu pendalaman pada topik lanjut.", "Menunjukkan kemajuan baik. Pertahankan konsistensi belajar.", "Kompetensi tercapai sesuai harapan. Tingkatkan keaktifan berdiskusi."];

async function main() {
  const sek = await prisma.sekolah.findUnique({ where: { id: SEKOLAH_ID }, select: { nama: true } });
  if (!sek) throw new Error(`Sekolah ${SEKOLAH_ID} tidak ditemukan`);
  console.log(`\n== Seed sekolah ${SEKOLAH_ID}: ${sek.nama} (target ${N_TARGET} siswa lengkap) ==`);

  // 1) Koordinat sekolah
  await prisma.sekolah.update({ where: { id: SEKOLAH_ID }, data: { lat: SCHOOL.lat, lng: SCHOOL.lng } });

  // 2) Foto + geo + alamat/transport + biometri (semua siswa aktif; hanya isi yg kosong)
  const siswa = await prisma.siswa.findMany({
    where: { sekolahId: SEKOLAH_ID, status: "aktif" },
    select: { id: true, namaLengkap: true, jenisKelamin: true, tanggalLahir: true, foto: true, lat: true, alamat: true, transportasi: true, tinggiBadan: true, beratBadan: true },
    orderBy: { id: "asc" },
  });
  let foto = 0, geo = 0, bio = 0;
  for (let i = 0; i < siswa.length; i++) {
    const s = siswa[i]; const d = {};
    if (!s.foto) { d.foto = dicebear(s.namaLengkap); foto++; }
    if (s.lat == null) {
      d.lat = SCHOOL.lat + (Math.random() - 0.5) * 0.08; d.lng = SCHOOL.lng + (Math.random() - 0.5) * 0.08; geo++;
      if (!s.alamat) d.alamat = `Jl. Mawar No. ${i + 1}, RT 0${(i % 9) + 1}/RW 0${(i % 9) + 1}`;
      if (!s.transportasi) d.transportasi = pick(TRANSPORT, i);
    }
    if (!s.jenisKelamin) d.jenisKelamin = i % 2 === 0 ? "L" : "P";
    if (!s.tanggalLahir) { d.tanggalLahir = new Date(2010 + (i % 3), i % 12, (i % 27) + 1); bio++; }
    if (!s.tinggiBadan) d.tinggiBadan = String(150 + (i % 22));
    if (!s.beratBadan) d.beratBadan = String(42 + (i % 18));
    if (Object.keys(d).length) await prisma.siswa.update({ where: { id: s.id }, data: d });
  }
  console.log(`foto:${foto} geo:${geo} biometri:${bio} / ${siswa.length} siswa aktif`);

  const targets = siswa.slice(0, N_TARGET).map((s) => s.id);
  console.log(`TARGET siswa (lengkap): ${targets.join(", ")}`);

  // 3) Nilai rapor utk target (biar tab Rapor & catatan wali muncul)
  const periode = (await prisma.periode.findFirst({ where: { tahunAjaran: { sekolahId: SEKOLAH_ID }, aktif: true }, select: { id: true } }))
    || (await prisma.periode.findFirst({ where: { tahunAjaran: { sekolahId: SEKOLAH_ID } }, select: { id: true } }));
  const mapel = await prisma.mapel.findMany({ where: { sekolahId: SEKOLAH_ID }, select: { id: true, kkm: true } });
  let nilai = 0;
  if (periode && mapel.length) {
    for (const sid of targets) for (let mi = 0; mi < mapel.length; mi++) {
      const m = mapel[mi];
      await prisma.nilaiRapor.upsert({
        where: { siswaId_mapelId_periodeId: { siswaId: sid, mapelId: m.id, periodeId: periode.id } },
        create: { sekolahId: SEKOLAH_ID, siswaId: sid, mapelId: m.id, periodeId: periode.id, nilaiAkhir: 78 + ((sid + mi) % 18), deskripsiCapaian: pick(CAPAIAN, sid + mi), kkm: m.kkm || 70 },
        update: {},
      }); nilai++;
    }
  }
  console.log(`nilaiRapor (upsert) target: ${nilai} @periode ${periode?.id}`);

  // 4) Catatan wali utk target
  let cat = 0;
  if (periode) for (const sid of targets) {
    const ex = await prisma.raporCatatan.findFirst({ where: { siswaId: sid, periodeId: periode.id } });
    if (!ex) { await prisma.raporCatatan.create({ data: { sekolahId: SEKOLAH_ID, siswaId: sid, periodeId: periode.id, catatan: "Ananda menunjukkan perkembangan baik semester ini. Pertahankan kedisiplinan dan tingkatkan keaktifan dalam diskusi kelas.", sikap: "Baik" } }); cat++; }
  }
  console.log(`catatan wali: ${cat}`);

  // 5) P5: buat ProjekP5 (bila belum) + penilaian utk target
  const elemen = await prisma.elemenProfil.findMany({ select: { id: true }, take: 4 });
  const ta = (await prisma.tahunAjaran.findFirst({ where: { sekolahId: SEKOLAH_ID, aktif: true }, select: { id: true } }))
    || (await prisma.tahunAjaran.findFirst({ where: { sekolahId: SEKOLAH_ID }, select: { id: true } }));
  let projek = await prisma.projekP5.findFirst({ where: { sekolahId: SEKOLAH_ID }, select: { id: true } });
  if (!projek && ta && elemen.length) {
    projek = await prisma.projekP5.create({ data: { sekolahId: SEKOLAH_ID, tahunAjaranId: ta.id, tema: "Gaya Hidup Berkelanjutan", judul: "Sekolah Hijau: Pengelolaan Sampah Anorganik", deskripsi: "Proyek penguatan profil pelajar Pancasila.", target: { create: elemen.map((e) => ({ elemenId: e.id })) } }, select: { id: true } });
    console.log(`ProjekP5 dibuat #${projek.id}`);
  }
  let p5 = 0;
  if (projek) {
    const tgt = await prisma.projekP5Target.findMany({ where: { projekP5Id: projek.id }, select: { elemenId: true } });
    const els = (tgt.length ? tgt.map((t) => t.elemenId) : elemen.map((e) => e.id)).slice(0, 4);
    for (const sid of targets) for (let ei = 0; ei < els.length; ei++) {
      try { await prisma.penilaianP5.create({ data: { projekP5Id: projek.id, siswaId: sid, elemenId: els[ei], predikat: pick(PRED, sid + ei) } }); p5++; } catch { /* unique */ }
    }
  }
  console.log(`penilaianP5: ${p5}`);

  // 6) Orang tua (ayah+ibu) utk target — dgn no HP nyata
  let ortu = 0;
  for (let ti = 0; ti < targets.length; ti++) {
    const sid = targets[ti];
    for (const tipe of ["ayah", "ibu"]) {
      const ex = await prisma.orangTuaWali.findFirst({ where: { siswaId: sid, tipe } });
      if (!ex) { await prisma.orangTuaWali.create({ data: { siswaId: sid, tipe, nama: `${tipe === "ayah" ? "Bapak" : "Ibu"} Wali ${sid}`, pekerjaan: pick(PEKERJAAN, sid + ti), pendidikan: pick(PENDIDIKAN, sid), noHp: `+62812${String(3456000 + sid).slice(-7)}` } }); ortu++; }
    }
  }
  console.log(`orang tua dibuat: ${ortu}`);

  // 7) Prestasi utk separuh target (award shelf)
  let pres = 0;
  for (let ti = 0; ti < targets.length; ti++) {
    if (ti % 2 !== 0) continue;
    const sid = targets[ti];
    if (await prisma.prestasiSiswa.findFirst({ where: { siswaId: sid } })) continue;
    const pr = pick(PRESTASI, sid); await prisma.prestasiSiswa.create({ data: { siswaId: sid, namaPrestasi: pr.n, tingkat: pr.t, tahun: "2025" } }); pres++;
  }
  console.log(`prestasi dibuat: ${pres}`);

  // 8) Kasus BK: pastikan sebagian target punya (sisakan ~1/3 bersih utk empty-state)
  let kasus = 0;
  for (let ti = 0; ti < targets.length; ti++) {
    if (ti % 3 === 2) continue; // ~1/3 dibiarkan bersih
    const sid = targets[ti];
    if (await prisma.kasusSiswa.count({ where: { siswaId: sid } })) continue;
    const k = pick(KASUS, sid); await prisma.kasusSiswa.create({ data: { sekolahId: SEKOLAH_ID, siswaId: sid, namaKasus: k.n, poin: k.p, tanggal: new Date(2024, 9, (sid % 27) + 1), keterangan: "Tercatat oleh guru BK." } }); kasus++;
  }
  console.log(`kasus BK tambahan: ${kasus}`);
  console.log(`\nSelesai. Buka Detail salah satu: ${targets.slice(0, 4).map((id) => `/siswa/${id}`).join("  ")}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
