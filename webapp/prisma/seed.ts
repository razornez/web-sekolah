import { PrismaClient, Jenjang, Kurikulum, Fase, JenisPeriode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =============================================================================
// Referensi nasional: 6 Dimensi Profil Pelajar Pancasila + elemennya.
// (Sub-elemen bersifat fase-spesifik & banyak — ditambah saat modul P5 dibangun.)
// =============================================================================
const DIMENSI_P5: { nama: string; elemen: string[] }[] = [
  {
    nama: "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
    elemen: [
      "Akhlak beragama",
      "Akhlak pribadi",
      "Akhlak kepada manusia",
      "Akhlak kepada alam",
      "Akhlak bernegara",
    ],
  },
  {
    nama: "Berkebinekaan Global",
    elemen: [
      "Mengenal dan menghargai budaya",
      "Komunikasi dan interaksi antar budaya",
      "Refleksi dan tanggung jawab terhadap pengalaman kebinekaan",
      "Berkeadilan sosial",
    ],
  },
  {
    nama: "Bergotong Royong",
    elemen: ["Kolaborasi", "Kepedulian", "Berbagi"],
  },
  {
    nama: "Mandiri",
    elemen: ["Pemahaman diri dan situasi yang dihadapi", "Regulasi diri"],
  },
  {
    nama: "Bernalar Kritis",
    elemen: [
      "Memperoleh dan memproses informasi dan gagasan",
      "Menganalisis dan mengevaluasi penalaran",
      "Merefleksi dan mengevaluasi pemikirannya sendiri",
    ],
  },
  {
    nama: "Kreatif",
    elemen: [
      "Menghasilkan gagasan yang orisinal",
      "Menghasilkan karya dan tindakan yang orisinal",
      "Memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan",
    ],
  },
];

async function seedReferensiP5() {
  for (let i = 0; i < DIMENSI_P5.length; i++) {
    const d = DIMENSI_P5[i];
    const dimensi = await prisma.dimensiProfil.upsert({
      where: { nama: d.nama },
      update: { urutan: i + 1 },
      create: { nama: d.nama, urutan: i + 1 },
    });
    for (const namaElemen of d.elemen) {
      await prisma.elemenProfil.upsert({
        where: { dimensiId_nama: { dimensiId: dimensi.id, nama: namaElemen } },
        update: {},
        create: { dimensiId: dimensi.id, nama: namaElemen },
      });
    }
  }
  console.log(`✓ Referensi P5: ${DIMENSI_P5.length} dimensi + elemen`);
}

// =============================================================================
// Sekolah demo + admin + struktur akademik dasar (SMA, Kurikulum Merdeka).
// =============================================================================
async function seedSekolahDemo() {
  const sekolah = await prisma.sekolah.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      npsn: "12345678",
      nama: "SMA Negeri 1 Demo",
      jenjang: Jenjang.SMA,
      kurikulumDefault: Kurikulum.MERDEKA,
      alamat: "Jl. Pendidikan No. 1",
      kepalaSekolah: "Kepala Sekolah Demo",
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { sekolahId_username: { sekolahId: sekolah.id, username: "admin" } },
    update: {},
    create: {
      sekolahId: sekolah.id,
      username: "admin",
      email: "admin@demo.sch.id",
      passwordHash,
      namaLengkap: "Administrator",
      role: "admin",
    },
  });

  // Tingkat SMA: X (Fase E), XI & XII (Fase F)
  const tingkatData: { nama: string; urutan: number; fase: Fase }[] = [
    { nama: "X", urutan: 10, fase: Fase.E },
    { nama: "XI", urutan: 11, fase: Fase.F },
    { nama: "XII", urutan: 12, fase: Fase.F },
  ];
  for (const t of tingkatData) {
    await prisma.tingkat.upsert({
      where: { sekolahId_urutan: { sekolahId: sekolah.id, urutan: t.urutan } },
      update: { nama: t.nama, fase: t.fase },
      create: { sekolahId: sekolah.id, ...t },
    });
  }

  // Tahun ajaran aktif + 2 periode (semester ganjil/genap)
  const ta = await prisma.tahunAjaran.upsert({
    where: { sekolahId_tahun: { sekolahId: sekolah.id, tahun: "2025/2026" } },
    update: { aktif: true },
    create: { sekolahId: sekolah.id, tahun: "2025/2026", aktif: true },
  });
  const periodeData = [
    { nama: "Semester Ganjil", urutan: 1, aktif: true },
    { nama: "Semester Genap", urutan: 2, aktif: false },
  ];
  for (const p of periodeData) {
    await prisma.periode.upsert({
      where: { tahunAjaranId_urutan: { tahunAjaranId: ta.id, urutan: p.urutan } },
      update: {},
      create: {
        tahunAjaranId: ta.id,
        nama: p.nama,
        jenis: JenisPeriode.semester,
        urutan: p.urutan,
        aktif: p.aktif,
      },
    });
  }

  console.log(`✓ Sekolah demo "${sekolah.nama}" (slug=${sekolah.slug})`);
  console.log(`  Admin login → username: admin / password: admin123`);
  return { sekolah, admin };
}

async function main() {
  console.log("Seeding…");
  await seedReferensiP5();
  await seedSekolahDemo();
  console.log("Selesai ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
