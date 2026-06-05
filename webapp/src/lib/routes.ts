/**
 * Centralized route constants — semua URL aplikasi di satu tempat.
 * Update di sini otomatis berlaku ke semua komponen yang menggunakannya.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────
export const AUTH = {
  LOGIN:   "/login",
  LOGOUT:  "/logout",
} as const;

// ── Portal (siswa/ortu) ───────────────────────────────────────────────────────
export const PORTAL = {
  HOME:      "/portal",
  TUGAS:     "/tugas-saya",
  UJIAN:     "/ujian-saya",
  VOTE:      "/vote",
} as const;

// ── Staff back-office ─────────────────────────────────────────────────────────
export const R = {
  DASHBOARD:      "/dashboard",
  PENGUMUMAN:     "/pengumuman",
  PENGUMUMAN_NEW: "/pengumuman/new",

  // Siswa
  SISWA:          "/siswa",
  SISWA_NEW:      "/siswa/new",
  SISWA_ARSIP:    "/siswa/arsip",
  siswa:          (id: number)  => `/siswa/${id}` as const,
  siswaEdit:      (id: number)  => `/siswa/${id}/edit` as const,

  // Prestasi & mutasi
  PRESTASI:       "/prestasi",
  MUTASI:         "/mutasi",
  KENAIKAN_KELAS: "/kenaikan-kelas",

  // Guru
  GURU:           "/guru",
  GURU_NEW:       "/guru/new",
  guru:           (id: number)  => `/guru/${id}` as const,

  // Rombel
  ROMBEL:         "/rombel",
  ROMBEL_NEW:     "/rombel/new",
  rombel:         (id: number)  => `/rombel/${id}` as const,
  rombelEdit:     (id: number)  => `/rombel/${id}/edit` as const,

  // Mapel
  MAPEL:          "/mapel",
  MAPEL_NEW:      "/mapel/new",
  mapel:          (id: number)  => `/mapel/${id}` as const,

  // Nilai
  NILAI:          "/nilai",
  NILAI_ENTRI:    "/nilai/entri",
  NILAI_RAPOR:    "/nilai/rapor",
  nilaiRaporSiswa:(id: number)  => `/nilai/rapor/${id}` as const,

  // Akademik
  P5:             "/p5",
  JURNAL:         "/jurnal",
  JADWAL:         "/jadwal",
  ELEARNING:      "/elearning",
  TUGAS:          "/tugas",
  UJIAN:          "/ujian",

  // Presensi
  PRESENSI:       "/presensi",
  presensiJadwal: (id: number)  => `/presensi?jadwalId=${id}` as const,

  // Kesiswaan
  EKSTRAKURIKULER:      "/ekstrakurikuler",
  ekstra:               (id: number)  => `/ekstrakurikuler/${id}` as const,
  BK:                   "/bk",
  BK_KATEGORI:          "/bk/kategori",
  bkSiswa:              (id: number)  => `/bk?siswaId=${id}` as const,

  // Sarana
  PERPUSTAKAAN:   "/perpustakaan",
  PERPU_PINJAM:   "/perpustakaan/pinjam",
  PERPU_NEW:      "/perpustakaan/new",
  perpuBuku:      (id: number)  => `/perpustakaan/${id}` as const,
  SARPRAS:        "/sarpras",
  SARPRAS_KATEGORI: "/sarpras/kategori",

  // Administrasi
  SURAT:          "/surat",
  SPP:            "/spp",
  SPP_JENIS:      "/spp/jenis",
  PPDB:           "/ppdb",
  PPDB_NEW:       "/ppdb/new",
  ppdb:           (id: number)  => `/ppdb/${id}` as const,
  KELULUSAN:      "/kelulusan",
  OSIS:           "/osis",

  // Sistem
  AUDIT:          "/audit",
  PENGATURAN:     "/pengaturan",
  PENGATURAN_AKADEMIK: "/pengaturan/akademik",

  // Public (form pendaftaran)
  daftar:         (slug: string) => `/daftar/${slug}` as const,

  // Print
  raporCetak:     (siswaId: number) => `/cetak/rapor/${siswaId}` as const,
} as const;

// ── API routes ────────────────────────────────────────────────────────────────
export const API = {
  SISWA_CARI:  "/api/siswa/cari",
} as const;
