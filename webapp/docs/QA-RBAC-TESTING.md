# Prompt QA — Pengujian RBAC per Role

Gunakan prompt ini untuk menguji bahwa Role-Based Access Control (RBAC) benar-benar
ditegakkan di **server**, bukan sekadar menyembunyikan menu.

---

## PROMPT UNTUK QA (copy-paste)

> Kamu adalah QA Engineer yang menguji RBAC aplikasi Smart School (Next.js, multi-tenant).
> Acuan izin: dokumen `docs/RBAC-MATRIX.md`. Aturan penegakan:
> - Halaman yang **boleh** → render normal (HTTP 200, konten tampil).
> - Halaman yang **ditolak** → redirect ke `/dashboard?error=akses-ditolak`.
> - Role end-user (siswa/ortu) yang membuka halaman staf → redirect `/portal`.
> - Sidebar HANYA menampilkan menu yang diizinkan role tersebut.
>
> **Untuk SETIAP role staf** (admin, operator, kepsek, kurikulum, kesiswaan, humas,
> guru, walikelas, bk, bendahara, perpustakaan, sarpras, resepsionis) lakukan:
>
> 1. **Login** sebagai akun dengan role tsb (lihat tabel akun uji di bawah).
> 2. **Cek sidebar**: catat menu yang muncul. Harus PERSIS sama dengan modul ✅ di matrix.
> 3. **Uji akses POSITIF**: buka 2-3 URL yang diizinkan → pastikan render 200 & konten benar.
> 4. **Uji akses NEGATIF (paling penting)**: ketik langsung di address bar URL modul yang
>    DILARANG untuk role itu → harus redirect ke `/dashboard?error=akses-ditolak`
>    (BUKAN menampilkan halamannya). Contoh: login `bendahara`, buka `/siswa`, `/guru`,
>    `/audit`, `/pengaturan` → semua harus tertolak.
> 5. **Uji aksi/mutasi**: bila role tak punya modul, pastikan tidak ada jalan submit
>    form/aksi modul tsb (idealnya server menolak walau request dipaksa).
> 6. **End-user**: login `siswa` lalu coba buka `/siswa`, `/nilai`, `/spp` → harus redirect `/portal`.
>
> Catat hasil dalam tabel: Role | URL diuji | Diharapkan | Aktual | Lolos? (✅/❌).
> Tandai TEMUAN KRITIS bila ada URL terlarang yang TETAP tampil (bocor RBAC).

---

## Skenario uji NEGATIF prioritas (paling rawan bocor)

| Login sebagai | Buka URL terlarang | Harus | 
|---|---|---|
| bendahara | /siswa, /guru, /audit, /pengaturan | redirect `akses-ditolak` |
| perpustakaan | /spp, /nilai, /siswa | redirect `akses-ditolak` |
| sarpras | /siswa, /ujian | redirect `akses-ditolak` |
| bk | /nilai, /spp, /mapel | redirect `akses-ditolak` |
| humas | /siswa, /nilai, /spp | redirect `akses-ditolak` |
| guru | /spp, /audit, /pengaturan, /bk | redirect `akses-ditolak` |
| walikelas | /guru, /mapel, /spp, /audit | redirect `akses-ditolak` |
| resepsionis | /siswa, /nilai, /audit | redirect `akses-ditolak` |
| siswa (end-user) | /dashboard, /siswa, /spp | redirect `/portal` |

## Akun uji (dev/demo — SEKOLAH NUSANTARA, kode: sesuai slug)
> Catatan: akun uji ini dinonaktifkan sebelum produksi via `prisma/prod-prep.mjs`.
> Verifikasi kredensial aktual di DB (tabel `users`); password seed umumnya seragam
> untuk demo. Untuk membuat akun uji per role, gunakan **Pengaturan → Manajemen Pengguna**.

| Role | Cara dapat akun |
|---|---|
| admin/operator/kepsek | Akun admin demo |
| guru, walikelas, bk, bendahara, perpustakaan, sarpras | Sudah ada di seed (cek /pengaturan/pengguna) |
| kurikulum, kesiswaan, humas, resepsionis | Buat via Manajemen Pengguna bila belum ada |

## Kriteria LULUS
- ✅ Semua akses positif tampil; semua akses negatif tertolak (redirect), TANPA kebocoran.
- ✅ Sidebar tiap role = persis modul di matrix.
- ✅ End-user tidak bisa masuk area staf.
- ❌ GAGAL bila ada satu saja URL terlarang yang masih menampilkan kontennya.
