/**
 * Seed presensi per-siswa langsung (semua siswa aktif punya rekap), periode aktif.
 * Idempotent (upsert by siswaId+tanggal). Run: node prisma/seed-presensi-all.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

const STATUS = ["hadir", "terlambat", "izin", "sakit", "alpa"];
const DIST = [82, 5, 4, 4, 5]; // mostly hadir
function hash(s) { let h = 0; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0; return Math.abs(h); }
function statusFor(siswaId, dateStr) {
  const h = hash(`${siswaId}-${dateStr}`) % 100;
  let cum = 0;
  for (let i = 0; i < DIST.length; i++) { cum += DIST[i]; if (h < cum) return STATUS[i]; }
  return "hadir";
}
function iso(d) { return d.toISOString().slice(0, 10); }

async function main() {
  const periode = await p.periode.findFirst({ where: { aktif: true, tahunAjaran: { sekolahId: SID } }, select: { id: true, tanggalMulai: true, tanggalSelesai: true } });
  if (!periode?.tanggalMulai) { console.log("⚠ Periode aktif tanpa tanggal"); return; }

  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const start = periode.tanggalMulai;
  const end = periode.tanggalSelesai < today ? periode.tanggalSelesai : today;

  // Kumpulkan hari sekolah (Senin–Jumat) dalam rentang
  const dates = [];
  let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) dates.push(new Date(cur));
    cur = new Date(cur.getTime() + 86400000);
  }
  console.log(`Periode aktif: ${iso(start)}–${iso(end)} → ${dates.length} hari sekolah`);

  // Semua siswa aktif yang punya kelas
  const siswa = await p.siswa.findMany({
    where: { sekolahId: SID, deletedAt: null, status: "aktif", anggotaRombel: { some: {} } },
    select: { id: true },
  });
  console.log(`Siswa aktif berkelas: ${siswa.length}`);

  // Untuk efisiensi: hanya seed siswa yang BELUM punya kehadiran sama sekali
  const withKh = new Set((await p.kehadiranSiswa.groupBy({ by: ["siswaId"], where: { sekolahId: SID } })).map(x => x.siswaId));
  const target = siswa.filter(s => !withKh.has(s.id));
  console.log(`Siswa tanpa rekap (akan di-seed): ${target.length}`);

  if (target.length === 0) { console.log("✓ Semua siswa sudah punya rekap"); return; }

  // Ambil subset tanggal (maks 20 hari terakhir) agar volume wajar
  const useDates = dates.slice(-20);
  let created = 0;
  const BATCH = 1000;
  let buffer = [];
  for (const s of target) {
    for (const d of useDates) {
      buffer.push({ sekolahId: SID, siswaId: s.id, tanggal: d, status: statusFor(s.id, iso(d)), periodeId: periode.id });
    }
    if (buffer.length >= BATCH) {
      await p.kehadiranSiswa.createMany({ data: buffer, skipDuplicates: true });
      created += buffer.length; buffer = [];
    }
  }
  if (buffer.length) { await p.kehadiranSiswa.createMany({ data: buffer, skipDuplicates: true }); created += buffer.length; }

  const stillEmpty = (await p.siswa.count({ where: { sekolahId: SID, deletedAt: null, status: "aktif", anggotaRombel: { some: {} }, kehadiran: { none: {} } } }));
  console.log(`✓ Dibuat ~${created} record. Siswa aktif berkelas tanpa rekap: ${stillEmpty}`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
