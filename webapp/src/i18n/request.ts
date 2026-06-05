import { getRequestConfig } from "next-intl/server";
import { getLocale } from "./locale";

// Daftar modul pesan — tiap modul punya file sendiri di src/messages/{locale}/{modul}.json
// Tambah modul baru cukup daftarkan namanya di sini.
const MODULES = [
  "common",     // app, nav, common, roles, language (shared chrome)
  "dashboard",
  "siswa",
  "guru",
  "rombel",
  "mapel",
  "nilai",
  "presensi",
  "jadwal",
  "bk",
  "perpustakaan",
  "sarpras",
  "ekstrakurikuler",
  "ppdb",
  "pengumuman",
  "spp",
  "pengaturan",
  // Batch 3 — semua sisa modul + halaman detail/form/sub
  "audit",
  "mutasi",
  "kenaikanKelas",
  "jurnal",
  "elearning",
  "surat",
  "kelulusan",
  "osis",
  "p5",
  "tugas",
  "ujian",
  "prestasi",
  "portal",
] as const;

export default getRequestConfig(async () => {
  const locale = await getLocale();

  // Merge semua file modul jadi satu objek messages.
  const entries = await Promise.all(
    MODULES.map(async (m) => {
      try {
        const mod = (await import(`../messages/${locale}/${m}.json`)).default;
        return mod as Record<string, unknown>;
      } catch {
        return {};
      }
    }),
  );
  const messages = Object.assign({}, ...entries);

  return { locale, messages };
});
