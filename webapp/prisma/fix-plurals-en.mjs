/**
 * Konversi string count EN ke ICU plural agar "1 students" → "1 student".
 * Hanya file en/ (Indonesia tidak mengenal pluralisasi). Run: node prisma/fix-plurals-en.mjs
 */
import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "src", "messages", "en");

// file → { key: newValue (ICU) }
const MAP = {
  "dashboard.json": {
    siswaCount: "{n, plural, one {# student} other {# students}}",
    moreSiswa: "{n, plural, one {+# more student} other {+# more students}}",
    popupTitle: "{nama} — {count, plural, one {# student} other {# students}}",
  },
  "siswa.json": {
    activeCount: "{n, plural, one {# active student} other {# active students}}",
    arsipSubtitle: "{n, plural, one {# student archived — can be restored anytime} other {# students archived — can be restored anytime}}",
  },
  "guru.json": {
    countActive: "{n, plural, one {# active teacher} other {# active teachers}}",
    countInactive: "{n, plural, one {# inactive teacher} other {# inactive teachers}}",
    historyCount: "{n, plural, one {# teacher} other {# teachers}}",
  },
  "mapel.json": {
    historyCount: "{n, plural, one {# teacher} other {# teachers}}",
    metaCatatanNilai: "{n, plural, one {# grade record} other {# grade records}}",
  },
  "nilai.json": {
    siswaCount: "{n, plural, one {# student} other {# students}}",
    saveHint: "{n, plural, one {# student} other {# students}} · grades are saved and updated automatically",
  },
  "rombel.json": {
    groupSiswa: "{n, plural, one {# student} other {# students}}",
    groupCount: "{n, plural, one {# class} other {# classes}}",
    summary: "{rombel, plural, one {# class} other {# classes}} · {siswa, plural, one {# student} other {# students}}",
  },
  "pengumuman.json": {
    count: "{n, plural, one {# announcement} other {# announcements}}",
  },
  "prestasi.json": {
    penerimaCount: "{n, plural, one {# recipient} other {# recipients}}",
  },
  "mutasi.json": {
    recordCount: "{n, plural, one {# transfer record} other {# transfer records}}",
  },
  "p5.json": {
    subtitle: "Pancasila Student Profile Strengthening Project — {n, plural, one {# project} other {# projects}}",
  },
  "perpustakaan.json": {
    durationDays: "{n, plural, one {# day} other {# days}}",
    subtitle: "{judul, plural, one {# title} other {# titles}} · {eksemplar, plural, one {# copy} other {# copies}}",
  },
  "pengaturan.json": {
    weeks: "{n, plural, one {# week} other {# weeks}}",
    taStats: "{rombel, plural, one {# class} other {# classes}} · {periode, plural, one {# period} other {# periods}}",
  },
};

let filesChanged = 0, keysChanged = 0;
for (const [file, keys] of Object.entries(MAP)) {
  const fp = path.join(DIR, file);
  if (!fs.existsSync(fp)) { console.log(`skip (no file): ${file}`); continue; }
  const json = JSON.parse(fs.readFileSync(fp, "utf8"));
  const ns = Object.keys(json)[0]; // namespace root
  let changed = false;
  for (const [k, v] of Object.entries(keys)) {
    if (json[ns] && k in json[ns] && json[ns][k] !== v) {
      json[ns][k] = v;
      keysChanged++; changed = true;
    } else if (json[ns] && !(k in json[ns])) {
      console.log(`  ⚠ key tidak ada: ${file} → ${k}`);
    }
  }
  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(json, null, 2) + "\n");
    filesChanged++;
  }
}
console.log(`✓ ICU plural: ${keysChanged} key di ${filesChanged} file EN diperbarui`);
