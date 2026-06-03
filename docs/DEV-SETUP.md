# Dev Setup — PostgreSQL Lokal

PostgreSQL **18.4** dipasang via **scoop** (user-level, tanpa admin) pada 2026-06-03.

## Detail koneksi (development)

| Item | Nilai |
|---|---|
| Host / Port | `localhost:5432` |
| Database | `websekolah_dev` (encoding UTF8) |
| App user | `websekolah` / password `websekolah_dev` |
| Superuser | `postgres` (trust auth lokal, tanpa password) |
| Binaries | `%USERPROFILE%\scoop\apps\postgresql\current\bin` |
| Data dir | `%USERPROFILE%\scoop\apps\postgresql\current\data` |

`DATABASE_URL`:
```
postgresql://websekolah:websekolah_dev@localhost:5432/websekolah_dev?schema=public
```

## Start / Stop server

PowerShell (binaries scoop sudah di PATH user):
```powershell
$data = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$log  = "$env:USERPROFILE\scoop\apps\postgresql\current\log.txt"

pg_ctl -D "$data" -l "$log" start      # start
pg_ctl -D "$data" status               # cek status
pg_ctl -D "$data" stop                 # stop
```

> Server **tidak** auto-start saat boot. Jalankan `pg_ctl ... start` tiap mulai kerja.
> (Opsional nanti: daftarkan sebagai Windows service via `pg_ctl register`.)

## Konek manual

```powershell
$env:PGPASSWORD = "websekolah_dev"
psql -U websekolah -d websekolah_dev -h localhost
```

## Aplikasi baru: `webapp/` (Next.js 16 + TS)

Stack: **Next.js 16.2.7 (App Router, Turbopack) + React 19 + Prisma 6 + Auth.js v5 + Tailwind 4**.
Prisma schema, seed, ETL, dan `.env` ada di `webapp/`.

> ⚠️ **Node:** sistem punya Node v20.17 di `C:\Program Files\nodejs`, tetapi proyek butuh
> Node **24.16 LTS** (via scoop). Prepend ke PATH tiap sesi terminal:
> ```powershell
> $node = "$env:USERPROFILE\scoop\apps\nodejs-lts\current"; $env:Path = "$node;$node\bin;" + $env:Path
> ```

Perintah (jalankan dari `webapp/`):
```powershell
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build + typecheck
npm run db:push    # sinkron skema Prisma -> Postgres
npm run db:seed    # seed referensi P5 + sekolah demo + admin
npm run etl        # migrasi data MySQL lama -> Postgres baru
npm run db:studio  # Prisma Studio
```

Login demo: sekolah **demo** → `admin` / `admin123`. Sekolah hasil migrasi **smartschool** → `admin` / `admin` (password lama MD5, auto-upgrade ke bcrypt saat login pertama).

## Catatan migrasi ke Supabase (nanti)

Saat siap online, ganti `DATABASE_URL` ke connection pooler Supabase (port 6543, `?pgbouncer=true`) dan set `DIRECT_URL` ke koneksi langsung (port 5432) untuk `prisma migrate`. Lihat [AUDIT.md](AUDIT.md) §10 untuk pertimbangan slot Supabase.
