# Audit & Dokumentasi — Aplikasi "Smart School"

> Dokumen ini adalah analisa menyeluruh aplikasi existing sebagai dasar **rewrite penuh** ke stack modern (Next.js + TypeScript).
> Tanggal audit: 2026-06-03.

---

## 1. Ringkasan Eksekutif

| Aspek | Nilai |
|---|---|
| Jenis aplikasi | **Sistem Informasi Sekolah (School Management System)** — *bukan* CMS |
| Produk asal | "Smart School" oleh vendor *Exampremium* (`demosmartschool.exampremium.co.id`) |
| Framework | **CodeIgniter 3.1.11** (PHP MVC) |
| PHP target | 5.6 (EOL) + proteksi ionCube |
| Database | MySQL `smartschool` — **70 tabel**, charset `latin1` |
| Ukuran kode | ~**120.000 baris PHP**, 33 controller, 24 model, 180 view |
| Frontend | Server-side render (PHP) + Bootstrap 4 + jQuery 1.4 + template admin "pcoded" |
| Auth | Session CI, password **MD5 tanpa salt** (rawan) |

**Verdict:** Ini aplikasi custom dengan logika bisnis spesifik (e-rapor, SPP, absensi, PPDB, e-voting). Tidak ada jalur "ekspor-impor konten" seperti CMS — seluruh aplikasi harus ditulis ulang. Hanya **data** (database) yang dapat dipertahankan/dimigrasikan.

---

## 2. Arsitektur Saat Ini

```
web-sekolah/
├── index.php               # Front controller CI
├── application/
│   ├── config/             # config, routes, database, autoload
│   ├── controllers/        # 33 controller (lihat §3)
│   │   ├── admin/ bendahara/ bk/ guru/ kelulusan/ pemilih/
│   │   ├── pengguna/ perpustakaan/ resepsionis/ sarpras/ user/ walikelas/
│   ├── models/             # 24 model (lihat §4)
│   ├── views/              # 180 file view (lihat §6)
│   ├── libraries/          # Dompdf, TCPDF, PHPExcel, IP2Location
│   ├── helpers/            # log_helper, tanggal_helper
│   └── restserver/         # CodeIgniter REST Server (API, belum dipakai aktif)
├── system/                 # Core CodeIgniter 3.1.11 (jangan diubah)
├── assets/                 # CSS/JS template admin (pcoded), Chart.js, jQuery
├── upload/ file/ image/    # File upload user (foto, dokumen, cover buku)
├── smartschool.sql         # Dump database (1.3 MB)
└── .htaccess               # URL rewrite + timezone Asia/Jakarta
```

**Pola:** MVC klasik CI3. Routing default `beranda`, 404 → `e404`. Autoload: `database`, `session`, `form_validation` + helper `url, form, log, download, captcha, string, tanggal`.

---

## 3. Peta Modul / Fitur (per Controller)

### 3.1 Publik (tanpa login)
| Controller | Fitur |
|---|---|
| `Beranda` | Landing page sekolah, profil, banner, statistik siswa/sarpras, alumni, guru |
| `Beranda::smartbook / videopembelajaran / bukuumum` | Katalog buku digital & video pembelajaran publik |
| `Beranda::bukutamu / simpantamu` | Buku tamu pengunjung |
| `Beranda::alumni / simpanalumni` | Pendaftaran/daftar alumni |
| `Beranda::perpustakaan / kunjunganperpustakaan` | Pencatatan kunjungan perpustakaan |
| `Ppdb` | Penerimaan Peserta Didik Baru (form online) |
| `Siswa::ressiswa` | Registrasi siswa |
| `kelulusan/Countdown` | Halaman countdown pengumuman kelulusan |

### 3.2 Login (auth terpisah per role — 13 controller login!)
`Login` (admin & staf via `tbl_users`), `Loginguru`, `Loginsiswa`, `Loginwalikelas`, `Loginbk`, `Loginbendahara`, `Loginperpustakaan`, `Loginsarpras`, `Loginresepsionis`, `Loginpemilih`, `Loginekinerja`.
→ Setiap role punya halaman login & tabel sumber berbeda. **Ini duplikasi besar yang bisa disatukan** di rewrite.

