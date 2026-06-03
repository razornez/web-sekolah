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
| `smartschool` | `test_siswa` | `Test1234!` | siswa | **Portal siswa** (biodata, nilai, SPP, kehadiran) |
| `smartschool` | `test_ortu` | `Test1234!` | ortu | **Portal ortu** (daftar anak → "Siswa Tes") |

> Catatan role:
> - **Staf** (admin, guru, walikelas, bk, bendahara, perpustakaan, sarpras, resepsionis) → masuk ke back-office (`/dashboard`, modul). *Saat ini RBAC masih 2-tier — semua staf akses penuh; pembatasan per-modul menyusul.*
> - **End-user** (siswa, ortu) → hanya `/portal`; modul back-office otomatis diblokir (redirect).

## Sekolah `demo` — "SMA Negeri 1 Demo" (kosong, hasil seed)

| Kode Sekolah | Username | Password | Role |
|---|---|---|---|
| `demo` | `admin` | `admin123` | admin |

## Siswa hasil migrasi (login dengan password lama)

Setiap siswa hasil migrasi punya akun: **username = NIS** (mis. `15192`), password = password lama (MD5, otomatis di-upgrade ke bcrypt saat login pertama). Jika password lama tidak diketahui, reset lewat back-office: **Data Siswa → (pilih siswa) → panel Akun Login → Reset**.
