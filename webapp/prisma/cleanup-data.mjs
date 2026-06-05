/**
 * Data cleanup — perbaiki masalah integritas data hasil seed berantakan.
 * Idempotent & aman. Run: node prisma/cleanup-data.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2; // SEKOLAH NUSANTARA

// ─── Heuristik gender dari nama Indonesia ──────────────────────────────────
const FEMALE_TOKENS = [
  "putri","dewi","sari","ayu","nur","siti","fitri","fitria","indah","lestari","wati","ningsih",
  "anggraini","anggraeni","zahra","azzahra","aisyah","aisy","khairunnisa","nisa","annisa","rahmawati",
  "maharani","adelia","adinda","salsabila","aulia","syifa","kirana","anggun","melati","mawar",
  "cantika","keisha","keysha","najwa","nabila","alya","alifia","kayla","queen","ratna","intan",
  "permata","cahaya","bunga","citra","gita","hana","hanifah","ramadhani","oktaviani","yuliana",
  "wulandari","puspita","pratiwi","utami","handayani","safitri","amelia","amalia","fadhilah",
  "rahma","rahmi","hidayati","mutiara","sabrina","clarissa","felicia","gabriella","jovita",
  "agustina","novita","rosa","rosita","yanti","yuni","yunita","ika","eka putri","tasya","vania",
  "zaskia","balqis","humaira","ningrum","wardani","damayanti","kusuma dewi","az-zahra","dinda",
];
const MALE_TOKENS = [
  "putra","aji","bagus","adi","agus","budi","eko","hidayat","hidayatullah","bayu","dimas","fajar",
  "galih","hendra","ilham","irfan","wahyu","muhammad","mohammad","muhamad","mochammad","ahmad",
  "achmad","abdul","abdullah","rizal","ridwan","arif","ari","andi","anto","bambang","dedi","dwi prasetyo",
  "fauzi","ferdi","gilang","hafiz","hanif","imam","joko","kurniawan","lukman","maulana","nugroho",
  "prasetyo","pratama","rahmat","reza","rizki ","rizky ","saputra","setiawan","sugeng","surya",
  "syahputra","taufik","teguh","tri ","wibowo","yoga","yusuf","zaki","zidan","alif","arya","bima",
  "dani","danu","farhan","gibran","hakim","ibnu","kevin","naufal","raffi","rangga","satria","willyanto",
  "abbad","apta","basuki","aang","adrian","firmansyah","octa","fatoni","awang",
];

function guessGender(nama) {
  const n = " " + nama.toLowerCase().replace(/[^a-z\s'-]/g, " ") + " ";
  for (const tok of FEMALE_TOKENS) if (n.includes(tok.toLowerCase())) return "P";
  for (const tok of MALE_TOKENS) if (n.includes(tok.toLowerCase())) return "L";
  // Fallback: nama berakhiran huruf 'a'/'i' cenderung perempuan (lemah), selain itu L.
  const first = nama.trim().split(/\s+/)[0].toLowerCase();
  if (/(a|i|ah|ti|wi|ni|ka|ya)$/.test(first)) return "P";
  return "L";
}

function namaToKode(nama) {
  return nama.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
}

async function fixGender() {
  const siswa = await p.siswa.findMany({ where: { sekolahId: SID }, select: { id: true, namaLengkap: true } });
  let updated = 0;
  for (const s of siswa) {
    const g = guessGender(s.namaLengkap);
    await p.siswa.update({ where: { id: s.id }, data: { jenisKelamin: g } });
    updated++;
  }
  console.log(`✓ Gender: ${updated} siswa diperbaiki via heuristik nama`);
}

async function deleteAsaClass() {
  const asa = await p.rombel.findFirst({ where: { sekolahId: SID, nama: { in: ["asa", "Asa", "ASA"] } }, select: { id: true, nama: true } });
  if (!asa) { console.log("✓ Junk class 'asa': tidak ada"); return; }
  await p.anggotaRombel.deleteMany({ where: { rombelId: asa.id } });
  await p.jadwalGuru.deleteMany({ where: { rombelId: asa.id } });
  await p.rombel.delete({ where: { id: asa.id } });
  console.log(`✓ Junk class '${asa.nama}' dihapus (+ enrollment & jadwal)`);
}

async function fixKodeKelas() {
  const rombels = await p.rombel.findMany({ where: { sekolahId: SID }, select: { id: true, nama: true, kodeKelas: true } });
  let fixed = 0;
  for (const r of rombels) {
    const proper = namaToKode(r.nama);
    // Kode dianggap junk jika kosong, atau >15 char tanpa spasi (random id), atau tidak match pola nama
    const junk = !r.kodeKelas || (r.kodeKelas.length > 12 && !r.kodeKelas.includes("-"));
    if (junk && r.kodeKelas !== proper) {
      await p.rombel.update({ where: { id: r.id }, data: { kodeKelas: proper } });
      fixed++;
    }
  }
  console.log(`✓ Kode kelas: ${fixed} diperbaiki ke format nama (mis. X-IPA-2)`);
}

async function syncRombelYear() {
  const aktifTA = await p.tahunAjaran.findFirst({ where: { sekolahId: SID, aktif: true }, select: { id: true, tahun: true } });
  if (!aktifTA) { console.log("⚠ Tidak ada TA aktif"); return; }
  const res = await p.rombel.updateMany({ where: { sekolahId: SID, tahunAjaranId: { not: aktifTA.id } }, data: { tahunAjaranId: aktifTA.id } });
  console.log(`✓ Sync tahun ajaran: ${res.count} rombel dipindah ke ${aktifTA.tahun} (aktif)`);
}

async function assignHomeroom() {
  const [rombels, guru] = await Promise.all([
    p.rombel.findMany({ where: { sekolahId: SID, waliGuruId: null }, select: { id: true }, orderBy: { nama: "asc" } }),
    p.guru.findMany({ where: { sekolahId: SID, deletedAt: null }, select: { id: true }, orderBy: { namaGuru: "asc" } }),
  ]);
  if (guru.length === 0) { console.log("⚠ Tidak ada guru"); return; }
  // Guru yang sudah jadi wali di rombel lain — hindari dobel kalau memungkinkan
  const used = new Set((await p.rombel.findMany({ where: { sekolahId: SID, waliGuruId: { not: null } }, select: { waliGuruId: true } })).map(r => r.waliGuruId));
  const pool = guru.filter(g => !used.has(g.id));
  let gi = 0;
  let assigned = 0;
  for (const r of rombels) {
    // Prioritas guru yang belum jadi wali; kalau habis, round-robin semua guru
    let guruId;
    if (pool.length > 0) { guruId = pool.shift().id; }
    else { guruId = guru[gi % guru.length].id; gi++; }
    await p.rombel.update({ where: { id: r.id }, data: { waliGuruId: guruId } });
    assigned++;
  }
  console.log(`✓ Wali kelas: ${assigned} rombel ditugaskan wali`);
}

async function dedupeMapel() {
  const mapel = await p.mapel.findMany({
    where: { sekolahId: SID },
    select: { id: true, namaMapel: true, kodeMapel: true },
    orderBy: { id: "asc" },
  });
  // Normalisasi nama untuk grouping
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Kode "bersih" = pendek (<=8 char) huruf/angka kapital tanpa karakter aneh, BUKAN random 35-char
  const isCleanCode = (k) => /^[A-Z][A-Z0-9]{1,7}$/.test(k);

  const groups = new Map();
  for (const m of mapel) {
    const key = norm(m.namaMapel);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  let removed = 0;
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    // Pilih canonical: prioritaskan kode bersih, lalu id terkecil
    list.sort((a, b) => {
      const ca = isCleanCode(a.kodeMapel) ? 0 : 1;
      const cb = isCleanCode(b.kodeMapel) ? 0 : 1;
      if (ca !== cb) return ca - cb;
      return a.id - b.id;
    });
    const canonical = list[0];
    const dups = list.slice(1);
    for (const d of dups) {
      // Reassign semua FK reference ke canonical sebelum hapus
      await p.nilaiRapor.updateMany({ where: { mapelId: d.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.entriNilai.updateMany({ where: { mapelId: d.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.komponenNilai.updateMany({ where: { mapelId: d.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.capaianPembelajaran.updateMany({ where: { mapelId: d.id }, data: { mapelId: canonical.id } }).catch(() => {});
      await p.mapelGuru.updateMany({ where: { mapelId: d.id }, data: { mapelId: canonical.id } }).catch(() => {});
      // Hapus duplikat
      await p.mapel.delete({ where: { id: d.id } }).catch((e) => console.log(`  skip delete mapel ${d.id}: ${e.code ?? e.message}`));
      removed++;
    }
  }
  console.log(`✓ Mapel duplikat: ${removed} dihapus, referensi dialihkan ke canonical`);
}

async function cleanAnnouncements() {
  // Hapus pengumuman sampah
  const junk = await p.pengumuman.findMany({
    where: { sekolahId: SID, OR: [
      { judul: { in: ["tess","test","tes","cejjj","asdf","aaa","coba"] , mode: "insensitive" } },
      { judul: { contains: "cejjj", mode: "insensitive" } },
    ] },
    select: { id: true, judul: true },
  });
  if (junk.length) {
    await p.pengumuman.deleteMany({ where: { id: { in: junk.map(j => j.id) } } });
  }
  // Kategorisasi otomatis berdasarkan judul/isi
  const all = await p.pengumuman.findMany({ where: { sekolahId: SID }, select: { id: true, judul: true, isi: true, kategori: true } });
  let recat = 0;
  for (const a of all) {
    const text = (a.judul + " " + a.isi).toLowerCase();
    let kat = a.kategori;
    if (/spp|pembayaran|bayar|keuangan|tagihan|biaya|dana/.test(text)) kat = "keuangan";
    else if (/uts|uas|ujian|jadwal|nilai|rapor|akademik|pelajaran|semester|kbm|belajar/.test(text)) kat = "akademik";
    else if (/lomba|kegiatan|acara|perayaan|class meeting|classmeeting|porseni|study tour|wisata|peringatan|hari /.test(text)) kat = "kegiatan";
    else if (/penting|wajib|segera|darurat|perhatian/.test(text)) kat = "penting";
    if (kat !== a.kategori) {
      await p.pengumuman.update({ where: { id: a.id }, data: { kategori: kat } });
      recat++;
    }
  }
  console.log(`✓ Pengumuman: ${junk.length} sampah dihapus, ${recat} dikategorikan ulang`);
}

async function fixFacilities() {
  const items = await p.sarpras.findMany({
    where: { sekolahId: SID },
    select: { id: true, nama: true, keterangan: true, tahunPengadaan: true, kategoriId: true },
  });
  const kategoris = await p.kategoriSarpras.findMany({ where: { sekolahId: SID }, select: { id: true, nama: true } });
  const katByName = (re) => kategoris.find(k => re.test(k.nama))?.id ?? null;

  const KAT_ALAT_PERAGA = katByName(/peraga|pembelajaran|pendidikan|alat/i);
  const KAT_ATK = katByName(/atk|tulis|kantor/i);

  let yearFixed = 0, catFixed = 0;
  for (const it of items) {
    const data = {};
    // Ekstrak tahun dari keterangan "Diadakan tahun 2023"
    if (!it.tahunPengadaan && it.keterangan) {
      const m = it.keterangan.match(/tahun\s+(\d{4})|(\d{4})/);
      if (m) { data.tahunPengadaan = parseInt(m[1] || m[2]); yearFixed++; }
    }
    // Koreksi kategori: alat peraga / ATK yang salah masuk Elektronik
    if (/globe|kompas|penggaris|peta|atlas|kerangka|torso|model/i.test(it.nama) && KAT_ALAT_PERAGA) {
      data.kategoriId = KAT_ALAT_PERAGA; catFixed++;
    } else if (/spidol|penghapus|kapur|kertas|pulpen|pensil/i.test(it.nama) && KAT_ATK) {
      data.kategoriId = KAT_ATK; catFixed++;
    }
    if (Object.keys(data).length) await p.sarpras.update({ where: { id: it.id }, data });
  }
  console.log(`✓ Sarpras: ${yearFixed} tahun pengadaan diisi dari keterangan, ${catFixed} kategori dikoreksi`);
}

async function main() {
  console.log("=== CLEANUP DATA SEKOLAH NUSANTARA (id=2) ===\n");
  await fixGender();
  await deleteAsaClass();
  await fixKodeKelas();
  await syncRombelYear();
  await assignHomeroom();
  await dedupeMapel();
  await cleanAnnouncements();
  await fixFacilities();

  console.log("\n=== RINGKASAN AKHIR ===");
  const g = await p.siswa.groupBy({ by: ["jenisKelamin"], where: { sekolahId: SID, deletedAt: null }, _count: { _all: true } });
  console.log("Gender:", g.map(x => `${x.jenisKelamin}=${x._count._all}`).join(", "));
  console.log("Rombel:", await p.rombel.count({ where: { sekolahId: SID } }));
  console.log("Rombel tanpa wali:", await p.rombel.count({ where: { sekolahId: SID, waliGuruId: null } }));
  console.log("Mapel:", await p.mapel.count({ where: { sekolahId: SID } }));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
