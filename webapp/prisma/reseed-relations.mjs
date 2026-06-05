/**
 * Re-seed relasi bermakna: guru↔mapel, jadwal (tanpa konflik), e-learning, jurnal.
 * Memperbaiki relasi acak hasil seed (#9, #13). Run: node prisma/reseed-relations.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const JAM = [
  ["07:00", "08:30"], ["08:30", "10:00"],
  ["10:15", "11:45"], ["11:45", "13:15"], ["13:30", "15:00"],
];

// Pencocokan guru spesialis berdasarkan gelar/nama
function pickSpecialist(guruList, re) {
  return guruList.find((g) => re.test(g.namaGuru));
}

async function main() {
  const [guru, mapel, rombel, hariRows] = await Promise.all([
    p.guru.findMany({ where: { sekolahId: SID, deletedAt: null }, select: { id: true, namaGuru: true }, orderBy: { namaGuru: "asc" } }),
    p.mapel.findMany({ where: { sekolahId: SID }, select: { id: true, namaMapel: true } }),
    p.rombel.findMany({ where: { sekolahId: SID }, select: { id: true, nama: true } }),
    p.hari.findMany({ where: { sekolahId: SID }, select: { id: true, nama: true } }),
  ]);

  // Pastikan record Hari ada
  const hariMap = {};
  for (const h of HARI) {
    let row = hariRows.find((x) => x.nama === h);
    if (!row) row = await p.hari.create({ data: { sekolahId: SID, nama: h, urutan: HARI.indexOf(h) + 1 }, select: { id: true, nama: true } });
    hariMap[h] = row.id;
  }

  // ── 1. Assign guru ke tiap mapel (spesialis dulu, sisanya round-robin) ──
  const SPECIALIST = [
    [/Informatika/i, /S\.Kom/i],
    [/PJOK|Jasmani/i, /S\.Or/i],
    [/Ekonomi/i, /S\.E\./i],
    [/Fisika/i, /S\.Si|M\.T/i],
  ];
  const mapelGuru = new Map(); // mapelId → guruId
  let rr = 0;
  for (const m of mapel) {
    let g = null;
    for (const [mre, gre] of SPECIALIST) {
      if (mre.test(m.namaMapel)) { g = pickSpecialist(guru, gre); break; }
    }
    if (!g) { g = guru[rr % guru.length]; rr++; }
    mapelGuru.set(m.id, g.id);
    await p.mapel.update({ where: { id: m.id }, data: { guruId: g.id } });
  }
  console.log(`✓ Guru pengampu: ${mapel.length} mapel di-assign (spesialis + rotasi)`);

  // Map nama mapel → id (untuk lookup konten)
  const mapelByKeyword = (kw) => mapel.find((m) => new RegExp(kw, "i").test(m.namaMapel));

  // ── 2. Rebuild jadwal tanpa konflik ──
  await p.jadwalGuru.deleteMany({ where: { sekolahId: SID } });
  // Pilih subset mapel "inti" untuk dijadwalkan
  const intiKw = ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Fisika", "Kimia", "Biologi", "Ekonomi", "Geografi", "Sosiologi", "Sejarah", "PJOK", "Informatika", "Seni", "PKn", "Agama"];
  const intiMapel = intiKw.map((kw) => mapelByKeyword(kw)).filter(Boolean);

  // Konflik: set "guruId|hari|jamIdx" dan "rombelId|hari|jamIdx"
  const usedGuru = new Set();
  const usedRombel = new Set();
  let created = 0;

  for (const r of rombel) {
    // tiap rombel: 5 hari × 2 slot pertama = 10 pelajaran/minggu, rotasi mapel inti
    let mi = (r.id * 3) % intiMapel.length; // offset variatif per rombel
    for (let d = 0; d < HARI.length; d++) {
      for (let s = 0; s < 2; s++) {
        // cari mapel yang gurunya belum bentrok di slot ini
        let placed = false;
        for (let tries = 0; tries < intiMapel.length && !placed; tries++) {
          const m = intiMapel[(mi + tries) % intiMapel.length];
          const gId = mapelGuru.get(m.id);
          const gKey = `${gId}|${d}|${s}`;
          const rKey = `${r.id}|${d}|${s}`;
          if (usedGuru.has(gKey) || usedRombel.has(rKey)) continue;
          usedGuru.add(gKey); usedRombel.add(rKey);
          await p.jadwalGuru.create({
            data: {
              sekolahId: SID, guruId: gId, hariId: hariMap[HARI[d]], rombelId: r.id,
              mapel: m.namaMapel, jamMulai: JAM[s][0], jamSelesai: JAM[s][1],
            },
          });
          created++; placed = true; mi++;
        }
      }
    }
  }
  console.log(`✓ Jadwal: ${created} entri dibuat (mapel cocok guru, tanpa konflik guru/kelas)`);

  // ── 3. Fix E-Learning: mapel sesuai judul konten + kelas real ──
  const CONTENT_SUBJECT = [
    [/aljabar|kalkulus|trigonometri|geometri|matematik/i, "Matematika"],
    [/kimia|reaksi|senyawa|asam basa|organik/i, "Kimia"],
    [/newton|fisika|gaya|gerak|energi|listrik/i, "Fisika"],
    [/sel|organel|biologi|genetik|ekosistem|fotosintesis/i, "Biologi"],
    [/sejarah|kemerdekaan|proklamasi|kolonial/i, "Sejarah"],
    [/grammar|english|tenses|vocabulary|bahasa inggris/i, "Bahasa Inggris"],
    [/globalisasi|geografi|peta|iklim|tata surya/i, "Geografi"],
    [/ekonomi|pasar|sistem ekonomi|akuntansi/i, "Ekonomi"],
    [/sosiologi|sosial|masyarakat/i, "Sosiologi"],
    [/puisi|paragraf|cerpen|bahasa indonesia|sastra/i, "Bahasa Indonesia"],
  ];
  const elearn = await p.elearning.findMany({ where: { sekolahId: SID }, select: { id: true, judul: true } });
  let efix = 0;
  for (const e of elearn) {
    let subjName = null;
    for (const [re, name] of CONTENT_SUBJECT) if (re.test(e.judul)) { subjName = name; break; }
    const rb = rombel[(e.id * 7) % rombel.length];
    await p.elearning.update({
      where: { id: e.id },
      data: { mapel: subjName ?? "Umum", kelas: rb.nama },
    });
    efix++;
  }
  console.log(`✓ E-Learning: ${efix} item — mapel diselaraskan dengan judul, kelas → rombel real`);

  // ── 4. Fix Jurnal: kelas → rombel real, mapel cocok guru ──
  const jurnal = await p.jurnalGuru.findMany({ where: { sekolahId: SID }, select: { id: true, guruId: true } });
  // mapel per guru (kebalikan mapelGuru)
  const guruMapelName = new Map();
  for (const m of mapel) {
    const g = mapelGuru.get(m.id);
    if (!guruMapelName.has(g)) guruMapelName.set(g, m.namaMapel);
  }
  let jfix = 0;
  for (const j of jurnal) {
    const rb = rombel[(j.id * 5) % rombel.length];
    const mp = guruMapelName.get(j.guruId) ?? "Umum";
    await p.jurnalGuru.update({ where: { id: j.id }, data: { kelas: rb.nama, mapel: mp } });
    jfix++;
  }
  console.log(`✓ Jurnal: ${jfix} entri — kelas → rombel real, mapel sesuai guru`);

  console.log("\n=== SELESAI ===");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
