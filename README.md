# Smart School

Sistem Informasi Sekolah — **migrasi penuh** dari CodeIgniter (PHP) ke **Next.js 16 + TypeScript + PostgreSQL**. Multi-tenant (banyak sekolah), mendukung Kurikulum Merdeka + K13.

## Struktur repo

| Folder | Isi |
|---|---|
| [`webapp/`](webapp/) | **Aplikasi utama** — yang dijalankan & di-deploy |
| [`docs/`](docs/) | Dokumentasi lengkap (lihat bawah) |
| [`legacy/`](legacy/) | Arsip CodeIgniter lama (retired) — referensi; tidak dijalankan |

> 🔐 **Keamanan:** SEMUA key & credential (`DATABASE_URL`, `AUTH_SECRET`, dll) **hanya** dari **environment variable** — tidak pernah di-hardcode. `.env` di-gitignore. Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Tech Stack

| Layer | Teknologi | Versi | Dipakai untuk |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org) (App Router) | 16.2.7 | Routing, SSR, Server Components, Server Actions, API |
| **UI** | [React](https://react.dev) | 19.2.4 | Komponen UI; `useActionState` untuk form interaktif |
| **Language** | [TypeScript](https://typescriptlang.org) | 5.x | Type safety end-to-end, Prisma types, Zod inference |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | 4.x | Semua styling + layout cetak (`@page`) |
| **Database** | [PostgreSQL](https://postgresql.org) | 18.4 | Penyimpanan data, enum, constraint, FK, groupBy agregasi |
| **ORM** | [Prisma](https://prisma.io) | 6.19.3 | Schema, migrasi berversi, query type-safe, seed/ETL |
| **Auth** | [Auth.js v5](https://authjs.dev) (NextAuth) | 5.0.0-beta.31 | Login multi-tenant + multi-role, JWT session |
| **Password** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.x | Hash password (+ auto-upgrade MD5 lama → bcrypt) |
| **Validasi** | [Zod](https://zod.dev) | 4.x | Validasi semua input form di Server Actions |
| **Runtime (dev)** | [Node.js](https://nodejs.org) LTS | 24.16.0 | Dev server, seed scripts (via `tsx`) |

> 📖 **Detail lengkap** — arsitektur, pola, mapping fitur ↔ teknologi, izin per role: **[docs/TECH-STACK.md](docs/TECH-STACK.md)**

---

## Modul & Fitur

| Kategori | Modul |
|---|---|
| **Akademik** | Siswa, Guru/PTK, Rombel/Kelas, Mata Pelajaran, Kenaikan Kelas |
| **Penilaian** | Nilai/Rapor (K13 + Kurikulum Merdeka), Rapor Hal.2 (Ekstra + Ketidakhadiran + Catatan Wali), Projek P5 |
| **KBM** | Jurnal Mengajar, Jadwal, E-Learning, Tugas (LMS), Ujian Online (CBT + timer + auto-grade) |
| **Kehadiran** | Presensi siswa (batch per rombel), Kehadiran guru |
| **Kesiswaan** | BK/Pelanggaran, Prestasi, Beasiswa, Mutasi, Ekstrakurikuler (+ anggota) |
| **Keuangan** | SPP/Tagihan, Pembayaran, Kwitansi, Jenis Pembayaran |
| **Perpustakaan** | Katalog buku, Peminjaman & pengembalian |
| **Sarana Prasarana** | Inventaris (kategori + item) |
| **Administrasi** | Surat, Buku Tamu, Pengumuman (target audiens), Alumni |
| **PPDB** | Jalur pendaftaran, Form daftar publik (`/daftar/[slug]`), Kelola pendaftar |
| **Kelulusan** | Set status batch per rombel, Portal cek publik (`/cek-kelulusan/[slug]`) |
| **OSIS** | Kandidat, E-voting (1 suara/siswa), Rekap hasil |
| **Portal End-User** | Portal siswa (nilai, SPP, kehadiran, pengumuman, tugas, ujian), Portal ortu |
| **Akun** | Buat/reset akun login guru & siswa, aktif/nonaktif |
| **Cetak PDF** | Rapor (Hal 1+2) + Kwitansi SPP — via browser print |
| **Dashboard** | Analytics: distribusi gender, status siswa, SPP, kehadiran, siswa per rombel |
| **Multi-tenant** | Satu aplikasi untuk banyak sekolah, data terisolasi per `sekolah_id` |

---

## Dokumentasi

| File | Isi |
|---|---|
| **[TECH-STACK.md](docs/TECH-STACK.md)** | ⭐ Stack lengkap: versi, fitur per teknologi, arsitektur, mapping |
| [DEV-SETUP.md](docs/DEV-SETUP.md) | Setup PostgreSQL lokal + cara start/stop server |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy ke Vercel + env vars + migrate produksi |
| [TEST-USERS.md](docs/TEST-USERS.md) | Akun testing per role |
| [SCHEMA.md](docs/SCHEMA.md) | ERD + desain skema database |
| [RESEARCH.md](docs/RESEARCH.md) | Riset SIS/CMS sekolah + gap analysis + rekomendasi |
| [ENHANCEMENTS.md](docs/ENHANCEMENTS.md) | Roadmap fitur lanjutan |
| [AUDIT.md](docs/AUDIT.md) | Audit aplikasi CodeIgniter lama |
| [RLS.md](docs/RLS.md) | Panduan Row-Level Security (multi-tenant DB) |

---

## Cara menjalankan (development)

```bash
# 1. Masuk ke folder aplikasi
cd webapp

# 2. Install dependency
npm install

# 3. Salin env & isi
cp .env.example .env
# edit .env → isi DATABASE_URL, DIRECT_URL, AUTH_SECRET
# generate AUTH_SECRET: npx auth secret

# 4. Buat skema database
npx prisma migrate deploy   # pakai baseline migration yang sudah ada
# (atau: npx prisma db push  untuk dev cepat)

# 5. Seed data
npm run db:seed             # referensi P5 + sekolah demo + admin
npm run seed:rich           # data demo kaya untuk semua modul (opsional)

# 6. Dev server → http://localhost:3002
npm run dev
```

**Login:** isi **Kode Sekolah** (slug) + username + password. Akun siap: [docs/TEST-USERS.md](docs/TEST-USERS.md).

### Semua script (di `webapp/`)

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server port **3002** |
| `npm run build` | Production build + TypeScript check |
| `npm start` | Jalankan hasil build |
| `npm run db:push` | Sinkron skema Prisma → Postgres (dev) |
| `npm run db:migrate` | Buat & terapkan migrasi baru (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Terapkan migrasi ke produksi (`prisma migrate deploy`) |
| `npm run db:seed` | Seed referensi P5 + sekolah demo |
| `npm run seed:testusers` | Akun test per role (`Test1234!`) |
| `npm run seed:dummy` | Data dummy awal |
| `npm run seed:rich` | Data lengkap semua modul (26 bagian) |
| `npm run etl` | Migrasi data dari MySQL lama (XAMPP) |
| `npm run db:studio` | Prisma Studio (GUI DB) |

---

## Environment variables (wajib)

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres runtime (Vercel → pooler Supabase, port 6543) |
| `DIRECT_URL` | Koneksi langsung untuk `prisma migrate` (port 5432) |
| `AUTH_SECRET` | Secret Auth.js — generate: `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` |

Lihat detail di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
