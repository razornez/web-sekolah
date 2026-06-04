/**
 * Seed data dummy — buat dashboard & modul terlihat bervariatif.
 * Idempoten: cek exist sebelum insert, aman dijalankan ulang.
 * Jalankan: npx tsx prisma/seed-dummy.ts
 */
import {
  PrismaClient,
  StatusPresensi,
  StatusPembayaran,
  JenisKelamin,
} from "@prisma/client";

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(0,0,0,0); return dt; };

async function main() {
  // 1. Ambil sekolah + periode + siswa + jenis pembayaran
  const sekolah = await prisma.sekolah.findUnique({ where: { slug: "smartschool" } });
  if (!sekolah) { console.log("Sekolah 'smartschool' tidak ditemukan. Jalankan ETL dulu."); return; }
  const sid = sekolah.id;

  const periode = await prisma.periode.findFirst({
    where: { tahunAjaran: { sekolahId: sid, aktif: true } },
    orderBy: { urutan: "asc" },
  });
  if (!periode) { console.log("Tidak ada periode aktif."); return; }

  const siswaList = await prisma.siswa.findMany({
    where: { sekolahId: sid, status: "aktif" },
    select: { id: true, jenisKelamin: true },
    take: 200,
  });
  console.log(`${siswaList.length} siswa aktif ditemukan.`);

  // 2. Jenis Kelamin (update siswa yg masih null agar donut chart terlihat)
  const jkUpdate = [];
  for (const s of siswaList) {
    if (!s.jenisKelamin) {
      jkUpdate.push(
        prisma.siswa.update({
          where: { id: s.id },
          data: { jenisKelamin: pick([JenisKelamin.L, JenisKelamin.P]) },
        })
      );
    }
  }
  if (jkUpdate.length) {
    await prisma.$transaction(jkUpdate);
    console.log(`✓ Jenis kelamin diisi untuk ${jkUpdate.length} siswa.`);
  }

  // 3. Jenis pembayaran (buat bila belum ada)
  const existJenis = await prisma.jenisPembayaran.count({ where: { sekolahId: sid } });
  if (!existJenis) {
    await prisma.jenisPembayaran.createMany({
      data: [
        { sekolahId: sid, nama: "SPP Bulanan", nominal: 150000 },
        { sekolahId: sid, nama: "Uang Gedung", nominal: 500000 },
        { sekolahId: sid, nama: "Dana Buku", nominal: 75000 },
      ],
    });
    console.log("✓ Jenis pembayaran dibuat.");
  }
  const jenisSPP = await prisma.jenisPembayaran.findFirst({ where: { sekolahId: sid, nama: "SPP Bulanan" } });

  // 4. Tagihan SPP (4 bulan × 150 siswa) dengan status bervariasi
  if (jenisSPP) {
    const tahun = new Date().getFullYear();
    const bulanList = [1, 2, 3, 4];
    const statusPool: StatusPembayaran[] = ["lunas", "lunas", "lunas", "belum", "belum", "cicil"];
    let newTagihan = 0;
    const sample = siswaList.slice(0, 150);
    for (const s of sample) {
      for (const bulan of bulanList) {
        const exists = await prisma.tagihanSpp.findUnique({
          where: { siswaId_jenisId_bulan_tahun: { siswaId: s.id, jenisId: jenisSPP.id, bulan, tahun } },
          select: { id: true },
        });
        if (!exists) {
          await prisma.tagihanSpp.create({
            data: { sekolahId: sid, siswaId: s.id, jenisId: jenisSPP.id, bulan, tahun, nominal: jenisSPP.nominal, status: pick(statusPool) },
          });
          newTagihan++;
        }
      }
    }
    console.log(`✓ Tagihan SPP: ${newTagihan} baris baru.`);
  }

  // 5. Kehadiran (30 hari × 150 siswa, bervariasi)
  const hdPool: StatusPresensi[] = [
    "hadir", "hadir", "hadir", "hadir", "hadir", "hadir", "hadir", "hadir",
    "izin", "sakit", "alpa", "terlambat",
  ];
  let newHd = 0;
  const hdSiswa = siswaList.slice(0, 150);
  for (const s of hdSiswa) {
    for (const dago of range(30)) {
      const tanggal = daysAgo(dago);
      const hari = tanggal.getDay();
      if (hari === 0 || hari === 6) continue; // skip sabtu/minggu
      const exists = await prisma.kehadiranSiswa.findUnique({
        where: { siswaId_tanggal: { siswaId: s.id, tanggal } },
        select: { id: true },
      });
      if (!exists) {
        await prisma.kehadiranSiswa.create({
          data: { sekolahId: sid, siswaId: s.id, tanggal, status: pick(hdPool) },
        });
        newHd++;
      }
    }
  }
  console.log(`✓ Kehadiran: ${newHd} baris baru.`);

  // 6. Kategori + kasus pelanggaran
  const katNames = ["Terlambat", "Seragam tidak lengkap", "Tidak membawa buku", "Bermain HP saat belajar"];
  for (const nama of katNames) {
    await prisma.kategoriKasus.upsert({
      where: { id: (await prisma.kategoriKasus.findFirst({ where: { sekolahId: sid, nama }, select: { id: true } }))?.id ?? 0 },
      update: {},
      create: { sekolahId: sid, nama, poin: katNames.indexOf(nama) * 5 + 5 },
    });
  }
  const katList = await prisma.kategoriKasus.findMany({ where: { sekolahId: sid }, select: { id: true, nama: true, poin: true } });
  let newKasus = 0;
  for (const s of siswaList.slice(0, 60)) {
    const cat = pick(katList);
    const existing = await prisma.kasusSiswa.findFirst({ where: { siswaId: s.id, sekolahId: sid }, select: { id: true } });
    if (!existing) {
      await prisma.kasusSiswa.create({
        data: { sekolahId: sid, siswaId: s.id, kategoriId: cat.id, namaKasus: cat.nama, poin: cat.poin, tanggal: daysAgo(Math.floor(Math.random() * 60)) },
      });
      newKasus++;
    }
  }
  console.log(`✓ Kasus: ${newKasus} baris baru.`);

  // 7. Prestasi siswa
  const prestasiNama = [
    "Juara 1 OSN Matematika", "Juara 2 FLS2N Seni Lukis", "Juara 3 LKS",
    "Peserta Olimpiade Sains", "Juara 1 Futsal Pelajar", "Juara 2 PMR",
    "Peraih Beasiswa Bidikmisi", "Juara 1 Debat Bahasa Indonesia",
  ];
  const tingkat = ["Kabupaten", "Provinsi", "Nasional", "Sekolah"];
  let newPrestasi = 0;
  for (const s of siswaList.slice(0, 80)) {
    const existing = await prisma.prestasiSiswa.findFirst({ where: { siswaId: s.id }, select: { id: true } });
    if (!existing) {
      await prisma.prestasiSiswa.create({
        data: {
          siswaId: s.id,
          namaPrestasi: pick(prestasiNama),
          tingkat: pick(tingkat),
          tahun: String(new Date().getFullYear()),
          tanggal: daysAgo(Math.floor(Math.random() * 180)),
        },
      });
      newPrestasi++;
    }
  }
  console.log(`✓ Prestasi: ${newPrestasi} baris baru.`);

  // 8. Beasiswa
  const beasiswaList = ["Beasiswa Bidikmisi", "Beasiswa Prestasi Akademik", "Beasiswa KIP", "Beasiswa Daerah"];
  let newBeasiswa = 0;
  for (const s of siswaList.slice(0, 40)) {
    const existing = await prisma.beasiswaSiswa.findFirst({ where: { siswaId: s.id }, select: { id: true } });
    if (!existing) {
      await prisma.beasiswaSiswa.create({
        data: { siswaId: s.id, nama: pick(beasiswaList), tahun: String(new Date().getFullYear()), nominal: pick([1000000, 2400000, 3600000, 500000]) },
      });
      newBeasiswa++;
    }
  }
  console.log(`✓ Beasiswa: ${newBeasiswa} baris baru.`);

  // 9. Mutasi siswa (in & out)
  let newMutasi = 0;
  for (const s of siswaList.slice(0, 10)) {
    const existing = await prisma.mutasiSiswa.findFirst({ where: { siswaId: s.id }, select: { id: true } });
    if (!existing) {
      await prisma.mutasiSiswa.create({
        data: {
          sekolahId: sid,
          siswaId: s.id,
          jenis: pick(["masuk", "keluar"]),
          asalSekolah: pick(["SMA Negeri 2 Kota", "SMA Swasta Harapan", "SMA Negeri 3 Kabupaten"]),
          alasan: pick(["Pindah domisili", "Ikut orang tua pindah tugas", "Atas permintaan orang tua"]),
          tanggal: daysAgo(Math.floor(Math.random() * 120)),
        },
      });
      newMutasi++;
    }
  }
  console.log(`✓ Mutasi: ${newMutasi} baris baru.`);

  // 10. Catatan wali kelas + nilai rapor ekstra (untuk beberapa siswa)
  const catatanPool = [
    "Siswa menunjukkan perkembangan positif dalam kehadiran dan prestasi.",
    "Perlu perhatian lebih dalam disiplin dan pengerjaan tugas.",
    "Aktif berpartisipasi dalam kegiatan kelas dan ekstrakurikuler.",
    "Menunjukkan kemampuan kepemimpinan yang baik.",
    "Perlu ditingkatkan motivasi belajar dan kedisiplinan waktu.",
  ];
  const sikapPool = ["Sangat Baik", "Baik", "Cukup", "Baik", "Sangat Baik"];
  const ekstraPool = [
    { nama: "Pramuka", nilai: "Sangat Baik", desk: "Aktif mengikuti latihan pramuka setiap pekan." },
    { nama: "PMR", nilai: "Baik", desk: "Berpartisipasi aktif dalam kegiatan PMR." },
    { nama: "Basket", nilai: "Baik", desk: "Rajin latihan dan sportif." },
    { nama: "Seni Musik", nilai: "Sangat Baik", desk: "Bakat seni musik yang menonjol." },
  ];
  let newCatatan = 0;
  for (const s of siswaList.slice(0, 80)) {
    const exists = await prisma.raporCatatan.findUnique({ where: { siswaId_periodeId: { siswaId: s.id, periodeId: periode.id } }, select: { id: true } });
    if (!exists) {
      await prisma.raporCatatan.create({
        data: { sekolahId: sid, siswaId: s.id, periodeId: periode.id, catatan: pick(catatanPool), sikap: pick(sikapPool) },
      });
      newCatatan++;
    }
    const ekstraExists = await prisma.nilaiRaporEkstra.findFirst({ where: { siswaId: s.id, periodeId: periode.id }, select: { id: true } });
    if (!ekstraExists) {
      const e = pick(ekstraPool);
      await prisma.nilaiRaporEkstra.create({ data: { siswaId: s.id, periodeId: periode.id, namaEkstra: e.nama, nilai: e.nilai, deskripsi: e.desk } });
    }
  }
  console.log(`✓ Catatan wali kelas: ${newCatatan} baris baru.`);

  // 11. Pengumuman dummy
  const pengCount = await prisma.pengumuman.count({ where: { sekolahId: sid } });
  if (pengCount < 3) {
    const pengData = [
      { judul: "Jadwal Ujian Tengah Semester", isi: "Ujian Tengah Semester akan dilaksanakan tanggal 10-15 bulan ini. Siswa diwajibkan hadir tepat waktu dan membawa kartu ujian.", target: "siswa" as const, pinned: true },
      { judul: "Rapat Orang Tua Wali Murid", isi: "Rapat orang tua dan wali murid akan diadakan Sabtu depan pukul 09.00 WIB. Kehadiran sangat diharapkan.", target: "ortu" as const, pinned: false },
      { judul: "Peringatan HUT Sekolah", isi: "Dalam rangka peringatan HUT sekolah, akan diadakan berbagai kegiatan lomba dan pameran karya siswa.", target: "semua" as const, pinned: false },
    ];
    for (const p of pengData) {
      const ex = await prisma.pengumuman.findFirst({ where: { sekolahId: sid, judul: p.judul }, select: { id: true } });
      if (!ex) await prisma.pengumuman.create({ data: { sekolahId: sid, ...p } });
    }
    console.log("✓ Pengumuman demo dibuat.");
  }

  console.log("\n✅ Seed dummy selesai. Refresh dashboard di :3002");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