### 3.3 Dashboard per Role
| Role | Controller | Fitur utama |
|---|---|---|
| **Admin** | `Master` (god-controller, ±200 method) + `admin/Dashboard` | Master data lengkap, semua CRUD, cetak rapor, export |
| **Admin** | `Pengaturan` | Tema, banner, menu siswa, profil |
| **Guru** | `guru/Dashboard` (88 method) | Biodata, jurnal mengajar, jadwal, kehadiran guru, input nilai smt1–6, e-kinerja/SKP, e-learning, tugas |
| **Wali Kelas** | `walikelas/Dashboard` | Data rombel, edit siswa |
| **Siswa/Pengguna** | `pengguna/Dashboard` | Biodata, pembayaran, kehadiran, e-rapor |
| **BK** | `bk/Dashboard` | Pelanggaran/kasus, kategori, mutasi masuk/keluar, undangan ortu, kehadiran |
| **Bendahara** | `bendahara/Dashboard` | Jenis pembayaran, SPP, bayar, kwitansi (BKU) |
| **Perpustakaan** | `perpustakaan/Dashboard` | Buku, peminjaman, anggota, transaksi |
| **Sarpras** | `sarpras/Dashboard` | Kategori sarpras, data sarana prasarana |
| **Resepsionis** | `resepsionis/Dashboard` | Data tamu |
| **Kelulusan** | `kelulusan/Dashboard` | Portal cek kelulusan siswa |
| **Pemilih (OSIS)** | `pemilih/Dashboard` | E-voting OSIS (`simpanvote`) |

### 3.4 Utilitas
| Controller | Fitur |
|---|---|
| `Import` | Upload Excel: nilai smt1–6, guru, pemilih OSIS, role, kode rekening |
| `Importkelulusan` | Import data kelulusan |
| `Rapot` | Setting guru pengampu rapor |

---

## 4. Model & Operasi Data

| Model | # fungsi | Domain |
|---|---|---|
| `M_master` | **193** | God-model admin — hampir semua tabel |
| `Guru` | 88 | Nilai, jurnal, jadwal, kehadiran, SKP, e-learning |
| `M_beranda` | 32 | Data publik landing page |
| `Bendahara` | 30 | SPP & pembayaran |
| `Bk` | 23 | Kasus/pelanggaran, mutasi |
| `Pengguna` | 20 | Data siswa/pengguna |
| `Admin`, `Perpustakaan` | 15 | Auth, perpustakaan |
| `M_pendaftar` | 16 | PPDB |
| `Sarpras`, `Walikelas`, `Resepsionis`, `M_pengaturan`, `Pemilih`, `Kelulusan`, `M_rapot`, `M_siswa` | 5–12 | Modul masing-masing |
| `Export*` (8 model) | 1–3 | Generator Excel/PDF |

---

## 5. Skema Database (70 tabel)

### 5.1 Kelompok tabel
| Domain | Tabel |
|---|---|
| **Siswa / PPDB** | `pendaftar` (★ tabel siswa inti, ~130 kolom), `calonosis`, `mutasisiswa`, `menu_siswa`, `jalurppdb`, `ketentuanppdb`, `ppdb_profil` |
| **Guru / Kepegawaian** | `guru`, `pendidikan_guru`, `rapot_dataguru`, `ekinerja`, `skp` |
| **Akademik / Rapor** | `rapor1`–`rapor6` (per semester!), `rapormapel`, `raporekstra`, `rapor_tahun`, `nilaiekstra1`, `pengayaan`, `semester`, `tingkat`, `kelas`, `walikelas` |
| **KBM** | `jadwalguru`, `jurnalguru`, `deskripsijurnal`, `hari`, `jadwalabsen`, `elearning`, `latihansoal`, `video`, `buku`, `menu_siswa` |
| **Kehadiran** | `kehadiransiswa`, `kehadiranguru` |
| **BK** | `kasus`, `kategorikasus`, `prestasi`, `undanganortu`, `undanganwalimurid` |
| **Keuangan / SPP** | `pembayaranspp`, `spp_datasiswa` (bayar1–12 sbg kolom!), `spp_databulan`, `spp_jenispembayaran`, `koderekening`, `kwitansi` |
| **Perpustakaan** | `bukuperpustakaan`, `pinjamanbuku`, `pengunjungperpustakaan` |
| **Sarpras** | `sarpras`, `kategorisarpras` |
| **Kelulusan** | `kelulusan`, `settingkelulusan` |
| **OSIS / Voting** | `pemilihosis`, `vote_pemilihan` |
| **Surat / Administrasi** | `surat`, `surat_baru`, `suratketeranganaktif`, `tamu`, `bukutamu`(?) |
| **Alumni** | `alumni` |
| **Sistem / Setting** | `tbl_users`, `setting`, `setting_banner`, `settingkelulusan`, `profil`, `tema`, `menu_siswa`, `counter`, `log_login` |

