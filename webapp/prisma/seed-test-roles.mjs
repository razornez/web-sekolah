/**
 * Buat akun uji untuk 7 role yang belum diuji QA (RBAC). Idempotent.
 * Password seragam: Test1234!  — nonaktifkan via prod-prep.mjs sebelum produksi.
 * Run: node prisma/seed-test-roles.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient();
const SID = 2;

const ROLES = [
  { username: "test_operator",    role: "operator",    nama: "Test Operator" },
  { username: "test_kepsek",      role: "kepsek",      nama: "Test Kepala Sekolah" },
  { username: "test_kurikulum",   role: "kurikulum",   nama: "Test Kurikulum" },
  { username: "test_kesiswaan",   role: "kesiswaan",   nama: "Test Kesiswaan" },
  { username: "test_humas",       role: "humas",       nama: "Test Humas" },
  { username: "test_sarpras",     role: "sarpras",     nama: "Test Sarpras" },
  { username: "test_resepsionis", role: "resepsionis", nama: "Test Resepsionis" },
];

async function main() {
  const hash = await bcrypt.hash("Test1234!", 10);
  let created = 0, skipped = 0;
  for (const r of ROLES) {
    const exists = await p.user.findFirst({ where: { sekolahId: SID, username: r.username }, select: { id: true } });
    if (exists) { skipped++; continue; }
    await p.user.create({
      data: {
        sekolahId: SID, username: r.username, namaLengkap: r.nama,
        role: r.role, passwordHash: hash, isActive: true,
      },
    });
    created++;
    console.log(`  + ${r.username} (${r.role})`);
  }
  console.log(`\n✓ Akun uji role: ${created} dibuat, ${skipped} sudah ada. Password: Test1234!`);
  console.log("  Kode sekolah saat login: gunakan slug sekolah id=2.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
