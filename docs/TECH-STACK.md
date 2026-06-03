# Tech Stack — Smart School

> Dokumentasi lengkap teknologi yang dipakai, versinya, dan fitur apa yang dibangun di atasnya.

---

## Ringkasan

| Layer | Teknologi | Versi |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL | 18.4 |
| ORM | Prisma | 6.19.3 |
| Auth | Auth.js (NextAuth) | 5.0.0-beta.31 |
| Password | bcryptjs | 3.x |
| Validasi | Zod | 4.x |
| Runtime (dev) | Node.js | 24.16.0 LTS |
| Script runner | tsx | 4.x |

---

## 1. Next.js 16 — App Router

**Peran:** Framework utama. Mengatur routing, rendering, API, dan keamanan.

| Fitur Next.js | Dipakai untuk |
|---|---|
| **App Router** (file-system routing) | Semua halaman: `/siswa`, `/guru`, `/rapor`, dll |
| **Server Components** (default) | Fetch data langsung dari Prisma tanpa API layer; semua halaman list, detail, dan dashboard |
| **Server Actions** (`"use server"`) | Semua mutasi: simpan nilai, bayar SPP, submit tugas, kumpulkan jawaban ujian, upload foto |
| **Route Groups** `(app)`, `(staff)`, `(print)` | Isolasi layout: back-office staf, portal end-user, halaman cetak (A4, tanpa sidebar) |
| **Nested Layouts** | Layout `(app)` → sidebar + nav; `(staff)` → guard RBAC; `(print)` → layout cetak bersih |
| **`useActionState`** (React 19) | Form dengan feedback error inline: `SiswaForm`, `GuruForm`, `BukuForm`, `UjianRunner`, dll |
| **`searchParams` / `params` sebagai Promise** | Semua halaman dengan filter/paginasi (Next 16 breaking change) |
| **`revalidatePath`** | Invalidasi cache setelah mutasi (bayar SPP, simpan nilai, dll) |
| **`redirect`** | Redirect setelah simpan form, auto-logout unauthorized |
| **`notFound()`** | Guard 404 per tenant (siswa/guru/rombel tidak ditemukan atau bukan milik sekolah) |
| **`@page` CSS / `window.print()`** | Cetak rapor (hal 1 + hal 2 Kurikulum Merdeka) dan kwitansi SPP |

---

## 2. React 19

**Peran:** UI library. Sebagian besar komponen adalah **Server Components**; komponen interaktif memakai `"use client"`.

| Komponen | Teknologi | Fungsi |
|---|---|---|
| `SiswaForm`, `GuruForm`, `BukuForm`, `MapelForm`, `RombelForm`, `SuratForm` | `useActionState` + `"use client"` | Form create/edit dengan validasi error inline |
| `AccountPanel` | `useActionState` + `"use client"` | Buat akun login guru/siswa, reset password, aktif/nonaktif |
| `FotoUpload` | `useActionState` + `"use client"` | Upload foto guru dan siswa |
| `ConfirmDelete` | `"use client"` + `onSubmit` | Konfirmasi sebelum hapus (dipakai di semua modul) |
| `PrintButton` | `"use client"` + `window.print()` | Tombol cetak rapor/kwitansi (tersembunyi saat dicetak) |
| `UjianRunner` | `"use client"` + `useEffect` + `setInterval` | Timer countdown ujian CBT, auto-submit saat waktu habis |
| `PengumumanFeed` | Server Component | Feed pengumuman di dashboard + portal (difilter per audiens) |
| `BarList`, `Donut` | Server Component | Grafik analytics (bar CSS, conic-gradient) — tanpa library chart |

---

## 3. TypeScript

**Peran:** Type safety di seluruh codebase.

| Penggunaan | Detail |
|---|---|
| **Tipe Prisma** | Auto-generated dari skema (`PrismaClient`, `Siswa`, `NilaiRapor`, dll) |
| **Augmentasi Auth.js** | `src/types/next-auth.d.ts` — menambahkan `role`, `sekolahId`, `sekolahSlug` ke tipe `Session` & `JWT` (target `@auth/core/jwt`) |
| **Zod inference** | `SiswaInput`, `GuruInput`, `RombelInput`, `MapelInput`, dll — tipe form dari schema Zod |
| **`ModuleKey`** | `as const` tuple untuk key modul RBAC di `src/lib/permissions.ts` |

---

## 4. Tailwind CSS 4

**Peran:** Styling utilitas. Semua komponen memakai class Tailwind; tidak ada CSS custom kecuali `@page` media print.

