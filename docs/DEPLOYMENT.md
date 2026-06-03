# Deployment & Environment Variables

> **Prinsip:** SEMUA key & credential disimpan di **environment variable**, tidak pernah di-hardcode di kode/repo.
> `.env` (lokal) di-gitignore. Untuk produksi (Vercel), set semua variabel di **Project Settings → Environment Variables**.

Aplikasi yang di-deploy adalah folder [`webapp/`](../webapp) (Next.js). Set **Root Directory = `webapp`** di Vercel.

## Daftar Environment Variable (wajib)

| Variabel | Fungsi | Contoh / catatan |
|---|---|---|
| `DATABASE_URL` | Koneksi runtime ke Postgres. Di Vercel pakai **connection pooler** Supabase (port 6543, `?pgbouncer=true`). | `postgresql://USER:PASS@HOST:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Koneksi langsung (port 5432) untuk `prisma migrate`. | `postgresql://USER:PASS@HOST:5432/postgres` |
| `AUTH_SECRET` | Secret Auth.js (enkripsi JWT/session). Generate: `npx auth secret` atau `openssl rand -base64 32`. | string acak panjang |
| `AUTH_TRUST_HOST` | Wajib `true` di luar Vercel; di Vercel boleh diisi `true` juga. | `true` |

> Opsional saat sudah pakai Supabase Auth/Storage nanti: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dll — semua tetap via env.

## Langkah deploy ke Vercel (ringkas)

1. Push branch ke GitHub. Import repo di Vercel, set **Root Directory = `webapp`**.
2. Tambah env di atas (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`) untuk environment Production (dan Preview bila perlu).
3. Build Command default (`next build`) — Prisma Client di-generate via `postinstall`/`prisma generate` (pastikan ada bila perlu).
4. Jalankan migrasi DB **berversi**: `npm run db:migrate:deploy` (`prisma migrate deploy`) memakai `DIRECT_URL`. Skema sudah di-baseline (`prisma/migrations/0_init`), jadi gunakan migrate (bukan `db push`) di produksi.
5. (Opsional) Aktifkan RLS untuk isolasi multi-tenant di level DB — lihat [RLS.md](RLS.md). Tenancy sudah ditegakkan di kode, jadi ini hardening tambahan.
6. Deploy.

> Catatan: file [.env.example](../webapp/.env.example) berisi daftar variabel (tanpa nilai rahasia) sebagai acuan. Jangan commit `.env` asli.
> Upload file (foto): di Vercel ganti `webapp/src/lib/upload.ts` ke object storage (Supabase Storage/Vercel Blob) — filesystem serverless ephemeral.
