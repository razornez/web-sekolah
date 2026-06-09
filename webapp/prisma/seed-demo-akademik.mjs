// Perkaya data Detail Siswa untuk N siswa target sekolah demo:
//  - Perjalanan Akademik: riwayat kelas VII→VIII→IX (3 tahun) + rata² per tahun
//  - Perkembangan Akademik: nilai 6 semester (tren naik) → grafik garis + radar
//  - Heatmap Kehadiran: ~1 tahun presensi harian (mayoritas hadir + variasi)
//  - Catatan BK & Disiplin: beberapa kasus per siswa
// Idempotent (upsert / skipDuplicates / cek-dulu). Tenant-scoped ke 1 sekolah.
// Jalankan: node --env-file=.env prisma/seed-demo-akademik.mjs 7 8
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SEKOLAH_ID = Number(process.argv[2] || 7);
const N_TARGET = Number(process.argv[3] || 8);

const CAPAIAN = [
  "Memahami konsep dengan sangat baik dan aktif di kelas. Perlu pendalaman pada topik lanjut.",
  "Menunjukkan kemajuan baik. Pertahankan konsistensi belajar.",
  "Kompetensi tercapai sesuai harapan. Tingkatkan keaktifan berdiskusi.",
];
const KASUS = [
  { n: "Terlambat masuk kelas", p: 5, m: 8 }, { n: "Atribut tidak lengkap", p: 10, m: 5 },
  { n: "Tidak mengerjakan tugas", p: 15, m: 2 }, { n: "Ramai saat pelajaran", p: 5, m: 10 },
];
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

async function ensureTA(tahun) {
  let ta = await prisma.tahunAjaran.findFirst({ where: { sekolahId: SEKOLAH_ID, tahun } });
  if (!ta) ta = await prisma.tahunAjaran.create({ data: { sekolahId: SEKOLAH_ID, tahun, aktif: false } });
  for (const [nama, urutan] of [["Semester Ganjil", 1], ["Semester Genap", 2]]) {
    const ex = await prisma.periode.findFirst({ where: { tahunAjaranId: ta.id, urutan } });
    if (!ex) await prisma.periode.create({ data: { tahunAjaranId: ta.id, nama, urutan, dinilai: true, aktif: false } });
  }
  const periode = await prisma.periode.findMany({ where: { tahunAjaranId: ta.id }, orderBy: { urutan: "asc" } });
  return { ta, periode };
}
async function ensureRombel(taId, tingkatNama, nama) {
  const tingkat = await prisma.tingkat.findFirst({ where: { sekolahId: SEKOLAH_ID, nama: tingkatNama } });
  if (!tingkat) throw new Error(`tingkat ${tingkatNama} tidak ada`);
  let rb = await prisma.rombel.findFirst({ where: { tahunAjaranId: taId, nama } });
  if (!rb) rb = await prisma.rombel.create({ data: { sekolahId: SEKOLAH_ID, tahunAjaranId: taId, tingkatId: tingkat.id, nama } });
  return rb;
}

