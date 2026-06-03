/**
 * Seed akun TESTING (idempoten) di sekolah `smartschool` — password sama utk semua.
 * Jalankan: npm run seed:testusers   (lihat docs/TEST-USERS.md)
 * JANGAN dipakai di produksi.
 */
import { PrismaClient, Role, JenisKelamin, TipeWali } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Test1234!";

async function upsertUser(sekolahId: number, username: string, role: Role, nama: string) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { sekolahId_username: { sekolahId, username } },
    update: { passwordHash, role, namaLengkap: nama, isActive: true, passwordLegacyMd5: false },
    create: { sekolahId, username, role, namaLengkap: nama, passwordHash },
  });
}

async function main() {
  const sekolah = await prisma.sekolah.findUnique({ where: { slug: "smartschool" } });
  if (!sekolah) throw new Error("Sekolah 'smartschool' belum ada (jalankan ETL dulu).");
  const sid = sekolah.id;

  const staff: [string, Role, string][] = [
    ["test_admin", Role.admin, "Test Admin"],
    ["test_guru", Role.guru, "Test Guru"],
    ["test_walikelas", Role.walikelas, "Test Wali Kelas"],
    ["test_bk", Role.bk, "Test BK"],
    ["test_bendahara", Role.bendahara, "Test Bendahara"],
    ["test_perpustakaan", Role.perpustakaan, "Test Perpustakaan"],
  ];
  for (const [u, r, n] of staff) await upsertUser(sid, u, r, n);

  // Siswa test (punya profil agar portal menampilkan data)
  let siswa = await prisma.siswa.findFirst({ where: { sekolahId: sid, nisn: "TEST0001" } });
  if (!siswa) {
    siswa = await prisma.siswa.create({
      data: { sekolahId: sid, namaLengkap: "Siswa Tes", nisn: "TEST0001", jenisKelamin: JenisKelamin.L },
    });
  }
  const siswaUser = await upsertUser(sid, "test_siswa", Role.siswa, "Siswa Tes");
  await prisma.siswa.update({ where: { id: siswa.id }, data: { userId: siswaUser.id } });

  // Ortu test (tertaut ke siswa tes -> portal ortu menampilkan anak)
  const ortuUser = await upsertUser(sid, "test_ortu", Role.ortu, "Ortu Tes");
  await prisma.orangTuaWali.upsert({
    where: { siswaId_tipe: { siswaId: siswa.id, tipe: TipeWali.ayah } },
    update: { userId: ortuUser.id },
    create: { siswaId: siswa.id, tipe: TipeWali.ayah, nama: "Ayah Tes", userId: ortuUser.id },
  });

  console.log("✓ Akun test siap di sekolah 'smartschool'. Password semua: " + PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
