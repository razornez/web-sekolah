/**
 * Polish data — P5-01 (seed projek P5 TA aktif) + UJIAN-01 (nonaktifkan ujian
 * tanpa peserta). Idempotent. Run: node prisma/seed-p5-polish.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

async function main() {
  const ta = await p.tahunAjaran.findFirst({ where: { sekolahId: SID, aktif: true }, select: { id: true, tahun: true } });
  if (!ta) { console.log("⚠ tidak ada TA aktif"); return; }

  // P5-01: pastikan ada projek P5 untuk TA aktif
  const exists = await p.projekP5.findFirst({ where: { sekolahId: SID, tahunAjaranId: ta.id }, select: { id: true } });
  if (!exists) {
    await p.projekP5.createMany({
      data: [
        { sekolahId: SID, tahunAjaranId: ta.id, tema: "Gaya Hidup Berkelanjutan", judul: "Sekolahku Bebas Sampah Plastik", deskripsi: "Mengurangi sampah plastik via daur ulang & kampanye." },
        { sekolahId: SID, tahunAjaranId: ta.id, tema: "Kearifan Lokal", judul: "Festival Budaya Nusantara", deskripsi: "Menggali & menampilkan budaya daerah lewat pameran & pentas seni." },
      ],
    });
    console.log(`✓ P5-01: 2 projek P5 dibuat utk TA ${ta.tahun}`);
  } else console.log("✓ P5-01: projek P5 TA aktif sudah ada");

  // UJIAN-01: ujian aktif tanpa peserta → nonaktif (hindari status membingungkan)
  const aktif = await p.ujian.findMany({ where: { sekolahId: SID, aktif: true }, select: { id: true, _count: { select: { hasil: true } } } });
  const kosong = aktif.filter((u) => u._count.hasil === 0).map((u) => u.id);
  if (kosong.length) {
    await p.ujian.updateMany({ where: { id: { in: kosong } }, data: { aktif: false } });
    console.log(`✓ UJIAN-01: ${kosong.length} ujian aktif tanpa peserta → dinonaktifkan`);
  } else console.log("✓ UJIAN-01: tidak ada ujian aktif tanpa peserta");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
