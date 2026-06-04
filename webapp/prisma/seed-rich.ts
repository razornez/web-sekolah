/**
 * Seed data LENGKAP & KAYA untuk semua modul.
 * Jalankan: npm run seed:rich
 * Idempoten — aman dijalankan ulang.
 */
import {
  PrismaClient,
  StatusPresensi,
  StatusPembayaran,
  StatusPpdb,
  JenisKelamin,
  TipeSoal,
  PredikatP5,
  PengumumanTarget,
} from "@prisma/client";

const prisma = new PrismaClient();

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(0, 0, 0, 0); return dt; };
const today = new Date().toISOString().slice(0, 10);

// ── Realistic Indonesian school names / data pools ──────────────────────────
const NAMA_DEPAN = ["Ahmad","Rizki","Siti","Nur","Muhammad","Andi","Dewi","Rini","Budi","Agus","Hendra","Fitri","Maya","Arif","Dian","Fauzi","Ayu","Bagas","Citra","Dimas","Eko","Farah","Gilang","Hana","Irfan","Joko","Kartika","Lestari","Mira","Nanda"];
const NAMA_BELAKANG = ["Santoso","Kusuma","Wijaya","Prasetyo","Rahayu","Susanto","Kurniawan","Hidayat","Saputra","Wibowo","Nugroho","Setiawan","Hartono","Subagyo","Siregar","Harahap","Nasution","Simbolon","Simatupang","Lubis"];
const randNama = () => `${pick(NAMA_DEPAN)} ${pick(NAMA_BELAKANG)}`;

const MAPEL_NAMES = ["Matematika","Bahasa Indonesia","Bahasa Inggris","Fisika","Kimia","Biologi","Sejarah","Geografi","Ekonomi","Sosiologi","PKn","Seni Budaya","PJOK","Prakarya","Informatika"];
const TINGKAT_POOL = ["Kabupaten","Provinsi","Nasional","Sekolah","Kecamatan"];
const EKSTRA_NAMES = ["Pramuka","PMR","Basket","Futsal","Volly","Seni Tari","Paduan Suara","Karya Ilmiah Remaja","Rohis","OSIS","Karate","Pencak Silat","Fotografi","Teater","English Club"];
const BUKU_JUDUL = ["Matematika Dasar","Kimia SMA Kelas X","Fisika Modern","Sejarah Indonesia","Ekonomi Makro","Bahasa Inggris Advanced","Sosiologi Kontemporer","Geografi Nusantara","Biologi Sel","PKn dan Kewarganegaraan","Atlas Dunia Lengkap","Ensiklopedi Sains","Kamus Besar Bahasa Indonesia","Sastra Klasik Indonesia","Novel Laskar Pelangi","Bumi Manusia","Ronggeng Dukuh Paruk","Siti Nurbaya","Salah Asuhan","Max Havelaar","Pramoedya Bercerita","Mereka yang Terlupakan","Teori Relativitas Einstein","Pengantar Ilmu Komputer","Algoritma dan Pemrograman","Database Design","Web Development Modern","Artificial Intelligence","Machine Learning Dasar","Cloud Computing"];
const SARPRAS_NAMA = ["Proyektor LCD","Laptop","PC Desktop","Printer","Scanner","Meja Belajar","Kursi Siswa","Lemari Arsip","AC Ruangan","Kipas Angin","Whiteboard","Spidol Board","Penggaris Besar","Kompas Gambar","Globe Dunia","Alat Peraga Fisika","Mikroskop","Gelas Ukur","Bunsen Burner","Pipet Tetes","Kabel HDMI","Speaker","Kamera","Drone","Tablet Pembelajaran","Smart TV","Meja Guru","Kursi Guru","Filing Cabinet","Brankas"];
const KONDISI = ["Baik","Baik","Baik","Rusak Ringan","Rusak Berat"];
const ELEARNING_JUDUL = ["Pengantar Aljabar Linear","Reaksi Kimia Organik","Hukum Newton","Sejarah Kemerdekaan RI","Globalisasi & Dampaknya","Grammar Bahasa Inggris","Sel dan Organel","Sistem Ekonomi Dunia","Demokrasi Pancasila","Ekosistem Hutan Tropis","Video Tutorial Matematika","Praktikum Fisika Virtual","Simulasi Kimia","Peta Konsep Sejarah","Latihan Soal UN"];
const VIDEO_JUDUL = ["Cara Belajar Efektif","Motivasi Belajar Siswa","Penjelasan Rumus Fisika","Tutorial Kimia Organik","Sejarah Kerajaan Majapahit","Matematika Menyenangkan","Belajar Bahasa Inggris","Geografi Wilayah Indonesia","Ekonomi Dasar","Biologi Sel Hidup"];
const BUKU_DIGITAL_JUDUL = ["E-Book Matematika","E-Book Fisika Modern","Panduan Kimia Praktis","Sejarah Digital","Atlas Digital Nusantara","Kamus Bahasa Inggris Digital","E-Book Biologi","Ekonomi Digital","Sosiologi Modern","PKn Interaktif"];
const ALUMNI_KERJA = ["Bank BRI","Pertamina","Telkom Indonesia","PLN","BUMN","Dosen","Dokter","Pengacara","Wirausaha","PNS","Guru","TNI/POLRI","Insinyur","Programmer","Desainer"];
const ALUMNI_LANJUT = ["Universitas Indonesia","ITB","UGM","Unair","IPB","Undip","ITS","USU","Unhas","Universitas Padjadjaran","Politeknik Negeri","Akademi Kepolisian","Akmil","STAN","Unesa"];