async function main() {
  const sek = await prisma.sekolah.findUnique({ where: { id: SEKOLAH_ID }, select: { nama: true } });
  console.log(`\n== Perkaya akademik sekolah ${SEKOLAH_ID}: ${sek?.nama} (target ${N_TARGET}) ==`);
  const targets = (await prisma.siswa.findMany({ where: { sekolahId: SEKOLAH_ID, status: "aktif" }, select: { id: true }, orderBy: { id: "asc" }, take: N_TARGET })).map((s) => s.id);
  console.log(`TARGET: ${targets.join(", ")}`);
  const mapel = await prisma.mapel.findMany({ where: { sekolahId: SEKOLAH_ID }, select: { id: true, kkm: true } });

  // 1) Riwayat kelas + periode (kronologis). base = rata² kasar per periode (tren naik).
  const HIST = [
    { tahun: "2022/2023", tingkat: "VII", rombel: "VII A", base: [72, 76] },
    { tahun: "2023/2024", tingkat: "VIII", rombel: "VIII A", base: [80, 83] },
  ];
  const chain = []; // { periodeId, base }
  let absen = 0, anggota = 0;
  for (const h of HIST) {
    const { ta, periode } = await ensureTA(h.tahun);
    const rb = await ensureRombel(ta.id, h.tingkat, h.rombel);
    for (let i = 0; i < targets.length; i++) {
      const ex = await prisma.anggotaRombel.findFirst({ where: { rombelId: rb.id, siswaId: targets[i] } });
      if (!ex) { await prisma.anggotaRombel.create({ data: { rombelId: rb.id, siswaId: targets[i], nomorAbsen: i + 1 } }); anggota++; }
    }
    periode.forEach((per, pi) => chain.push({ periodeId: per.id, base: h.base[pi] ?? 78 }));
    absen++;
  }
  // periode tahun aktif (2024/2025): Ganjil sudah ada nilai, Genap base tinggi
  const curTA = await prisma.tahunAjaran.findFirst({ where: { sekolahId: SEKOLAH_ID, aktif: true }, include: { periode: { orderBy: { urutan: "asc" } } } });
  if (curTA) curTA.periode.forEach((per, pi) => chain.push({ periodeId: per.id, base: pi === 0 ? 87 : 89 }));
  console.log(`riwayat: ${anggota} keanggotaan rombel baru · ${chain.length} periode dinilai`);

  // 2) Nilai semua periode × mapel × target (upsert; tdk menimpa nilai existing)
  let nilai = 0;
  for (const sid of targets) for (let ci = 0; ci < chain.length; ci++) {
    const { periodeId, base } = chain[ci];
    for (let mi = 0; mi < mapel.length; mi++) {
      const m = mapel[mi];
      const val = clamp(base + (((sid * 7 + mi * 5 + ci) % 13) - 6), 60, 98);
      await prisma.nilaiRapor.upsert({
        where: { siswaId_mapelId_periodeId: { siswaId: sid, mapelId: m.id, periodeId } },
        create: { sekolahId: SEKOLAH_ID, siswaId: sid, mapelId: m.id, periodeId, nilaiAkhir: val, deskripsiCapaian: pick(CAPAIAN, sid + mi), kkm: m.kkm || 70 },
        update: {},
      }); nilai++;
    }
  }
  console.log(`nilaiRapor (upsert): ${nilai}`);

  // 3) Catatan wali utk periode terbaru (biar muncul di Rapor)
  let cat = 0;
  const latest = curTA?.periode?.slice(-1)[0];
  if (latest) for (const sid of targets) {
    const ex = await prisma.raporCatatan.findFirst({ where: { siswaId: sid, periodeId: latest.id } });
    if (!ex) { await prisma.raporCatatan.create({ data: { sekolahId: SEKOLAH_ID, siswaId: sid, periodeId: latest.id, catatan: "Ananda konsisten menunjukkan peningkatan dari tahun ke tahun. Pertahankan kedisiplinan dan semangat belajar.", sikap: "Baik" } }); cat++; }
  }
  console.log(`catatan wali: ${cat}`);

  // 4) Heatmap: presensi harian ~364 hari ke belakang (hari kerja), mayoritas hadir
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let presensi = 0;
  for (const sid of targets) {
    const rows = [];
    for (let d = 0; d < 364; d++) {
      const dt = new Date(today); dt.setDate(dt.getDate() - d);
      const dow = dt.getDay(); if (dow === 0 || dow === 6) continue; // skip akhir pekan
      const k = (sid + d) % 100;
      const status = k < 4 ? "alpa" : k < 9 ? "sakit" : k < 15 ? "izin" : k < 23 ? "terlambat" : "hadir";
      rows.push({ sekolahId: SEKOLAH_ID, siswaId: sid, tanggal: dt, status });
    }
    const res = await prisma.kehadiranSiswa.createMany({ data: rows, skipDuplicates: true });
    presensi += res.count;
  }
  console.log(`presensi (skipDuplicates): ${presensi}`);

  // 5) Kasus BK: top-up tiap target hingga total ≥3 (idempotent berbasis jumlah)
  let kasus = 0;
  for (const sid of targets) {
    const have = await prisma.kasusSiswa.count({ where: { siswaId: sid } });
    for (let ki = have; ki < 3; ki++) {
      const kk = pick(KASUS, sid + ki);
      const tanggal = new Date(today); tanggal.setMonth(tanggal.getMonth() - kk.m - ki);
      await prisma.kasusSiswa.create({ data: { sekolahId: SEKOLAH_ID, siswaId: sid, namaKasus: kk.n, poin: kk.p, tanggal, keterangan: "Tercatat oleh guru BK." } }); kasus++;
    }
  }
  console.log(`kasus BK tambahan: ${kasus}`);
  console.log(`\nSelesai. Cek: ${targets.slice(0, 3).map((id) => `/siswa/${id}`).join("  ")}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