| Dipakai untuk |
|---|
| Layout sidebar + main content |
| Tabel data (list siswa, nilai, SPP, dll) |
| Form input, select, textarea |
| Badge status (lunas/belum, aktif/draft, LULUS/TIDAK LULUS) |
| Grafik BarList (bar `width: %`) dan Donut (`conic-gradient`) |
| Halaman cetak rapor & kwitansi (layout A4 via `@page` di `globals.css`) |
| Responsif grid (dashboard stat cards, form kolom) |

---

## 5. PostgreSQL 18.4

**Peran:** Database utama. Multi-tenant via kolom `sekolah_id`.

| Fitur | Dipakai untuk |
|---|---|
| **Foreign Keys** | Semua relasi: siswa→sekolah, nilai→siswa→mapel→periode, dll |
| **Enum types** | `Role`, `StatusSiswa`, `StatusPembayaran`, `TipeSoal`, `PredikatP5`, dll (14 enum) |
| **Unique constraints** | `@@unique([siswaId, periodeId, mapelId])` untuk nilai; `@@unique([siswaId, tanggal])` untuk kehadiran; dll |
| **`@@index`** | Index tenant (`sekolah_id`), tanggal, status — untuk query list cepat |
| **`groupBy` agregasi** | Dashboard analytics: distribusi gender, status siswa, status SPP, rekap kehadiran |
| **`$transaction`** | Bayar SPP (tagihan+kwitansi), submit ujian (semua jawaban+update status), naikan kelas |
| **Prisma `upsert`** | Nilai rapor, kehadiran, jawaban ujian, catatan wali kelas — insert-or-update idempoten |
| **Row-Level Security** | Template disiapkan di `webapp/prisma/rls.sql` (belum diaktifkan; tenancy dipaksa di kode) |
| **`prisma migrate`** | Versioned migrations: 5 migrasi pasca-baseline (`pengumuman`, `rapor_catatan`, `ekstrakurikuler`, `tugas`, `ujian_cbt`) |

---

## 6. Prisma 6

**Peran:** ORM. Schema-first, type-safe, dengan migrasi berversi.

| Fitur | Dipakai untuk |
|---|---|
| **`schema.prisma`** | Definisi 68+ model dengan relasi, enum, unique constraints, index |
| **`prisma migrate dev`** | Buat migrasi baru saat ada perubahan skema (dev) |
| **`prisma migrate deploy`** | Terapkan migrasi ke produksi (Vercel/Supabase) |
| **`prisma db push`** | Sinkron cepat untuk prototyping (tidak membuat file migrasi) |
| **`prisma db seed`** | Seed referensi P5 (6 dimensi Profil Pelajar Pancasila) + sekolah demo |
| **`prisma generate`** | Generate Prisma Client dari schema (otomatis setelah migrate/push) |
| **Singleton pattern** | `src/lib/prisma.ts` — satu instance di seluruh app, anti hot-reload leak |
| **`tsx prisma/seed-*.ts`** | Seed data: `seed.ts` (referensi), `seed-testusers.ts` (akun test), `seed-dummy.ts` dan `seed-rich.ts` (data demo kaya) |
| **`etl.ts`** | Migrasi data dari MySQL lama (XAMPP, CodeIgniter) ke Postgres baru |

---

## 7. Auth.js v5 (NextAuth)

**Peran:** Autentikasi multi-tenant + multi-role.

| Fitur | Dipakai untuk |
|---|---|
| **Credentials Provider** | Login username + password + kode sekolah (slug) — multi-tenant |
| **JWT strategy** | Session disimpan di JWT (stateless, cocok untuk multi-instance) |
| **JWT augmentation** | `role`, `sekolahId`, `sekolahSlug` ditambahkan ke token di `callbacks.jwt` |
| **Session augmentation** | Field custom diteruskan ke `session.user` via `callbacks.session` |
| **`AUTH_SECRET`** | Enkripsi JWT, dari env (tidak hardcode) |
| **`pages.signIn`** | Custom login page `/login` dengan field Kode Sekolah |
| **`signOut`** | Server Action di layout sidebar (redirect ke `/login`) |
| **Route handler** | `src/app/api/auth/[...nextauth]/route.ts` |

### RBAC (Role-Based Access Control)
| Komponen | Fungsi |
|---|---|
| `src/lib/permissions.ts` | Definisi `MODULE_KEYS`, `ROLE_MODULES` (peta izin per role), `canAccess`, `requireModule` |
| `(staff)/*/layout.tsx` (18 file) | Guard per modul — redirect ke `/dashboard` jika role tidak berizin |
| `src/lib/session.ts` | `getCurrentUser`, `getSekolahId`, `isStaff`, `requireStaff` |
| **Nav terfilter** | `(app)/layout.tsx` — menu sidebar otomatis disembunyikan berdasarkan izin role |

