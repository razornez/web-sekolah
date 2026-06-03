# Smart School

Sistem Informasi Sekolah — **migrasi penuh** dari CodeIgniter (PHP) ke **Next.js 16 + TypeScript + PostgreSQL**. Multi-tenant (banyak sekolah), mendukung Kurikulum Merdeka + K13.

## Struktur repo

| Folder | Isi |
|---|---|
| [`webapp/`](webapp/) | **Aplikasi utama** (Next.js 16, Prisma, Auth.js, Tailwind). Ini yang dijalankan & di-deploy. |
| [`docs/`](docs/) | Dokumentasi: [AUDIT](docs/AUDIT.md) · [RESEARCH](docs/RESEARCH.md) · [SCHEMA](docs/SCHEMA.md) · [DEV-SETUP](docs/DEV-SETUP.md) · [DEPLOYMENT](docs/DEPLOYMENT.md) · [TEST-USERS](docs/TEST-USERS.md) |
| [`legacy/`](legacy/) | **Arsip** aplikasi CodeIgniter lama (sudah di-retire) — referensi untuk modul yang belum dimigrasi; tidak dijalankan. |

> 🔐 **Keamanan:** SEMUA key & credential (`DATABASE_URL`, `AUTH_SECRET`, dll) **hanya** dibaca dari **environment variable** — tidak pernah di-hardcode di kode. File `.env` di-gitignore (tidak ikut ter-push). Untuk produksi, isi env di dashboard hosting (Vercel). Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Prasyarat

- **Node.js ≥ 20.19** (disarankan **24 LTS**). Di Windows tanpa admin: `scoop install nodejs-lts`.
- **PostgreSQL** (lokal 14+ atau Supabase). Di Windows: `scoop install postgresql`.
- **Git**.

## Cara menjalankan (development)

```bash
# 1) Masuk ke folder aplikasi
cd webapp

# 2) Install dependency
npm install

# 3) Siapkan database PostgreSQL lalu salin env
cp .env.example .env
#   edit .env → isi DATABASE_URL, DIRECT_URL, AUTH_SECRET
#   generate secret: npx auth secret   (atau: openssl rand -base64 32)

# 4) Buat skema database
npx prisma db push

# 5) Seed data referensi (Dimensi P5) + sekolah demo + admin
npm run db:seed

# 6) Jalankan dev server  →  http://localhost:3002
npm run dev
```

Login awal (sekolah `demo`): **admin / admin123**. Akun testing lain: [docs/TEST-USERS.md](docs/TEST-USERS.md).

### Opsional
```bash
npm run etl            # migrasi data dari MySQL lama (butuh DB 'smartschool' aktif di XAMPP)
npm run seed:testusers # buat akun test per role (password: Test1234!)
```

## Build & produksi

```bash
cd webapp
npm run build   # build produksi + type-check
npm start       # jalankan hasil build
```

Deploy ke **Vercel**: set **Root Directory = `webapp`** dan isi semua env var (lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)). `.env` tidak ikut — semua credential diisi di Environment Variables Vercel.

## Environment variables (wajib)

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres (runtime; Vercel → pooler Supabase) |
| `DIRECT_URL` | Koneksi langsung untuk migrasi Prisma |
| `AUTH_SECRET` | Secret Auth.js (JWT/session) |
| `AUTH_TRUST_HOST` | `true` |

## Script (di `webapp/`)

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server di port **3002** |
| `npm run build` / `npm start` | Build / jalankan produksi |
| `npm run db:push` | Sinkron skema Prisma → Postgres |
| `npm run db:seed` | Seed referensi P5 + sekolah demo + admin |
| `npm run seed:testusers` | Akun testing per role |
| `npm run etl` | Migrasi data dari MySQL lama |
| `npm run db:studio` | Prisma Studio (GUI database) |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · PostgreSQL · Auth.js v5 (multi-tenant + RBAC) · Tailwind CSS 4.

## Catatan

- Login bersifat **multi-tenant** → isi **Kode Sekolah** (slug, mis. `demo` / `smartschool`) saat masuk.
- Modul yang sudah jadi: auth, siswa, guru, rombel/kelas, mapel, nilai/rapor (K13+Merdeka), SPP, presensi, akun, portal siswa/ortu. Modul `legacy/` (perpustakaan, BK, PPDB, OSIS, kelulusan, situs publik) menunggu dibangun ulang.
