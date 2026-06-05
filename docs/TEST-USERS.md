# Akun Login untuk Testing

> ⚠️ **Hanya untuk testing/development.** Jangan dipakai di produksi. Akun `test_*` dibuat ulang via `npm run seed:testusers`.
> Saat login, isi **Kode Sekolah** (multi-tenant) sesuai kolom di bawah.

## Sekolah `smartschool` — "SEKOLAH NUSANTARA" (data hasil migrasi: 1.136 siswa)

Password akun `test_*` semuanya: **`Test1234!`**

| Kode Sekolah | Username | Password | Role | Akses |
|---|---|---|---|---|
| `smartschool` | `admin` | `admin` | admin | Back-office penuh (akun lama hasil migrasi) |
| `smartschool` | `test_admin` | `Test1234!` | admin | Back-office penuh |
| `smartschool` | `test_guru` | `Test1234!` | guru | Back-office (staf) |
| `smartschool` | `test_walikelas` | `Test1234!` | walikelas | Back-office (staf) |
| `smartschool` | `test_bk` | `Test1234!` | bk | Back-office (staf) |
| `smartschool` | `test_bendahara` | `Test1234!` | bendahara | Back-office (staf) |
| `smartschool` | `test_perpustakaan` | `Test1234!` | perpustakaan | Back-office (staf) |
| `smartschool` | `test_operator` | `Test1234!` | operator | Back-office penuh |
| `smartschool` | `test_kepsek` | `Test1234!` | kepsek | Back-office penuh |
| `smartschool` | `test_kurikulum` | `Test1234!` | kurikulum | Akademik (siswa, guru, rombel, mapel, nilai, jadwal, dll) |
| `smartschool` | `test_kesiswaan` | `Test1234!` | kesiswaan | Siswa, rombel, presensi, bk, ppdb, osis, kelulusan, ekskul, pengumuman |
| `smartschool` | `test_humas` | `Test1234!` | humas | PPDB, surat, pengumuman |
| `smartschool` | `test_sarpras` | `Test1234!` | sarpras | Sarpras saja |
| `smartschool` | `test_resepsionis` | `Test1234!` | resepsionis | Surat, PPDB |
| `smartschool` | `test_siswa` | `Test1234!` | siswa | **Portal siswa** (biodata, nilai, SPP, kehadiran) |
| `smartschool` | `test_ortu` | `Test1234!` | ortu | **Portal ortu** (daftar anak → "Siswa Tes") |

> Catatan role:
> - **RBAC kini per-modul, ditegakkan di server** (halaman + aksi + API). Acuan: `webapp/docs/RBAC-MATRIX.md`.
> - **Staf** masuk back-office sesuai modul yang diizinkan; akses URL terlarang → redirect `/dashboard?error=akses-ditolak`.
> - **End-user** (siswa, ortu) → hanya `/portal`; modul back-office diblokir (redirect `/portal`).
> - Akun `test_*` dibuat via `node prisma/seed-test-roles.mjs`, dinonaktifkan sebelum produksi via `node prisma/prod-prep.mjs`.

## Sekolah `demo` — "SMA Negeri 1 Demo" (kosong, hasil seed)

| Kode Sekolah | Username | Password | Role |
|---|---|---|---|
| `demo` | `admin` | `admin123` | admin |

## Siswa hasil migrasi (login dengan password lama)

Setiap siswa hasil migrasi punya akun: **username = NIS** (mis. `15192`), password = password lama (MD5, otomatis di-upgrade ke bcrypt saat login pertama). Jika password lama tidak diketahui, reset lewat back-office: **Data Siswa → (pilih siswa) → panel Akun Login → Reset**.
