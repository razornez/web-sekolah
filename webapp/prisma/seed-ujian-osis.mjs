/**
 * Seed demo bermakna untuk Ujian Online (CBT) & Pemilihan OSIS (BUG-025).
 * Idempotent. Run: node prisma/seed-ujian-osis.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

const SOAL_BANK = {
  Matematika: [
    ["Hasil dari 2x + 3 = 11 adalah x = ?", ["A","B","C","D"], ["3","4","5","6"], "B"],
    ["Turunan dari f(x) = x² adalah?", ["A","B","C","D"], ["x","2x","x²","2"], "B"],
    ["Luas lingkaran berjari-jari 7 (π=22/7)?", ["A","B","C","D"], ["154","144","164","174"], "A"],
    ["Nilai dari 5! adalah?", ["A","B","C","D"], ["100","120","60","24"], "B"],
    ["Akar dari x² - 9 = 0?", ["A","B","C","D"], ["±3","±9","3","9"], "A"],
  ],
  "Bahasa Indonesia": [
    ["Kalimat utama biasanya terdapat di?", ["A","B","C","D"], ["Judul","Awal/akhir paragraf","Catatan kaki","Daftar isi"], "B"],
    ["Majas perbandingan dua hal secara langsung disebut?", ["A","B","C","D"], ["Metafora","Hiperbola","Ironi","Litotes"], "A"],
    ["Karya sastra berbentuk bait disebut?", ["A","B","C","D"], ["Cerpen","Puisi","Novel","Drama"], "B"],
    ["Kata baku dari 'apotik' adalah?", ["A","B","C","D"], ["Apotek","Apotik","Aphotek","Apotec"], "A"],
    ["Unsur intrinsik yang menunjukkan tempat & waktu?", ["A","B","C","D"], ["Tema","Latar","Tokoh","Amanat"], "B"],
  ],
  Fisika: [
    ["Satuan SI untuk gaya adalah?", ["A","B","C","D"], ["Joule","Newton","Watt","Pascal"], "B"],
    ["Rumus Hukum II Newton?", ["A","B","C","D"], ["F=m/a","F=ma","F=m+a","F=a/m"], "B"],
    ["Kecepatan adalah perubahan ... terhadap waktu", ["A","B","C","D"], ["Massa","Posisi","Gaya","Energi"], "B"],
    ["Energi kinetik dirumuskan?", ["A","B","C","D"], ["mgh","½mv²","mv","½mgh"], "B"],
    ["Satuan daya listrik?", ["A","B","C","D"], ["Volt","Ampere","Watt","Ohm"], "C"],
  ],
};

const OSIS_CANDIDATES = [
  { noUrut: 1, namaKetua: "Bima Arya Pratama", namaWakil: "Sekar Ayu Lestari", visi: "OSIS yang aktif, kreatif, dan peduli sesama.", misi: "1) Adakan pekan kreativitas siswa. 2) Optimalkan ekstrakurikuler. 3) Program peduli lingkungan." },
  { noUrut: 2, namaKetua: "Galih Nugroho", namaWakil: "Citra Maharani", visi: "Mewujudkan sekolah berprestasi dan berkarakter.", misi: "1) Bimbingan belajar antar teman. 2) Turnamen olahraga. 3) Bakti sosial rutin." },
  { noUrut: 3, namaKetua: "Rafa Dwi Saputra", namaWakil: "Najwa Salsabila", visi: "OSIS inklusif yang mendengar semua suara siswa.", misi: "1) Kotak aspirasi digital. 2) Festival seni & budaya. 3) Literasi & jurnalistik sekolah." },
];

function hash(s) { let h = 0; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0; return Math.abs(h); }

async function seedUjian() {
  const guru = await p.guru.findMany({ where: { sekolahId: SID, deletedAt: null }, select: { id: true } });
  const rombelByMapel = {
    Matematika: await p.rombel.findFirst({ where: { sekolahId: SID, nama: { contains: "XII IPA 1" } }, select: { id: true, nama: true } }),
    "Bahasa Indonesia": await p.rombel.findFirst({ where: { sekolahId: SID, nama: { contains: "XI IPA 1" } }, select: { id: true, nama: true } }),
    Fisika: await p.rombel.findFirst({ where: { sekolahId: SID, nama: { contains: "X IPA 2" } }, select: { id: true, nama: true } }),
  };

  let createdUjian = 0, createdHasil = 0;
  for (const [mapel, soalList] of Object.entries(SOAL_BANK)) {
    const rombel = rombelByMapel[mapel];
    if (!rombel) continue;
    const judul = `Ujian ${mapel} — ${rombel.nama}`;
    let ujian = await p.ujian.findFirst({ where: { sekolahId: SID, judul }, select: { id: true } });
    if (!ujian) {
      ujian = await p.ujian.create({
        data: {
          sekolahId: SID, guruId: guru[hash(mapel) % guru.length]?.id ?? null, rombelId: rombel.id,
          judul, mapel, deskripsi: `Ujian ${mapel} untuk kelas ${rombel.nama}.`,
          durasiMenit: 60, acakSoal: true, aktif: true,
          mulai: new Date(Date.UTC(2026, 5, 1)), selesai: new Date(Date.UTC(2026, 5, 30)),
          soal: {
            create: soalList.map((s, i) => ({
              nomor: i + 1, pertanyaan: s[0], tipe: "pilihan_ganda",
              opsi: s[1].map((label, j) => ({ label, teks: s[2][j] })),
              kunci: s[3], bobot: 20,
            })),
          },
        },
        select: { id: true },
      });
      createdUjian++;
    }
    // Seed hasil untuk ~20 anggota rombel
    const anggota = await p.anggotaRombel.findMany({ where: { rombelId: rombel.id }, take: 20, select: { siswaId: true } });
    for (const a of anggota) {
      const exists = await p.hasilUjian.findFirst({ where: { ujianId: ujian.id, siswaId: a.siswaId }, select: { id: true } });
      if (exists) continue;
      const skor = 60 + (hash(`${ujian.id}-${a.siswaId}`) % 41); // 60-100
      await p.hasilUjian.create({
        data: {
          ujianId: ujian.id, siswaId: a.siswaId, status: "selesai", skor,
          mulaiAt: new Date(Date.UTC(2026, 5, 5, 8, 0)), selesaiAt: new Date(Date.UTC(2026, 5, 5, 8, 45)),
        },
      });
      createdHasil++;
    }
  }
  console.log(`✓ Ujian (CBT): ${createdUjian} ujian baru, ${createdHasil} hasil siswa di-seed`);
}

async function seedOsis() {
  const existing = await p.calonOsis.count({ where: { sekolahId: SID } });
  let calonIds = [];
  if (existing === 0) {
    for (const c of OSIS_CANDIDATES) {
      const r = await p.calonOsis.create({ data: { sekolahId: SID, ...c }, select: { id: true } });
      calonIds.push(r.id);
    }
    console.log(`✓ OSIS: ${OSIS_CANDIDATES.length} pasangan calon dibuat`);
  } else {
    calonIds = (await p.calonOsis.findMany({ where: { sekolahId: SID }, select: { id: true } })).map((x) => x.id);
    console.log(`✓ OSIS: ${existing} calon sudah ada`);
  }

  // Seed votes dari ~300 siswa aktif (distribusi tidak merata agar realistis)
  const voters = await p.siswa.findMany({
    where: { sekolahId: SID, deletedAt: null, status: "aktif", voteOsis: { none: {} } },
    take: 300, select: { id: true },
  });
  const weights = [40, 35, 25]; // % per calon
  let voteCount = 0;
  for (const s of voters) {
    const h = hash(`vote-${s.id}`) % 100;
    let idx = 0, cum = 0;
    for (let i = 0; i < weights.length; i++) { cum += weights[i]; if (h < cum) { idx = i; break; } }
    try {
      await p.votePemilihan.create({ data: { sekolahId: SID, calonId: calonIds[idx % calonIds.length], siswaId: s.id } });
      voteCount++;
    } catch { /* unique siswa */ }
  }
  console.log(`✓ OSIS: ${voteCount} suara di-seed`);
}

async function main() {
  console.log("=== SEED UJIAN (CBT) & OSIS ===\n");
  await seedUjian();
  await seedOsis();
  console.log("\n=== SELESAI ===");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