async function main() {
  // ── Resolusi sekolah & data master ──────────────────────────────────────
  const sekolah = await prisma.sekolah.findUnique({ where: { slug: "smartschool" } });
  if (!sekolah) { console.error("Sekolah 'smartschool' tidak ditemukan. Jalankan ETL dulu."); return; }
  const sid = sekolah.id;

  const siswaAll = await prisma.siswa.findMany({ where: { sekolahId: sid, status: "aktif" }, select: { id: true }, take: 500 });
  const guruAll  = await prisma.guru.findMany({ where: { sekolahId: sid }, select: { id: true, namaGuru: true }, take: 50 });
  const rombelAll = await prisma.rombel.findMany({ where: { sekolahId: sid }, select: { id: true, nama: true }, take: 50 });

  const periodeAll = await prisma.periode.findMany({ where: { tahunAjaran: { sekolahId: sid } }, orderBy: { id: "asc" }, take: 10 });
  const periodeAktif = periodeAll.find((p) => p.aktif) ?? periodeAll[0];

  console.log(`📦  ${siswaAll.length} siswa, ${guruAll.length} guru, ${rombelAll.length} rombel`);
  if (!periodeAktif) { console.error("Tidak ada periode."); return; }

  // ── 1. Jenis Kelamin ─────────────────────────────────────────────────────
  let jkFix = 0;
  for (const s of siswaAll) {
    const r = await prisma.siswa.findUnique({ where: { id: s.id }, select: { jenisKelamin: true } });
    if (!r?.jenisKelamin) {
      await prisma.siswa.update({ where: { id: s.id }, data: { jenisKelamin: pick([JenisKelamin.L, JenisKelamin.P]) } });
      jkFix++;
    }
  }
  console.log(`✓ Jenis kelamin: ${jkFix} diperbarui`);

  // ── 2. Mapel (buat bila kurang) ──────────────────────────────────────────
  const mapelExist = await prisma.mapel.findMany({ where: { sekolahId: sid }, select: { id: true, namaMapel: true, kodeMapel: true } });
  for (let i = 0; i < MAPEL_NAMES.length; i++) {
    const nm = MAPEL_NAMES[i];
    const kode = `MPEL${String(i + 1).padStart(2, "0")}`;
    if (!mapelExist.find((m) => m.namaMapel === nm)) {
      await prisma.mapel.upsert({
        where: { sekolahId_kodeMapel: { sekolahId: sid, kodeMapel: kode } },
        update: {},
        create: { sekolahId: sid, namaMapel: nm, kodeMapel: kode, kelompok: "A", kkm: 75, noUrut: i + 1, guruId: guruAll[i % guruAll.length]?.id ?? null },
      });
    }
  }
  const mapelAll = await prisma.mapel.findMany({ where: { sekolahId: sid }, select: { id: true, kkm: true }, take: 20 });
  console.log(`✓ Mapel: ${mapelAll.length} tersedia`);

  // ── 3. Nilai Rapor (semua siswa × semua mapel × periodeAktif) ────────────
  let newNilai = 0;
  const batchSiswa = siswaAll.slice(0, 300);
  for (const s of batchSiswa) {
    for (const m of mapelAll.slice(0, 10)) {
      const exists = await prisma.nilaiRapor.findUnique({ where: { siswaId_mapelId_periodeId: { siswaId: s.id, mapelId: m.id, periodeId: periodeAktif.id } }, select: { id: true } });
      if (!exists) {
        const nilaiAkhir = rnd(65, 98);
        const deskPool = ["Siswa memahami materi dengan sangat baik.","Penguasaan konsep cukup baik, perlu latihan soal lebih banyak.","Menunjukkan kemajuan signifikan dalam pemahaman materi.","Aktif bertanya dan berdiskusi di kelas.","Perlu meningkatkan kedisiplinan dalam mengumpulkan tugas."];
        await prisma.nilaiRapor.create({
          data: { sekolahId: sid, siswaId: s.id, mapelId: m.id, periodeId: periodeAktif.id, rombelId: rombelAll[0]?.id ?? null, kurikulum: sekolah.kurikulumDefault, kkm: m.kkm, nilaiAkhir, nilaiPengetahuan: rnd(65, 98), nilaiKeterampilan: rnd(65, 98), deskripsiCapaian: pick(deskPool) },
        });
        newNilai++;
      }
    }
  }
  console.log(`✓ Nilai rapor: ${newNilai} baris baru`);

  // ── 4. Nilai rapor ekstra + catatan wali kelas ───────────────────────────
  const EKSTRA_RAPOR = [{ nm: "Pramuka", nilai: "Sangat Baik" }, { nm: "PMR", nilai: "Baik" }, { nm: "Basket", nilai: "Baik" }, { nm: "Seni", nilai: "Sangat Baik" }, { nm: "Futsal", nilai: "Cukup" }];
  const CATATAN_POOL = [
    "Siswa aktif dan berprestasi, menjadi teladan bagi teman-temannya.",
    "Perlu meningkatkan kedisiplinan hadir tepat waktu.",
    "Sangat berpotensi dalam bidang sains dan teknologi.",
    "Aktif dalam kegiatan organisasi sekolah.",
    "Menunjukkan perkembangan positif dalam semester ini.",
    "Siswa perlu lebih rajin belajar dan mengerjakan PR.",
    "Memiliki kemampuan kepemimpinan yang menonjol.",
    "Diharapkan dapat mempertahankan prestasi yang telah diraih.",
  ];
  let newEkstra = 0, newCatatan = 0;
  for (const s of batchSiswa.slice(0, 250)) {
    const ex = await prisma.nilaiRaporEkstra.findFirst({ where: { siswaId: s.id, periodeId: periodeAktif.id }, select: { id: true } });
    if (!ex) {
      const e = pick(EKSTRA_RAPOR);
      await prisma.nilaiRaporEkstra.create({ data: { siswaId: s.id, periodeId: periodeAktif.id, namaEkstra: e.nm, nilai: e.nilai, deskripsi: `Aktif mengikuti kegiatan ${e.nm} dengan ${e.nilai.toLowerCase()}.` } });
      newEkstra++;
    }
    const ct = await prisma.raporCatatan.findUnique({ where: { siswaId_periodeId: { siswaId: s.id, periodeId: periodeAktif.id } }, select: { id: true } });
    if (!ct) {
      const sikapPool = ["Sangat Baik", "Baik", "Baik", "Cukup", "Sangat Baik"];
      await prisma.raporCatatan.create({ data: { sekolahId: sid, siswaId: s.id, periodeId: periodeAktif.id, catatan: pick(CATATAN_POOL), sikap: pick(sikapPool) } });
      newCatatan++;
    }
  }
  console.log(`✓ Ekstra rapor: ${newEkstra} | Catatan wali: ${newCatatan}`);

  // ── 5. Kehadiran (90 hari × 400 siswa) ──────────────────────────────────
  const HD_POOL: StatusPresensi[] = ["hadir","hadir","hadir","hadir","hadir","hadir","hadir","hadir","izin","sakit","alpa","terlambat"];
  let newHd = 0;
  for (const s of siswaAll.slice(0, 400)) {
    for (const dago of range(90)) {
      const tanggal = daysAgo(dago);
      if ([0, 6].includes(tanggal.getDay())) continue;
      const exists = await prisma.kehadiranSiswa.findUnique({ where: { siswaId_tanggal: { siswaId: s.id, tanggal } }, select: { id: true } });
      if (!exists) {
        await prisma.kehadiranSiswa.create({ data: { sekolahId: sid, siswaId: s.id, tanggal, status: pick(HD_POOL) } });
        newHd++;
      }
    }
  }
  console.log(`✓ Kehadiran: ${newHd} baris baru`);

  // ── 6. SPP tagihan (12 bulan × 400 siswa) ───────────────────────────────
  let jenisSPP = await prisma.jenisPembayaran.findFirst({ where: { sekolahId: sid }, select: { id: true, nominal: true } });
  if (!jenisSPP) {
    jenisSPP = await prisma.jenisPembayaran.create({ data: { sekolahId: sid, nama: "SPP Bulanan", nominal: 150000 }, select: { id: true, nominal: true } });
  }
  const tahun = new Date().getFullYear();
  const SPP_STATUS: StatusPembayaran[] = ["lunas","lunas","lunas","lunas","lunas","belum","belum","cicil"];
  let newSPP = 0;
  for (const s of siswaAll.slice(0, 400)) {
    for (const bulan of range(12).map((i) => i + 1)) {
      const ex = await prisma.tagihanSpp.findUnique({ where: { siswaId_jenisId_bulan_tahun: { siswaId: s.id, jenisId: jenisSPP.id, bulan, tahun } }, select: { id: true } });
      if (!ex) {
        await prisma.tagihanSpp.create({ data: { sekolahId: sid, siswaId: s.id, jenisId: jenisSPP.id, bulan, tahun, nominal: jenisSPP.nominal, status: pick(SPP_STATUS) } });
        newSPP++;
      }
    }
  }
  console.log(`✓ Tagihan SPP: ${newSPP} baris baru`);

  // ── 7. Kasus BK ──────────────────────────────────────────────────────────
  const KAT_NAMES = ["Terlambat","Seragam tidak lengkap","Tidak membawa buku","Bermain HP","Berkelahi","Tidak mengerjakan PR","Bolos pelajaran","Merusak fasilitas sekolah"];
  for (let i = 0; i < KAT_NAMES.length; i++) {
    const kn = KAT_NAMES[i];
    const ex = await prisma.kategoriKasus.findFirst({ where: { sekolahId: sid, nama: kn }, select: { id: true } });
    if (!ex) await prisma.kategoriKasus.create({ data: { sekolahId: sid, nama: kn, poin: (i + 1) * 5 } });
  }
  const katList = await prisma.kategoriKasus.findMany({ where: { sekolahId: sid }, select: { id: true, nama: true, poin: true } });
  let newKasus = 0;
  for (const s of siswaAll.slice(0, 150)) {
    const count = await prisma.kasusSiswa.count({ where: { siswaId: s.id, sekolahId: sid } });
    const target = rnd(1, 3);
    for (let i = count; i < target; i++) {
      const cat = pick(katList);
      await prisma.kasusSiswa.create({ data: { sekolahId: sid, siswaId: s.id, kategoriId: cat.id, namaKasus: cat.nama, poin: cat.poin, tanggal: daysAgo(rnd(1, 180)) } });
      newKasus++;
    }
  }
  console.log(`✓ Kasus BK: ${newKasus} baris baru`);

  // ── 8. Prestasi & Beasiswa ───────────────────────────────────────────────
  const PRESTASI_POOL = ["Juara 1 OSN Matematika","Juara 2 OSN Fisika","Juara 3 OSN Kimia","Juara 1 FLS2N Seni Lukis","Juara 1 O2SN Atletik","Juara 2 LKS Akuntansi","Juara 1 Cerdas Cermat","Juara 1 Lomba Karya Tulis","Peserta Olimpiade Nasional","Juara 1 Futsal Pelajar","Juara 2 Voli Antar Sekolah","Finalis FL2SN","Juara 1 Debat Bahasa Inggris","Juara 1 Lomba Fotografi","Juara 2 Pidato Bahasa Indonesia"];
  const BEASISWA_POOL = ["KIP Kuliah","Beasiswa Bidikmisi","Beasiswa Prestasi Akademik","Beasiswa Daerah","Beasiswa Perusahaan","Bantuan PIP","Beasiswa Tahfidz","Beasiswa Yayasan Pendidikan","Beasiswa Guru Berprestasi","Beasiswa Bank Indonesia"];
  let newPrestasi = 0, newBeasiswa = 0;
  for (const s of siswaAll.slice(0, 200)) {
    const pc = await prisma.prestasiSiswa.count({ where: { siswaId: s.id } });
    const target = rnd(1, 3);
    for (let i = pc; i < target; i++) {
      await prisma.prestasiSiswa.create({ data: { siswaId: s.id, namaPrestasi: pick(PRESTASI_POOL), tingkat: pick(TINGKAT_POOL), tahun: String(tahun - rnd(0, 2)), tanggal: daysAgo(rnd(1, 365)) } });
      newPrestasi++;
    }
    const bc = await prisma.beasiswaSiswa.count({ where: { siswaId: s.id } });
    if (bc === 0 && Math.random() > 0.6) {
      await prisma.beasiswaSiswa.create({ data: { siswaId: s.id, nama: pick(BEASISWA_POOL), tahun: String(tahun), nominal: pick([500000, 1000000, 2400000, 3600000, 500000]) } });
      newBeasiswa++;
    }
  }
  console.log(`✓ Prestasi: ${newPrestasi} | Beasiswa: ${newBeasiswa}`);

  // ── 9. Mutasi siswa ──────────────────────────────────────────────────────
  const SEKOLAH_ASAL = ["SMA Negeri 1 Kota","SMP Negeri 2 Kabupaten","SMA Swasta Harapan Bangsa","SMA Islam Terpadu","Madrasah Aliyah Negeri","SMA Internasional","SMAN 3 Provinsi"];
  let newMutasi = 0;
  for (const s of siswaAll.slice(0, 25)) {
    const ex = await prisma.mutasiSiswa.findFirst({ where: { siswaId: s.id }, select: { id: true } });
    if (!ex) {
      await prisma.mutasiSiswa.create({ data: { sekolahId: sid, siswaId: s.id, jenis: pick(["masuk", "keluar"]), asalSekolah: pick(SEKOLAH_ASAL), alasan: pick(["Pindah domisili","Ikut orang tua","Melanjutkan ke pesantren","Atas permintaan keluarga"]), tanggal: daysAgo(rnd(1, 180)) } });
      newMutasi++;
    }
  }
  console.log(`✓ Mutasi: ${newMutasi}`);

  // ── 10. Ekstrakurikuler + Anggota ────────────────────────────────────────
  let newEkstraOrg = 0, newAnggotaEkstra = 0;
  for (let i = 0; i < 8; i++) {
    const nm = EKSTRA_NAMES[i];
    let ek = await prisma.ekstrakurikuler.findFirst({ where: { sekolahId: sid, nama: nm }, select: { id: true } });
    if (!ek) { ek = await prisma.ekstrakurikuler.create({ data: { sekolahId: sid, nama: nm, pembinaGuruId: guruAll[i % guruAll.length]?.id ?? null } }); newEkstraOrg++; }
    const batchSiswaEkstra = siswaAll.slice(i * 25, i * 25 + rnd(20, 40));
    for (const s of batchSiswaEkstra) {
      const ex = await prisma.anggotaEkstra.findUnique({ where: { ekstraId_siswaId: { ekstraId: ek.id, siswaId: s.id } }, select: { id: true } });
      if (!ex) { await prisma.anggotaEkstra.create({ data: { ekstraId: ek.id, siswaId: s.id } }); newAnggotaEkstra++; }
    }
  }
  console.log(`✓ Ekstra: ${newEkstraOrg} baru | Anggota: ${newAnggotaEkstra}`);

  // ── 11. Jurnal Guru (30 per guru) ────────────────────────────────────────
  const KELAS_POOL = rombelAll.map((r) => r.nama);
  const MATERI_POOL = ["Pengantar Bab Baru","Review Materi Kemarin","Latihan Soal","Diskusi Kelompok","Presentasi Siswa","Ujian Harian","Kuis Singkat","Praktikum","Pengayaan Materi","Remedial","Proyek Kelompok","Observasi Lapangan","Film Edukatif","Game Edukatif","Tugas Mandiri"];
  let newJurnal = 0;
  for (const g of guruAll) {
    const count = await prisma.jurnalGuru.count({ where: { sekolahId: sid, guruId: g.id } });
    const target = 30;
    for (let i = count; i < target; i++) {
      await prisma.jurnalGuru.create({ data: { sekolahId: sid, guruId: g.id, tanggal: daysAgo(rnd(1, 90)), kelas: pick(KELAS_POOL.length ? KELAS_POOL : ["X"]), mapel: pick(MAPEL_NAMES), materi: pick(MATERI_POOL), deskripsi: `Siswa antusias mengikuti ${pick(MATERI_POOL).toLowerCase()}.` } });
      newJurnal++;
    }
  }
  console.log(`✓ Jurnal guru: ${newJurnal}`);

  // ── 12. Jadwal Guru ──────────────────────────────────────────────────────
  const HARI_LIST = ["Senin","Selasa","Rabu","Kamis","Jumat"];
  const JAM_LIST = [["07:00","08:30"],["08:30","10:00"],["10:15","11:45"],["11:45","13:15"],["13:30","15:00"]];
  let newJadwal = 0;
  for (const g of guruAll.slice(0, 10)) {
    for (let hi = 0; hi < 5; hi++) {
      const hariNama = HARI_LIST[hi];
      let hari = await prisma.hari.findFirst({ where: { sekolahId: sid, nama: hariNama }, select: { id: true } });
      if (!hari) hari = await prisma.hari.create({ data: { sekolahId: sid, nama: hariNama, urutan: hi + 1 }, select: { id: true } });
      const jam = pick(JAM_LIST);
      const exists = await prisma.jadwalGuru.findFirst({ where: { sekolahId: sid, guruId: g.id, hariId: hari.id }, select: { id: true } });
      if (!exists) {
        await prisma.jadwalGuru.create({ data: { sekolahId: sid, guruId: g.id, hariId: hari.id, rombelId: rombelAll[hi % rombelAll.length]?.id ?? null, mapel: pick(MAPEL_NAMES), jamMulai: jam[0], jamSelesai: jam[1] } });
        newJadwal++;
      }
    }
  }
  console.log(`✓ Jadwal guru: ${newJadwal}`);

  // ── 13. E-Learning ───────────────────────────────────────────────────────
  let newElearning = 0;
  for (let i = 0; i < ELEARNING_JUDUL.length; i++) {
    const nm = ELEARNING_JUDUL[i];
    const ex = await prisma.elearning.findFirst({ where: { sekolahId: sid, judul: nm }, select: { id: true } });
    if (!ex) {
      await prisma.elearning.create({ data: { sekolahId: sid, guruId: guruAll[i % guruAll.length]?.id ?? null, judul: nm, deskripsi: `Materi pembelajaran ${nm} untuk meningkatkan pemahaman siswa.`, link: `https://youtube.com/watch?v=example${i}`, kelas: pick(KELAS_POOL.length ? KELAS_POOL : ["X"]), mapel: pick(MAPEL_NAMES) } });
      newElearning++;
    }
  }
  console.log(`✓ E-Learning: ${newElearning}`);

  // ── 14. Video Pembelajaran ───────────────────────────────────────────────
  let newVideo = 0;
  for (let i = 0; i < VIDEO_JUDUL.length; i++) {
    const nm = VIDEO_JUDUL[i];
    const ex = await prisma.videoPembelajaran.findFirst({ where: { sekolahId: sid, judul: nm }, select: { id: true } });
    if (!ex) {
      await prisma.videoPembelajaran.create({ data: { sekolahId: sid, judul: nm, deskripsi: `Video edukatif: ${nm}`, url: `https://youtube.com/watch?v=vid${i}` } });
      newVideo++;
    }
  }
  console.log(`✓ Video: ${newVideo}`);

  // ── 15. Buku Digital ─────────────────────────────────────────────────────
  let newBukuDig = 0;
  for (let i = 0; i < BUKU_DIGITAL_JUDUL.length; i++) {
    const nm = BUKU_DIGITAL_JUDUL[i];
    const ex = await prisma.bukuDigital.findFirst({ where: { sekolahId: sid, judul: nm }, select: { id: true } });
    if (!ex) {
      await prisma.bukuDigital.create({ data: { sekolahId: sid, judul: nm, pengarang: randNama(), file: `/uploads/buku/${nm.replace(/\s/g, "_")}.pdf` } });
      newBukuDig++;
    }
  }
  console.log(`✓ Buku Digital: ${newBukuDig}`);

  // ── 16. Perpustakaan: Buku + Peminjaman ──────────────────────────────────
  let newBuku = 0, newPinjam = 0;
  for (let i = 0; i < BUKU_JUDUL.length; i++) {
    const jdl = BUKU_JUDUL[i];
    const ex = await prisma.bukuPerpustakaan.findFirst({ where: { sekolahId: sid, judul: jdl }, select: { id: true } });
    if (!ex) {
      await prisma.bukuPerpustakaan.create({ data: { sekolahId: sid, judul: jdl, pengarang: randNama(), penerbit: pick(["Erlangga","Gramedia","Balai Pustaka","Yudhistira","Esis","Intan Pariwara","Tiga Serangkai"]), tahunTerbit: String(rnd(2015, 2024)), isbn: `978-${rnd(600,700)}-${rnd(1000,9999)}-${rnd(10,99)}-${rnd(0,9)}`, jumlahBuku: rnd(3, 10), jumlahEksemplar: rnd(5, 15) } });
      newBuku++;
    }
  }
  const bukuAll = await prisma.bukuPerpustakaan.findMany({ where: { sekolahId: sid }, select: { id: true }, take: 30 });
  for (const s of siswaAll.slice(0, 80)) {
    const kembali = Math.random() > 0.4;
    const buku = pick(bukuAll);
    const ex = await prisma.pinjamanBuku.findFirst({ where: { sekolahId: sid, siswaId: s.id, bukuId: buku.id, tanggalKembali: null }, select: { id: true } });
    if (!ex) {
      const tgl = daysAgo(rnd(1, 30));
      await prisma.pinjamanBuku.create({ data: { sekolahId: sid, bukuId: buku.id, siswaId: s.id, durasiHari: 7, tanggalPinjam: tgl, tanggalKembali: kembali ? daysAgo(rnd(0, 5)) : null } });
      newPinjam++;
    }
  }
  console.log(`✓ Buku perpus: ${newBuku} | Pinjaman: ${newPinjam}`);

  // ── 17. Sarana Prasarana ─────────────────────────────────────────────────
  let katSarpras = await prisma.kategoriSarpras.findFirst({ where: { sekolahId: sid }, select: { id: true } });
  if (!katSarpras) katSarpras = await prisma.kategoriSarpras.create({ data: { sekolahId: sid, nama: "Elektronik" } });
  const katElektronik = katSarpras;
  let katMebel = await prisma.kategoriSarpras.findFirst({ where: { sekolahId: sid, nama: "Mebel & Perabot" }, select: { id: true } });
  if (!katMebel) katMebel = await prisma.kategoriSarpras.create({ data: { sekolahId: sid, nama: "Mebel & Perabot" } });
  let katLab = await prisma.kategoriSarpras.findFirst({ where: { sekolahId: sid, nama: "Alat Laboratorium" }, select: { id: true } });
  if (!katLab) katLab = await prisma.kategoriSarpras.create({ data: { sekolahId: sid, nama: "Alat Laboratorium" } });
  const katMap: Record<string, number> = { Proyektor:katElektronik.id, Laptop:katElektronik.id, PC:katElektronik.id, Printer:katElektronik.id, Scanner:katElektronik.id, AC:katElektronik.id, Speaker:katElektronik.id, Kamera:katElektronik.id, Drone:katElektronik.id, Tablet:katElektronik.id, "Smart TV":katElektronik.id, Meja:katMebel.id, Kursi:katMebel.id, Lemari:katMebel.id, Filing:katMebel.id, Brankas:katMebel.id, Whiteboard:katMebel.id, Mikroskop:katLab.id, Gelas:katLab.id, Bunsen:katLab.id, Pipet:katLab.id };
  let newSarpras = 0;
  for (let i = 0; i < SARPRAS_NAMA.length; i++) {
    const nm = SARPRAS_NAMA[i];
    const ex = await prisma.sarpras.findFirst({ where: { sekolahId: sid, nama: nm }, select: { id: true } });
    if (!ex) {
      const firstWord = nm.split(" ")[0];
      const katId = Object.entries(katMap).find(([k]) => nm.includes(k))?.[1] ?? katElektronik.id;
      await prisma.sarpras.create({ data: { sekolahId: sid, kategoriId: katId, nama: nm, jumlah: rnd(1, 20), kondisi: pick(KONDISI), keterangan: `Diadakan tahun ${rnd(2018, 2024)}.` } });
      newSarpras++;
    }
  }
  console.log(`✓ Sarpras: ${newSarpras}`);

  // ── 18. PPDB Pendaftar ───────────────────────────────────────────────────
  let jalurPPDB = await prisma.jalurPpdb.findFirst({ where: { sekolahId: sid }, select: { id: true } });
  if (!jalurPPDB) jalurPPDB = await prisma.jalurPpdb.create({ data: { sekolahId: sid, nama: "Reguler", kuota: 200 } });
  const JALUR_EXTRA = ["Prestasi","Zonasi","Afirmasi"];
  for (const jn of JALUR_EXTRA) {
    const ex = await prisma.jalurPpdb.findFirst({ where: { sekolahId: sid, nama: jn }, select: { id: true } });
    if (!ex) await prisma.jalurPpdb.create({ data: { sekolahId: sid, nama: jn, kuota: rnd(30, 80) } });
  }
  const jalurAll = await prisma.jalurPpdb.findMany({ where: { sekolahId: sid }, select: { id: true } });
  const STATUS_PPDB: StatusPpdb[] = ["baru","baru","baru","diterima","diterima","ditolak","cadangan"];
  const existPPDB = await prisma.pendaftaranPpdb.count({ where: { sekolahId: sid } });
  let newPPDB = 0;
  for (let i = existPPDB; i < 80; i++) {
    await prisma.pendaftaranPpdb.create({ data: { sekolahId: sid, jalurId: pick(jalurAll).id, namaLengkap: randNama(), jenisKelamin: pick([JenisKelamin.L, JenisKelamin.P]), nisn: `${rnd(100000,999999)}`, tempatLahir: pick(["Surabaya","Bandung","Medan","Makassar","Semarang","Yogyakarta","Denpasar","Palembang"]), tanggalLahir: new Date(rnd(2005, 2008), rnd(0,11), rnd(1, 28)), asalSekolah: `SMP Negeri ${rnd(1, 10)} ${pick(["Kota","Kabupaten"])}`, noHp: `08${rnd(10,99)}${rnd(10000000,99999999)}`, status: pick(STATUS_PPDB) } });
    newPPDB++;
  }
  console.log(`✓ PPDB: ${newPPDB} pendaftar baru`);

  // ── 19. Alumni ───────────────────────────────────────────────────────────
  const existAlumni = await prisma.alumni.count({ where: { sekolahId: sid } });
  let newAlumni = 0;
  for (let i = existAlumni; i < 60; i++) {
    const bekerja = Math.random() > 0.5;
    await prisma.alumni.create({ data: { sekolahId: sid, nama: randNama(), tahunLulus: String(rnd(2018, 2023)), pekerjaan: bekerja ? pick(ALUMNI_KERJA) : null, lanjutKe: !bekerja ? pick(ALUMNI_LANJUT) : null, noHp: `08${rnd(10,99)}${rnd(10000000,99999999)}` } });
    newAlumni++;
  }
  console.log(`✓ Alumni: ${newAlumni}`);

  // ── 20. Pengumuman ───────────────────────────────────────────────────────
  const PENGUMUMAN_DATA = [
    { judul: "Jadwal UTS Semester Ganjil 2024/2025", isi: "Ujian Tengah Semester akan dilaksanakan tanggal 15-20 Oktober 2024. Siswa diwajibkan hadir 15 menit sebelum ujian dimulai.", target: PengumumanTarget.siswa, pinned: true },
    { judul: "Pembayaran SPP Bulan Oktober", isi: "Pembayaran SPP bulan Oktober dapat dilakukan di bendahara sekolah setiap hari Senin-Jumat pukul 08.00-14.00.", target: PengumumanTarget.siswa, pinned: false },
    { judul: "Rapat Guru Bulanan", isi: "Rapat guru bulanan akan diadakan Sabtu, 12 Oktober 2024 pukul 08.00 di ruang rapat.", target: PengumumanTarget.staf, pinned: false },
    { judul: "Pengumuman Hasil Seleksi PPDB Jalur Prestasi", isi: "Hasil seleksi PPDB jalur prestasi telah diumumkan. Silakan cek di papan pengumuman sekolah atau website resmi.", target: PengumumanTarget.semua, pinned: false },
    { judul: "Rapat Orang Tua Wali Semester Ganjil", isi: "Rapat orang tua dan wali murid akan diadakan Sabtu, 19 Oktober 2024 pukul 09.00 WIB di aula sekolah. Kehadiran sangat diharapkan.", target: PengumumanTarget.ortu, pinned: true },
    { judul: "Kegiatan Class Meeting Pasca UTS", isi: "Setelah UTS, akan diadakan class meeting berupa berbagai lomba antarkelas selama 3 hari. Informasi lebih lanjut menyusul.", target: PengumumanTarget.siswa, pinned: false },
    { judul: "Workshop Peningkatan Kompetensi Guru", isi: "Dinas Pendidikan menyelenggarakan workshop peningkatan kompetensi guru pada 25-26 Oktober 2024.", target: PengumumanTarget.staf, pinned: false },
    { judul: "HUT Sekolah ke-45", isi: "Dalam rangka memperingati HUT Sekolah yang ke-45, akan diadakan berbagai kegiatan lomba, pameran karya siswa, dan pertunjukan seni.", target: PengumumanTarget.semua, pinned: true },
    { judul: "Beasiswa Berprestasi Tahun 2024", isi: "Tersedia beasiswa untuk siswa berprestasi dengan nilai rata-rata 85. Pendaftaran dibuka hingga 31 Oktober 2024.", target: PengumumanTarget.siswa, pinned: false },
    { judul: "Jadwal Piket Kebersihan Kelas", isi: "Jadwal piket kebersihan kelas telah diperbarui. Setiap kelas bertanggung jawab atas kebersihan kelasnya masing-masing.", target: PengumumanTarget.siswa, pinned: false },
  ];
  let newPengumuman = 0;
  for (const p of PENGUMUMAN_DATA) {
    const ex = await prisma.pengumuman.findFirst({ where: { sekolahId: sid, judul: p.judul }, select: { id: true } });
    if (!ex) { await prisma.pengumuman.create({ data: { sekolahId: sid, ...p } }); newPengumuman++; }
  }
  console.log(`✓ Pengumuman: ${newPengumuman}`);

  // ── 21. Counter (statistik pengunjung 60 hari) ──────────────────────────
  let newCounter = 0;
  for (const dago of range(60)) {
    const tanggal = daysAgo(dago);
    const ex = await prisma.counter.findFirst({ where: { sekolahId: sid, tanggal }, select: { id: true } });
    if (!ex) {
      await prisma.counter.create({ data: { sekolahId: sid, tanggal, hits: rnd(30, 250) } });
      newCounter++;
    }
  }
  console.log(`✓ Counter: ${newCounter} hari`);

  // ── 22. Tugas LMS + Pengumpulan ──────────────────────────────────────────
  const TUGAS_DATA = [
    { judul: "Essay Sejarah Kemerdekaan RI", mapel: "Sejarah", deskripsi: "Tulis essay min 500 kata tentang perjuangan kemerdekaan Indonesia." },
    { judul: "Soal Latihan Matematika Bab 3", mapel: "Matematika", deskripsi: "Kerjakan soal latihan halaman 87-90 buku paket." },
    { judul: "Proyek Presentasi Fisika", mapel: "Fisika", deskripsi: "Buat presentasi tentang Hukum Newton dan aplikasinya dalam kehidupan." },
    { judul: "Laporan Praktikum Kimia", mapel: "Kimia", deskripsi: "Tulis laporan praktikum titrasi asam basa." },
    { judul: "Review Buku Sastra", mapel: "Bahasa Indonesia", deskripsi: "Buat ulasan buku novel pilihan min 300 kata." },
  ];
  let newTugas = 0, newKumpul = 0;
  for (const td of TUGAS_DATA) {
    let tgs = await prisma.tugas.findFirst({ where: { sekolahId: sid, judul: td.judul }, select: { id: true } });
    if (!tgs) {
      tgs = await prisma.tugas.create({ data: { sekolahId: sid, guruId: guruAll[0]?.id ?? null, judul: td.judul, mapel: td.mapel, deskripsi: td.deskripsi, rombelId: rombelAll[0]?.id ?? null, deadline: new Date(Date.now() + rnd(3, 14) * 86400000) } });
      newTugas++;
    }
    for (const s of siswaAll.slice(0, 50)) {
      const ex = await prisma.pengumpulanTugas.findUnique({ where: { tugasId_siswaId: { tugasId: tgs.id, siswaId: s.id } }, select: { id: true } });
      if (!ex && Math.random() > 0.3) {
        const jawaban = pick(["Terlampir di link berikut.","Sudah dikerjakan di buku tugas.","Jawaban saya di sini: ...",""]);
        await prisma.pengumpulanTugas.create({ data: { tugasId: tgs.id, siswaId: s.id, teks: jawaban || null, nilai: Math.random() > 0.5 ? rnd(70, 100) : null } });
        newKumpul++;
      }
    }
  }
  console.log(`✓ Tugas: ${newTugas} | Pengumpulan: ${newKumpul}`);

  // ── 23. Ujian: tambah soal ke ujian demo ─────────────────────────────────
  const ujianDemo = await prisma.ujian.findFirst({ where: { sekolahId: sid, judul: "Ujian Demo CBT" }, select: { id: true } });
  if (ujianDemo) {
    const soalCount = await prisma.soal.count({ where: { ujianId: ujianDemo.id } });
    if (soalCount < 10) {
      const SOAL_PG = [
        { q: "Berapakah hasil dari 2³ + 3² ?", opsi: [["A","17"],["B","12"],["C","8"],["D","9"]], kunci: "A" },
        { q: "Siapakah presiden pertama Indonesia?", opsi: [["A","Soekarno"],["B","Soeharto"],["C","Habibie"],["D","Wahid"]], kunci: "A" },
        { q: "Rumus kimia air adalah?", opsi: [["A","CO₂"],["B","H₂O"],["C","O₂"],["D","NaCl"]], kunci: "B" },
        { q: "Ibukota Jawa Barat adalah?", opsi: [["A","Bandung"],["B","Surabaya"],["C","Semarang"],["D","Yogyakarta"]], kunci: "A" },
        { q: "Berapa jumlah provinsi di Indonesia (2024)?", opsi: [["A","33"],["B","34"],["C","37"],["D","38"]], kunci: "D" },
        { q: "Bahasa resmi negara Indonesia adalah?", opsi: [["A","Jawa"],["B","Sunda"],["C","Indonesia"],["D","Melayu"]], kunci: "C" },
        { q: "Apakah kepanjangan dari NKRI?", opsi: [["A","Negara Kesatuan Republik Indonesia"],["B","Negara Kebangsaan Rakyat Indonesia"],["C","Negara Kesejahteraan Rakyat Indonesia"],["D","Negara Kepulauan Republik Indonesia"]], kunci: "A" },
        { q: "Pada tanggal berapa Indonesia merdeka?", opsi: [["A","17 Agustus 1945"],["B","17 Agustus 1949"],["C","17 Juli 1945"],["D","17 September 1945"]], kunci: "A" },
      ];
      for (let i = soalCount; i < SOAL_PG.length + 2 && i < 10; i++) {
        if (i < SOAL_PG.length) {
          const sq = SOAL_PG[i];
          await prisma.soal.create({ data: { ujianId: ujianDemo.id, nomor: i + 1, pertanyaan: sq.q, tipe: TipeSoal.pilihan_ganda, opsi: sq.opsi.map(([label, teks]) => ({ label, teks })), kunci: sq.kunci, bobot: 1 } });
        } else {
          await prisma.soal.create({ data: { ujianId: ujianDemo.id, nomor: i + 1, pertanyaan: "Jelaskan salah satu nilai-nilai Pancasila dan contoh penerapannya dalam kehidupan sehari-hari!", tipe: TipeSoal.esai, bobot: 3 } });
        }
      }
      console.log("✓ Soal ujian demo dilengkapi.");
    }
  }

  // ── 24. P5 Projek ────────────────────────────────────────────────────────
  if (periodeAll.length > 0) {
    const taId = periodeAktif.tahunAjaranId;
    const projekEx = await prisma.projekP5.findFirst({ where: { sekolahId: sid, tahunAjaranId: taId }, select: { id: true } });
    if (!projekEx) {
      const proj = await prisma.projekP5.create({ data: { sekolahId: sid, tahunAjaranId: taId, tema: "Kearifan Lokal", judul: "Mengenal Budaya Daerahku", deskripsi: "Siswa mengeksplorasi dan mendokumentasikan kearifan lokal daerahnya." } });
      const elemenAll = await prisma.elemenProfil.findMany({ take: 5, select: { id: true } });
      for (const e of elemenAll) {
        await prisma.projekP5Target.upsert({ where: { projekP5Id_elemenId: { projekP5Id: proj.id, elemenId: e.id } }, update: {}, create: { projekP5Id: proj.id, elemenId: e.id } });
      }
      const PREDIKAT_P5: PredikatP5[] = ["MB","SB","BSH","BSH","SAB","BSH","BSH","SB"];
      for (const s of siswaAll.slice(0, 100)) {
        for (const e of elemenAll) {
          const ex = await prisma.penilaianP5.findUnique({ where: { projekP5Id_siswaId_elemenId: { projekP5Id: proj.id, siswaId: s.id, elemenId: e.id } }, select: { id: true } });
          if (!ex) await prisma.penilaianP5.create({ data: { projekP5Id: proj.id, siswaId: s.id, elemenId: e.id, predikat: pick(PREDIKAT_P5) } });
        }
      }
      console.log("✓ P5 projek + penilaian dibuat.");
    }
  }

  // ── 25. Buku Tamu ────────────────────────────────────────────────────────
  const existTamu = await prisma.tamu.count({ where: { sekolahId: sid } });
  let newTamu = 0;
  if (existTamu < 20) {
    const INST = ["Dinas Pendidikan","Orang Tua Siswa","Pengawas Sekolah","Media Massa","Komite Sekolah","LSM Pendidikan","Perguruan Tinggi","Perusahaan Sponsor"];
    for (let i = existTamu; i < 20; i++) {
      await prisma.tamu.create({ data: { sekolahId: sid, nama: randNama(), instansi: pick(INST), keperluan: pick(["Kunjungan Kerja","Silaturahim","Monitoring","Wawancara","Rapat Koordinasi","Kunjungan Orang Tua"]), noHp: `08${rnd(10,99)}${rnd(10000000,99999999)}`, tanggal: daysAgo(rnd(0, 60)) } });
      newTamu++;
    }
  }
  console.log(`✓ Tamu: ${newTamu}`);

  // ── 26. Surat Administrasi ───────────────────────────────────────────────
  const existSurat = await prisma.surat.count({ where: { sekolahId: sid } });
  let newSurat = 0;
  if (existSurat < 15) {
    const SURAT_DATA = [
      { perihal: "Surat Keterangan Aktif Siswa", jenis: "keluar" },
      { perihal: "Surat Permohonan Beasiswa", jenis: "keluar" },
      { perihal: "Surat Undangan Rapat Orang Tua", jenis: "keluar" },
      { perihal: "Surat Dispensasi Kegiatan", jenis: "masuk" },
      { perihal: "Surat Rekomendasi Prestasi", jenis: "keluar" },
      { perihal: "Surat Keterangan Lulus", jenis: "keluar" },
      { perihal: "Surat Izin Kegiatan Ekstrakurikuler", jenis: "keluar" },
      { perihal: "Surat Pemberitahuan Libur Sekolah", jenis: "keluar" },
    ];
    for (let i = existSurat; i < 15; i++) {
      const sd = SURAT_DATA[i % SURAT_DATA.length];
      await prisma.surat.create({ data: { sekolahId: sid, nomor: `${rnd(100,999)}/SMAN/${rnd(1,12)}/2024`, perihal: sd.perihal, jenis: sd.jenis, isi: `Sehubungan dengan ${sd.perihal.toLowerCase()}, kami sampaikan informasi sebagai berikut...`, tanggal: daysAgo(rnd(0, 60)) } });
      newSurat++;
    }
  }
  console.log(`✓ Surat: ${newSurat}`);

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n✅  Seed rich selesai! Data tersedia di semua modul.");
  console.log("   → Buka http://localhost:3002/dashboard untuk melihat dashboard penuh.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
