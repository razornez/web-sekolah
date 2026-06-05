/**
 * Cleanup wave 4 — BUG-MAPEL-01 (kode MPEL##), BUG-MAPEL-02 (noUrut dobel),
 * BUG-MUTASI-01 (createdById null). Run: node prisma/cleanup-data4.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

function abbr(nama) {
  // Abreviasi dari huruf awal tiap kata (maks 5), buang kata sambung
  const stop = new Set(["dan", "&", "/", "di", "ke", "yang"]);
  return nama
    .split(/[\s,]+/)
    .filter((w) => w && !stop.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 5);
}

async function fixMapelCodes() {
  const mapel = await p.mapel.findMany({ where: { sekolahId: SID }, select: { id: true, namaMapel: true, kodeMapel: true } });
  const used = new Set(mapel.filter((m) => !/^MPEL\d+$/i.test(m.kodeMapel)).map((m) => m.kodeMapel));
  let fixed = 0;
  for (const m of mapel) {
    if (!/^MPEL\d+$/i.test(m.kodeMapel)) continue; // hanya kode generik
    let base = abbr(m.namaMapel) || "MP";
    let kode = base;
    let n = 2;
    while (used.has(kode)) { kode = base + n; n++; } // hindari tabrakan
    used.add(kode);
    await p.mapel.update({ where: { id: m.id }, data: { kodeMapel: kode } });
    fixed++;
  }
  console.log(`✓ BUG-MAPEL-01: ${fixed} kode MPEL## → abreviasi (mis. Fisika→FIS)`);
}

async function fixNoUrut() {
  const mapel = await p.mapel.findMany({ where: { sekolahId: SID }, orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }], select: { id: true } });
  let i = 1;
  for (const m of mapel) {
    await p.mapel.update({ where: { id: m.id }, data: { noUrut: i } });
    i++;
  }
  console.log(`✓ BUG-MAPEL-02: noUrut diurutkan ulang 1..${mapel.length} (tidak ada lagi dobel)`);
}

async function backfillMutasiCreator() {
  // Ambil user admin sebagai penginput default untuk record seed lama
  const admin = await p.user.findFirst({ where: { sekolahId: SID, role: "admin" }, orderBy: { createdAt: "asc" }, select: { id: true, namaLengkap: true } });
  if (!admin) { console.log("⚠ BUG-MUTASI-01: tidak ada user admin"); return; }
  const res = await p.mutasiSiswa.updateMany({ where: { sekolahId: SID, createdById: null }, data: { createdById: admin.id } });
  console.log(`✓ BUG-MUTASI-01: ${res.count} record mutasi → diinput oleh ${admin.namaLengkap}`);
}

async function main() {
  console.log("=== CLEANUP WAVE 4 ===\n");
  await fixMapelCodes();
  await fixNoUrut();
  await backfillMutasiCreator();
  console.log("\n=== SELESAI ===");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