**Tabel izin singkat:**

| Role | Akses modul utama |
|---|---|
| `admin`, `operator`, `kepsek` | Semua modul |
| `kurikulum` | Akademik (siswa, nilai, mapel, P5, tugas, ujian) |
| `kesiswaan` | Kesiswaan (siswa, presensi, BK, ekstra, OSIS, PPDB) |
| `guru` | Akademik + KBM (nilai, jurnal, jadwal, elearning, tugas, ujian) |
| `walikelas` | Siswa, nilai, P5, presensi, kelulusan |
| `bk` | Siswa, kasus/pelanggaran |
| `bendahara` | SPP/keuangan |
| `perpustakaan` | Perpustakaan |
| `sarpras` | Sarana prasarana |
| `siswa`, `ortu` | Portal saja (nilai, SPP, tugas, ujian, presensi, OSIS) |

---

## 8. bcryptjs

**Peran:** Hashing password.

| Dipakai untuk |
|---|
| Hash password baru saat buat akun (cost factor 10) |
| Verifikasi login |
| **Auto-upgrade MD5 → bcrypt**: password lama (dari migrasi MySQL) disimpan sebagai MD5 dengan flag `passwordLegacyMd5=true`; saat login pertama, hash di-upgrade otomatis ke bcrypt |

---

## 9. Zod

**Peran:** Validasi input form di Server Actions.

| Schema | Dipakai di |
|---|---|
| `loginSchema` | Auth login |
| `siswaSchema` | Form siswa |
| `guruSchema` | Form guru |
| `rombelSchema` | Form rombel (coerce number untuk select) |
| `mapelSchema` | Form mapel |
| `bukuSchema` | Form buku perpustakaan |
| `jenisPembayaranSchema`, `tagihanSchema` | SPP |
| `suratSchema` | Form surat |
| `kategoriKasusSchema`, `kasusSchema` | BK |
| `jalurPpdbSchema`, `pendaftaranPpdbSchema` | PPDB |
| `calonOsisSchema` | E-voting OSIS |
| `kategoriSarprasSchema`, `sarprasSchema` | Sarpras |
| `akunSchema` | Buat akun login |
| `guruSchema` | Form guru |

---

## 10. tsx

**Peran:** Menjalankan file TypeScript langsung (tanpa kompilasi terpisah) untuk script seed/ETL.

| Script | Fungsi |
|---|---|
| `npm run db:seed` | Seed referensi Profil Pelajar Pancasila + sekolah demo |
| `npm run seed:testusers` | Akun testing per role (password: `Test1234!`) |
| `npm run seed:dummy` | Data dummy awal (kehadiran, SPP, kasus, prestasi) |
| `npm run seed:rich` | Data lengkap & kaya untuk **semua 26 modul** |
| `npm run etl` | Migrasi data dari MySQL lama ke Postgres baru |

---

## Arsitektur pola utama

```
webapp/src/
├── app/
│   ├── (app)/                # Route group: wajib login
│   │   ├── layout.tsx        # Sidebar nav + auth guard + nav terfilter per role
│   │   ├── (staff)/          # Route group: staf saja (RBAC granular per modul)
│   │   │   ├── */layout.tsx  # 18 guard layout: requireModule("siswa"), dst
│   │   │   ├── siswa/        # Modul siswa
│   │   │   ├── nilai/        # Modul nilai/rapor (K13 + Merdeka + hal.2)
│   │   │   ├── ujian/        # CBT (bank soal PG/esai + timer + auto-grade)
│   │   │   └── ...           # 18+ modul lain
│   │   ├── portal/           # Portal siswa (nilai, SPP, kehadiran, pengumuman)
│   │   ├── tugas-saya/       # Portal siswa: lihat & kumpulkan tugas
│   │   └── ujian-saya/       # Portal siswa: daftar + kerjakan + hasil ujian
│   ├── (print)/              # Route group: halaman cetak bersih (A4)
│   │   └── cetak/
│   │       ├── rapor/        # Cetak rapor (hal.1 nilai + hal.2 ekstra/ketidakhadiran/catatan)
│   │       └── kwitansi/     # Cetak kwitansi pembayaran SPP
│   ├── daftar/[slug]/        # Form PPDB publik (tanpa login)
│   ├── cek-kelulusan/[slug]/ # Cek kelulusan publik via NISN
│   ├── api/auth/[...nextauth]/  # Auth.js route handler
│   └── login/                # Halaman login (field: username, password, kode sekolah)
│
├── lib/
│   ├── prisma.ts             # Singleton Prisma Client
│   ├── session.ts            # getCurrentUser, getSekolahId, isStaff, requireStaff
│   ├── permissions.ts        # ROLE_MODULES, canAccess, requireModule (RBAC)
│   ├── upload.ts             # saveImage (lokal dev; ganti object storage untuk prod)
│   ├── ujian.ts              # recomputeSkor (kalkulasi ulang skor CBT)
│   └── validations.ts        # Semua Zod schema
│
├── components/
│   ├── ConfirmDelete.tsx      # Tombol hapus generik (server action sebagai prop)
│   ├── AccountPanel.tsx       # Panel akun login (buat/reset/aktif-nonaktif)
│   ├── FotoUpload.tsx         # Upload foto guru/siswa
│   ├── PrintButton.tsx        # Tombol print (hidden saat cetak)
│   ├── PengumumanFeed.tsx     # Feed pengumuman (Server Component, filter audiens)
│   └── charts.tsx             # BarList + Donut (grafik CSS tanpa library eksternal)
│
└── auth.ts                   # Konfigurasi Auth.js (Credentials + JWT + callbacks)
```