### 5.2 Catatan kritikal model data
1. **Tabel siswa = `pendaftar`** — sangat denormalisasi (~130 kolom: bio siswa, ayah, ibu, wali, kesehatan, prestasi, kelulusan, lanjutan, + `username/password/role` untuk login). Perlu dipecah jadi beberapa entity (Siswa, OrangTua, RiwayatPendidikan, dll).
2. **Tidak ada FOREIGN KEY** — relasi diatur di kode via pencocokan string:
   - `rapor1.id_user` → `pendaftar.id_pendaftar`
   - `kehadiransiswa.id_user` → siswa; `kasus.siswa_id` → siswa
   - `pembayaranspp.id_siswa`, `spp_datasiswa.nisn` → siswa
   - `pinjamanbuku.id_peminjam` → siswa/guru, `id_bukupinjaman` → `bukuperpustakaan.id_buku`
   - `pendaftar.siswa_kelas` → `kelas.kode_kelas`
3. **Tanggal disimpan sebagai `varchar`** (`tanggal varchar(255)`, `tanggalpresensi varchar(100)`) — perlu konversi ke `DATE/DATETIME`.
4. **Rapor dipecah 6 tabel identik** (`rapor1`..`rapor6`) per semester → normalisasi jadi 1 tabel + kolom `semester`.
5. **`spp_datasiswa`** punya kolom `bayar1`..`bayar12` (bulan sbg kolom) → normalisasi jadi baris.
6. **Engine campuran** — MyISAM di tabel penting (`pendaftar`, `guru`, `tbl_users`, `kasus`, `surat`, `profil`, `log_login`) yang tidak mendukung transaksi/FK.
7. **Charset `latin1`** di semua tabel → risiko karakter Indonesia rusak; target `utf8mb4`.

---

## 6. Frontend & Assets

| Komponen | Teknologi |
|---|---|
| Template admin | "pcoded" (Datta/Gradient Able) — Bootstrap 4 |
| JS | jQuery **1.4** (sangat tua), Chart.js, uikit, waves, ripple |
| CSS | `style.css`, `layout-dark.css`, `layout-rtl.css`, ada `tailwind.min.css` (parsial) |
| Render | 100% server-side PHP view (180 file), `_partials/` untuk header/footer/sidebar |
| Upload | `/upload`, `/file`, `/image` (foto guru/siswa/OSIS, cover buku, dokumen) |

---

## 7. Dependency & Library

| Library (CI) | Fungsi | Pengganti di stack baru |
|---|---|---|
| Dompdf / TCPDF (`Pdf`, `Pdfgenerator`, `Dompdf_gen`, `Tcpdf_gen`) | Cetak rapor, kwitansi, surat, kartu → PDF | `@react-pdf/renderer` / `puppeteer` / `playwright` |
| PHPExcel (`Excel`) | Import/export nilai, data siswa, template | `exceljs` / `sheetjs (xlsx)` |
| IP2Location (`IP2Location_lib`) | Geolokasi pengunjung (counter) | opsional / `@maxmind/geoip2-node` |
| CI REST Server (`restserver/`) | Skeleton REST API (belum aktif) | Next.js Route Handlers / API |
| `tanggal_helper` | Format tanggal Indonesia | `date-fns` + locale `id` |
| `captcha` helper | Captcha buku tamu | `next-recaptcha` / hCaptcha |

---

## 8. Temuan Keamanan & Technical Debt (wajib diperbaiki saat rewrite)

| # | Temuan | Severity | Aksi di rewrite |
|---|---|---|---|
| 1 | Password **MD5 tanpa salt** (`MD5($password)`) di `tbl_users`, `guru`, `pendaftar` | 🔴 Tinggi | Migrasi ke `bcrypt`/`argon2`; rehash saat login pertama pasca-migrasi |
| 2 | 13 controller login terpisah, logika auth terduplikasi | 🟠 | Satu sistem auth (Auth.js) dengan RBAC |
| 3 | Tidak ada FK / integritas referensial | 🟠 | Definisikan relasi via ORM (Prisma/Drizzle) + FK InnoDB |
| 4 | Tanggal & angka disimpan sebagai `varchar` | 🟠 | Tipe `DATE`/`DATETIME`/`INT` yang benar |
| 5 | `ENVIRONMENT` default `development` (error tampil) | 🟠 | Env var production-safe |
| 6 | PHP 5.6 (EOL) & jQuery 1.4 (EOL) | 🟠 | Hilang total di stack baru |
| 7 | God-controller `Master` (±200 method) & `M_master` (193 fungsi) | 🟡 | Pecah per domain/feature module |
| 8 | MyISAM (tanpa transaksi) di tabel transaksional | 🟡 | InnoDB |
| 9 | `base_url` di-derive dari `$_SERVER['HTTP_HOST']` | 🟡 | Env config eksplisit |
| 10 | Charset `latin1` | 🟡 | `utf8mb4` |

---

