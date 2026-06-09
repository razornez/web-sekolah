// Foundation seed Modul Guru — perkaya guru sekolah showcase agar semua halaman
// revamp (List/Detail/Rapor Kinerja) punya data nyata & bervariasi.
// Mengisi: foto, tanggalLahir/tmt (jika kosong), pendidikan, sertifikasi (+expired soon),
// penghargaan, kehadiran setahun, RekapKinerjaGuru (PKG 5 dimensi), EvaluasiKelas.
// Idempotent (cek-dulu / upsert) + tenant-scoped. Jalankan: node --env-file=.env prisma/seed-guru.mjs 2
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SID = Number(process.argv[2] || 2);
const dicebear = (nama) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent("guru-" + nama)}&radius=12&backgroundColor=c0aede,b6e3f4,d1d4f9,ffd5dc,ffdfbf`;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const clamp = (v, lo = 70, hi = 98) => Math.min(hi, Math.max(lo, Math.round(v)));
const PT = ["Universitas Pendidikan Indonesia", "Universitas Negeri Yogyakarta", "IKIP Bandung", "Universitas Negeri Malang", "Institut Teknologi Bandung", "Universitas Pendidikan Ganesha"];
const SMA = ["SMA Negeri 1", "SMA Negeri 3", "SMA Negeri 5", "SMA Pasundan 2", "MA Negeri 2"];
const JUR = ["Pendidikan Matematika", "Pendidikan Fisika", "Pendidikan Biologi", "Pendidikan Bahasa", "Pendidikan Kimia", "Manajemen Pendidikan"];
const PENGHARGAAN = [
  { nama: "Guru Berprestasi Tingkat Kota", pemberi: "Dinas Pendidikan Kota Bandung", tingkat: "Kota", ranking: "Juara 2" },
  { nama: "Pembina OSN Medali Perak Nasional", pemberi: "Kemdikbud", tingkat: "Nasional", ranking: "Juara 2" },
  { nama: "Guru Teladan", pemberi: "Sekolah", tingkat: "Sekolah", ranking: "Juara 1" },
  { nama: "Pengelola Adiwiyata", pemberi: "Pemprov Jawa Barat", tingkat: "Provinsi", ranking: "Juara 3" },
];
const PREDIKAT = (s) => (s >= 92 ? "A+" : s >= 88 ? "A" : s >= 83 ? "B+" : s >= 78 ? "B" : s >= 70 ? "C" : "D");
const OBS = [{ n: "Drs. Budi Santoso, M.Pd", r: "Kepala Sekolah" }, { n: "Dr. Wulandari, M.Sc", r: "Pengawas Sekolah" }, { n: "M. Hidayat, S.Pd", r: "Wakasek Kurikulum" }];
const TOPIK = ["Termodinamika - Hukum II", "Praktikum Cermin & Lensa", "Hukum Newton II", "Stoikiometri Reaksi", "Klasifikasi Makhluk Hidup", "Teks Argumentatif"];
const EV_CAT = [
  "Membawakan materi dengan analogi sehari-hari. Siswa antusias berdiskusi. Penilaian formatif terstruktur dan langsung diberi umpan balik.",
  "Pengelolaan kelas praktikum sangat baik, siswa bekerja simultan dengan supervisi ketat. Saran: pengadaan alat tambahan.",
  "Materi tersampaikan dengan baik, tempo sedikit cepat untuk kelas yang butuh adaptasi. Saran: lebih banyak pertanyaan terbuka.",
];

async function main() {
  const sek = await prisma.sekolah.findUnique({ where: { id: SID }, select: { nama: true } });
  console.log(`\n== Seed Guru sekolah ${SID}: ${sek?.nama} ==`);
  const guru = await prisma.guru.findMany({ where: { sekolahId: SID, deletedAt: null }, select: { id: true, namaGuru: true, foto: true, statusGuru: true, tanggalLahir: true, tmt: true }, orderBy: { id: "asc" } });
  const periode = (await prisma.periode.findFirst({ where: { tahunAjaran: { sekolahId: SID }, aktif: true }, select: { id: true } }))
    || (await prisma.periode.findFirst({ where: { tahunAjaran: { sekolahId: SID } }, select: { id: true } }));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let foto = 0, pend = 0, sert = 0, peng = 0, hadir = 0, pkg = 0, ev5 = 0;

  for (let i = 0; i < guru.length; i++) {
    const g = guru[i];
    // 1) foto + tanggalLahir/tmt jika kosong (2 guru ber-ultah bulan ini utk widget)
    const upd = {};
    if (!g.foto) { upd.foto = dicebear(g.namaGuru); foto++; }
    if (!g.tanggalLahir) upd.tanggalLahir = new Date(1975 + (i % 22), (i === 0 || i === 5) ? today.getMonth() : i % 12, (i % 27) + 1);
    if (!g.tmt) upd.tmt = new Date(2003 + (i % 18), i % 12, 1);
    if (Object.keys(upd).length) await prisma.guru.update({ where: { id: g.id }, data: upd });

    // 2) pendidikan (SMA → S1 → opsional S2)
    if ((await prisma.pendidikanGuru.count({ where: { guruId: g.id } })) === 0) {
      const y = 1998 + (i % 12);
      const rows = [
        { guruId: g.id, jenjang: "SMA", namaSekolah: `${pick(SMA, i)} Bandung`, jurusan: "IPA", tahunLulus: String(y) },
        { guruId: g.id, jenjang: "S1", namaSekolah: pick(PT, i), jurusan: pick(JUR, i), tahunLulus: String(y + 4) },
      ];
      if (i % 3 === 0) rows.push({ guruId: g.id, jenjang: "S2", namaSekolah: pick(PT, i + 2), jurusan: "Manajemen Pendidikan", tahunLulus: String(y + 9) });
      await prisma.pendidikanGuru.createMany({ data: rows }); pend += rows.length;
    }

    // 3) sertifikasi (~3/4 punya; i%4===3 belum sertifikasi; i===3 expired-soon)
    if ((await prisma.sertifikasiGuru.count({ where: { guruId: g.id } })) === 0 && i % 4 !== 3) {
      const terbit = 2012 + (i % 10);
      const expired = i === 3 ? today.getFullYear() : terbit + 10; // i===3 → expired tahun ini (warning)
      await prisma.sertifikasiGuru.create({ data: { guruId: g.id, jenis: "Sertifikasi Pendidik", nama: "Sertifikasi Pendidik", penerbit: "Kemdikbud", nomor: String(2018000 + g.id), tahunTerbit: terbit, tahunExpired: expired } });
      sert++;
      if (i % 3 === 0) { await prisma.sertifikasiGuru.create({ data: { guruId: g.id, jenis: "Pelatihan", nama: "Pelatihan Kurikulum Merdeka 90 JP", penerbit: "BBGP Jawa Barat", tahunTerbit: 2022, predikat: "Sangat Memuaskan" } }); sert++; }
    }

    // 4) penghargaan (sebagian)
    if (i % 3 === 1 && (await prisma.penghargaanGuru.count({ where: { guruId: g.id } })) === 0) {
      const pr = pick(PENGHARGAAN, i);
      await prisma.penghargaanGuru.create({ data: { guruId: g.id, nama: pr.nama, tahun: 2020 + (i % 5), pemberi: pr.pemberi, tingkat: pr.tingkat, ranking: pr.ranking } }); peng++;
    }

    // 5) kehadiran setahun (hari kerja) — skip jika sudah ada (tak ada unique)
    if ((await prisma.kehadiranGuru.count({ where: { guruId: g.id } })) === 0) {
      const rows = [];
      for (let d = 0; d < 300; d++) {
        const dt = new Date(today); dt.setDate(dt.getDate() - d);
        const dow = dt.getDay(); if (dow === 0 || dow === 6) continue;
        const k = (g.id * 3 + d) % 100;
        const status = k < 2 ? "alpa" : k < 5 ? "izin" : k < 9 ? "sakit" : k < 15 ? "terlambat" : "hadir";
        rows.push({ sekolahId: SID, guruId: g.id, tanggal: dt, status });
      }
      const r = await prisma.kehadiranGuru.createMany({ data: rows }); hadir += r.count;
    }

    // 6) PKG (RekapKinerjaGuru) — 5 dimensi + skor akhir
    if (periode) {
      const base = 80 + ((i * 13) % 15);
      const v = (o) => clamp(base + (((i * 7 + o * 5) % 11) - 5));
      const dims = { p: v(1), k: v(2), s: v(3), pr: v(4), ko: v(5) };
      const skor = Math.round(((dims.p + dims.k + dims.s + dims.pr + dims.ko) / 5) * 10) / 10;
      await prisma.rekapKinerjaGuru.upsert({
        where: { guruId_periodeId: { guruId: g.id, periodeId: periode.id } },
        create: { guruId: g.id, periodeId: periode.id, skorAkhir: skor, predikat: PREDIKAT(skor), skorPedagogik: dims.p, skorKepribadian: dims.k, skorSosial: dims.s, skorProfesional: dims.pr, skorKomitmen: dims.ko, catatanKepsek: "Menunjukkan dedikasi tinggi dan konsistensi dalam mengajar. Pertahankan dan tingkatkan kolaborasi lintas mapel.", ceritaImpact: "Membentuk budaya belajar yang menyenangkan; rata-rata nilai kelas yang diampu meningkat konsisten dua tahun terakhir." },
        update: {},
      }); pkg++;
    }

    // 7) evaluasi kelas (3 observasi)
    if ((await prisma.evaluasiKelas.count({ where: { guruId: g.id } })) === 0) {
      for (let e = 0; e < 3; e++) {
        const ob = pick(OBS, i + e);
        const tgl = new Date(today); tgl.setMonth(tgl.getMonth() - e - 1);
        const pred = ["A+", "A", "B+"][e];
        await prisma.evaluasiKelas.create({ data: { guruId: g.id, observerNama: ob.n, observerRole: ob.r, mapel: null, kelas: pick(["XI IPA 1", "X MIPA 2", "XII IPA"], i + e), tanggal: tgl, topik: pick(TOPIK, i + e), predikat: pred, catatan: pick(EV_CAT, e) } }); ev5++;
      }
    }
  }

  // 8) peringkat PKG per sekolah (isi peringkatSekolah dari skorAkhir)
  if (periode) {
    const rk = await prisma.rekapKinerjaGuru.findMany({ where: { periodeId: periode.id, guru: { sekolahId: SID } }, select: { id: true, skorAkhir: true }, orderBy: { skorAkhir: "desc" } });
    for (let r = 0; r < rk.length; r++) await prisma.rekapKinerjaGuru.update({ where: { id: rk[r].id }, data: { peringkatSekolah: r + 1 } });
  }

  console.log(`foto:${foto} pendidikan:${pend} sertifikasi:${sert} penghargaan:${peng} kehadiran:${hadir} PKG:${pkg} evaluasi:${ev5} / ${guru.length} guru`);
  console.log(`Cek: /guru  ·  /guru/${guru[1]?.id}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
