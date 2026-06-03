# Smart School

Sistem Informasi Sekolah — **migrasi penuh** dari CodeIgniter (PHP) ke **Next.js 16 + TypeScript + PostgreSQL**.

## Struktur repo

| Folder | Isi |
|---|---|
| [`webapp/`](webapp/) | **Aplikasi utama** (Next.js 16, Prisma, Auth.js, Tailwind). Inilah yang di-deploy. |
| [`docs/`](docs/) | Dokumentasi migrasi: [AUDIT](docs/AUDIT.md), [RESEARCH](docs/RESEARCH.md), [SCHEMA](docs/SCHEMA.md), [DEV-SETUP](docs/DEV-SETUP.md), [DEPLOYMENT](docs/DEPLOYMENT.md), [TEST-USERS](docs/TEST-USERS.md) |
| [`legacy/`](legacy/) | **Arsip** aplikasi CodeIgniter lama (di-retire). Disimpan sebagai referensi untuk modul yang belum dimigrasi; tidak dijalankan. |

## Menjalankan (development)

Prasyarat: Node ≥ 20.19 (disarankan 24 LTS), PostgreSQL lokal. Detail: [docs/DEV-SETUP.md](docs/DEV-SETUP.md).

```bash
cd webapp
npm install
npm run db:push      # buat skema di Postgres
npm run db:seed      # data referensi (P5) + sekolah demo + admin
npm run dev          # http://localhost:3002 (lihat catatan port di DEV-SETUP)
```

> **Keamanan:** semua key & credential (DATABASE_URL, AUTH_SECRET, dll) **hanya** dari environment variable — tidak pernah di-hardcode. `.env` di-gitignore. Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) untuk daftar env (termasuk untuk Vercel).

Akun testing: [docs/TEST-USERS.md](docs/TEST-USERS.md).
