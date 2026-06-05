/**
 * Cleanup wave 3 — BUG-006 (merge sisa mapel kode acak) + BUG-033 (tugas rombel invalid).
 * Run: node prisma/cleanup-data3.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

const isCleanCode = (k) => /^[A-Z][A-Z0-9]{1,7}$/.test(k);

// Pasangkan mapel kode-acak ke canonical via keyword
const MERGE_KEYWORD = [
  [/jasmani|olahraga|pjok/i, /jasmani|pjok/i],
  [/agama islam|agama.*budi/i, /agama/i],
  [/pancasila.*kewarganegaraan|kewarganegaraan/i, /pancasila|pkn|ppkn/i],
  [/prakarya/i, /prakarya/i],
];

async function mergeMapel() {
  const mapel = await p.mapel.findMany({ where: { sekolahId: SID }, select: { id: true, namaMapel: true, kodeMapel: true } });
  const randoms = mapel.filter((m) => m.kodeMapel.length > 12);
  let merged = 0, renamed = 0;

  for (const r of randoms) {
    // cari canonical (kode bersih) dgn keyword sama
    let canonical = null;
    for (const [rndRe, canRe] of MERGE_KEYWORD) {
      if (rndRe.test(r.namaMapel)) {
        canonical = mapel.find((m) => m.id !== r.id && isCleanCode(m.kodeMapel) && canRe.test(m.namaMapel));
        if (canonical) break;
      }
    }
    if (canonical) {
      // reassign FK lalu hapus
      await p.nilaiRapor.updateMany({ where: { mapelId: r.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.entriNilai.updateMany({ where: { mapelId: r.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.komponenNilai.updateMany({ where: { mapelId: r.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.capaianPembelajaran.updateMany({ where: { mapelId: r.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.mapelGuru.updateMany({ where: { mapelId: r.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.mapel.delete({ where: { id: r.id } }).catch((e) => console.log(`  skip ${r.id}: ${e.code}`));
      merged++;
    } else {
      // tak ada canonical → cukup rapikan kodenya (abreviasi)
      const kode = r.namaMapel.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 6);
      await p.mapel.update({ where: { id: r.id }, data: { kodeMapel: kode } }).catch(() => {});
      renamed++;
    }
  }
  console.log(`✓ BUG-006 Mapel: ${merged} di-merge ke canonical, ${renamed} kode dirapikan`);
}

async function fixTugasRombel() {
  const rombelIds = new Set((await p.rombel.findMany({ where: { sekolahId: SID }, select: { id: true } })).map((r) => r.id));
  const tugas = await p.tugas.findMany({ where: { sekolahId: SID }, select: { id: true, rombelId: true } });
  const bad = tugas.filter((t) => t.rombelId && !rombelIds.has(t.rombelId));
  for (const t of bad) await p.tugas.update({ where: { id: t.id }, data: { rombelId: null } });
  console.log(`✓ BUG-033 Tugas: ${bad.length} rombelId tak valid → null (berlaku utk semua kelas)`);
}

async function main() {
  console.log("=== CLEANUP WAVE 3 ===\n");
  await mergeMapel();
  await fixTugasRombel();
  const total = await p.mapel.count({ where: { sekolahId: SID } });
  const acak = (await p.mapel.findMany({ where: { sekolahId: SID }, select: { kodeMapel: true } })).filter((m) => m.kodeMapel.length > 12).length;
  console.log(`\nMapel total: ${total}, kode acak tersisa: ${acak}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
