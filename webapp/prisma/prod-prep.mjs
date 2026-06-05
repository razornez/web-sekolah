/**
 * PRODUCTION PREP — hapus akun & data uji sebelum rilis (BUG-035).
 * SENGAJA di-guard: hanya jalan bila CONFIRM_PROD_PREP=YES, agar tidak
 * mengosongkan demo secara tidak sengaja.
 *
 * Jalankan saat akan rilis:
 *   CONFIRM_PROD_PREP=YES node prisma/prod-prep.mjs        (bash)
 *   $env:CONFIRM_PROD_PREP="YES"; node prisma/prod-prep.mjs (powershell)
 *
 * Tindakan:
 *  - Nonaktifkan/ hapus akun bernama "Test *" / username test*
 *  - (Opsional) reset password admin agar tidak pakai default
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  if (process.env.CONFIRM_PROD_PREP !== "YES") {
    console.log("⛔ Dibatalkan. Script ini menghapus akun uji.");
    console.log("   Untuk benar-benar menjalankan: set CONFIRM_PROD_PREP=YES");
    return;
  }

  // Hapus akun uji (nama diawali 'Test ' atau username diawali 'test')
  const testUsers = await p.user.findMany({
    where: {
      OR: [
        { namaLengkap: { startsWith: "Test ", mode: "insensitive" } },
        { username: { startsWith: "test", mode: "insensitive" } },
      ],
      role: { not: "siswa" }, // jangan sentuh akun siswa massal
    },
    select: { id: true, username: true, namaLengkap: true },
  });

  console.log(`Akun uji ditemukan: ${testUsers.length}`);
  testUsers.forEach((u) => console.log(`  - ${u.namaLengkap} (${u.username})`));

  if (testUsers.length > 0) {
    // Nonaktifkan (lebih aman daripada hard-delete; relasi audit tetap utuh)
    await p.user.updateMany({ where: { id: { in: testUsers.map((u) => u.id) } }, data: { isActive: false } });
    console.log(`✓ ${testUsers.length} akun uji DINONAKTIFKAN.`);
  }

  console.log("\nCatatan produksi tambahan:");
  console.log("  • Ganti AUTH_SECRET & AUTH_URL di .env produksi");
  console.log("  • Jalankan: next build && next start (bukan next dev)");
  console.log("  • Pastikan DATABASE_URL menunjuk DB produksi (Supabase)");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