---

## Fitur ↔ Stack mapping

| Fitur | Stack utama |
|---|---|
| Auth multi-tenant + RBAC | Auth.js v5, JWT, Prisma, bcryptjs, `permissions.ts` |
| Dashboard analytics | Prisma `groupBy`, `charts.tsx` (CSS/conic-gradient), Server Components |
| Data Siswa/Guru CRUD | Server Actions, Zod, Prisma, `useActionState` |
| Nilai/Rapor (K13 + Merdeka) | Prisma `upsert`, Server Actions, halaman cetak `(print)` |
| Rapor hal.2 e-Merdeka | `RaporCatatan` (Prisma model), `NilaiRaporEkstra`, `KehadiranSiswa.groupBy` |
| Cetak PDF (rapor + kwitansi) | Next.js `(print)` route group, Tailwind `@page`, `window.print()` |
| SPP & keuangan | Prisma `$transaction` (bayar+kwitansi), Zod, Server Actions |
| Kehadiran / Presensi | Prisma `upsert` batch, Server Actions, `$transaction` |
| BK / Pelanggaran | Prisma, Server Actions, filter per siswa |
| Perpustakaan | Prisma (buku + pinjaman), Server Actions |
| Ujian Online (CBT) | Prisma (Ujian/Soal/HasilUjian/JawabanUjian), `UjianRunner` (`useEffect` timer), auto-grade PG, `$transaction` |
| LMS Tugas | Prisma (Tugas/PengumpulanTugas), Server Actions, portal siswa |
| Ekstrakurikuler | Prisma (Ekstrakurikuler/AnggotaEkstra), Server Actions |
| P5 Kurikulum Merdeka | Prisma (DimensiProfil→ElemenProfil, ProjekP5, PenilaianP5), matriks penilaian predikat |
| PPDB | Server Actions, form publik `daftar/[slug]` tanpa login, Zod |
| Kelulusan | Prisma batch upsert, halaman publik `cek-kelulusan/[slug]` |
| E-voting OSIS | Prisma `@@unique` (1 suara/siswa), Server Actions |
| Pengumuman | Prisma (target enum: semua/staf/siswa/ortu), `PengumumanFeed` Server Component |
| Upload foto | `src/lib/upload.ts` (`writeFile` Node.js — **ganti ke object storage di Vercel**) |
| Kenaikan kelas | Prisma `upsert` batch, Server Actions (`redirect` setelah sukses) |
| Multi-tenant (SaaS) | `sekolah_id` di semua tabel, guard `requireModule`/`getSekolahId`, RLS template |

---

## Catatan penting untuk produksi

| Item | Status | Aksi |
|---|---|---|
| **Upload foto** | ⚠️ pakai `fs.writeFile` lokal | Ganti ke Supabase Storage / Vercel Blob |
| **RLS (Row-Level Security)** | 🟡 template siap | Aktifkan + wiring tenant context (lihat `docs/RLS.md`) |
| **`prisma migrate deploy`** | ✅ siap | Jalankan setelah set `DIRECT_URL` di Vercel |
| **`AUTH_SECRET`** | ✅ via env | Generate dengan `npx auth secret` |
| **Supabase slot** | ⚠️ plan free = 2 aktif | Pause 1 proyek atau upgrade Pro |
| **Node version** | ✅ 24.16 LTS | Pastikan Vercel pakai Node 20.x+ |

---

*Dokumen ini diperbarui: 2026-06-03. Versi terbaru: lihat `git log --oneline` di branch `main`.*