## 9. Rekomendasi Stack Target (Rewrite Penuh)

```
Next.js (App Router) + TypeScript
├─ UI:        Tailwind CSS + shadcn/ui  (ganti Bootstrap/pcoded)
├─ Data:      TanStack Table + TanStack Query (banyak grid CRUD)
├─ ORM:       Prisma  (introspect DB existing → tipe TS otomatis)
├─ Auth:      Auth.js (NextAuth) — credentials + RBAC by role
├─ PDF:       @react-pdf/renderer atau Playwright (rapor, kwitansi)
├─ Excel:     exceljs (import/export nilai & data)
├─ Validasi:  zod  (ganti form_validation CI)
└─ Charts:    Recharts / Chart.js (statistik dashboard)
```

### Keputusan Database (MySQL vs alternatif) — lihat §10.

---

## 10. Keputusan Database — MySQL vs PostgreSQL

> Anda masih ragu antara tetap MySQL atau pindah DB lain. Berikut analisanya.

| Kriteria | **MySQL (tetap)** | **PostgreSQL (pindah)** |
|---|---|---|
| Migrasi data | Termudah — data sudah ada | Perlu konversi sekali (pakai `pgloader`) |
| Familiar utk tim | ✅ (sudah dipakai) | ⚠️ perlu belajar sedikit |
| Cocok data relasional sekolah | ✅ | ✅✅ (lebih kuat: CTE, window function, JSON, constraint) |
| Dukungan Prisma/Drizzle | ✅ | ✅ (sedikit lebih matang) |
| Integritas data (FK, check, enum) | cukup | lebih ketat/lengkap |
| Hosting modern (Supabase, Neon, Vercel) | terbatas (PlanetScale) | luas & banyak free tier |

**Rekomendasi:**
- **Jika prioritas = cepat & minim risiko migrasi data → tetap MySQL** (mariadb/mysql 8). Data tinggal dipakai, Prisma `db pull` langsung jalan. *Ini pilihan default yang aman untuk rewrite.*
- **Jika prioritas = fondasi jangka panjang terbaik & buka opsi hosting modern (Supabase/Neon) → PostgreSQL.** Karena ini **rewrite penuh** dan datanya tidak masif (76 INSERT block, bukan jutaan row), biaya migrasi sekali ke Postgres relatif kecil dan sepadan.

> Karena skema lama butuh **dinormalisasi ulang besar-besaran** (pendaftar dipecah, rapor1–6 digabung, tanggal varchar→date), kita akan tetap membuat skema baru dari nol di ORM. Artinya **memilih PostgreSQL tidak menambah banyak kerja** — data tetap di-ETL ke skema baru. Jadi pilihan DB bisa ditentukan oleh preferensi hosting, bukan biaya migrasi.

---

## 11. Pemetaan Modul Lama → Modul Baru (rencana rewrite)

| Modul lama (CI) | Modul baru (Next.js feature) | Prioritas |
|---|---|---|
| 13× Login* + session | `auth/` (Auth.js + RBAC) | **1** |
| `Master`/`M_master` master data | `(admin)/master/*` (guru, siswa, kelas, mapel) | **2** |
| `pendaftar` (siswa) | `students/` + entity ternormalisasi | **2** |
| `rapor1–6`, `rapormapel` | `report-cards/` (e-rapor) | **3** |
| `bendahara` SPP | `finance/spp/` | **3** |
| `guru/Dashboard` (jurnal, nilai, absensi) | `teacher/` | **3** |
| `bk` kasus/mutasi | `counseling/` | 4 |
| `perpustakaan` | `library/` | 4 |
| `Ppdb` | `admissions/` | 4 |
| `pemilih` e-voting | `osis-voting/` | 5 |
| `kelulusan` | `graduation/` | 5 |
| `sarpras`, `resepsionis`, `alumni` | modul kecil masing-masing | 5 |
| `Beranda` (publik) | `(public)/` situs profil sekolah | 6 (terpisah/terakhir) |

---

## 12. Langkah Berikutnya (saran urutan kerja)

1. **Finalisasi keputusan DB** (§10) — MySQL atau PostgreSQL.
2. **Desain skema baru ternormalisasi** (ERD) berdasarkan §5 — ini fondasi rewrite.
3. **Scaffold Next.js + TypeScript + Prisma + Auth.js + Tailwind.**
4. **Script ETL** dari `smartschool.sql` lama → skema baru (sekali jalan).
5. **Rewrite modul** mengikuti prioritas §11 (mulai Auth → Master Data).

---
*Dokumen ini dihasilkan oleh audit otomatis terhadap codebase. Detail tabel/method dapat digali lebih lanjut per modul saat eksekusi.*
