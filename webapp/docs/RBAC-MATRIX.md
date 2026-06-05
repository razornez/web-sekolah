# RBAC Matrix — Smart School

Sumber kebenaran: `src/lib/permissions.ts` (`ROLE_MODULES`). Dokumen ini harus selalu
sinkron dengan file tersebut.

## Cara kerja (penegakan)

- **Akses halaman** di-enforce **server-side** lewat `requireModule(key)` di tiap page:
  1. Bukan staf (siswa/ortu) → redirect `/portal`
  2. `sekolahId` null → redirect `/dashboard?error=pilih-sekolah`
  3. Role tak punya izin modul → redirect **`/dashboard?error=akses-ditolak`**
- **Sidebar** hanya menampilkan menu yang `canAccess(role, key) === true` (kosmetik;
  bukan satu-satunya pengaman — server tetap menolak akses langsung via URL).
- Role tak terdaftar di `ROLE_MODULES` = **tidak punya akses modul apa pun**.

## Role end-user (non-staf)
| Role | Akses |
|---|---|
| `siswa` | Hanya **/portal**, /tugas-saya, /ujian-saya, /vote |
| `ortu` | Hanya **/portal** |
| `superadmin` | Lintas-sekolah (platform) — di luar matrix modul sekolah |

## Matrix Staf (modul × role)

Legenda: ✅ = boleh · — = ditolak (redirect ke dashboard)
Singkatan role: **AD** admin · **OP** operator · **KS** kepsek · **KU** kurikulum ·
**KSW** kesiswaan · **HM** humas · **GR** guru · **WK** walikelas · **BK** bk ·
**BN** bendahara · **PP** perpustakaan · **SP** sarpras · **RS** resepsionis

| Modul | URL | AD | OP | KS | KU | KSW | HM | GR | WK | BK | BN | PP | SP | RS |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Data Siswa | /siswa | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — |
| Data Guru | /guru | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Rombel/Kelas | /rombel | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Mata Pelajaran | /mapel | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Nilai/Rapor | /nilai | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | — | — |
| Projek P5 | /p5 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | — | — |
| Jurnal Mengajar | /jurnal | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Jadwal Mengajar | /jadwal | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| E-Learning | /elearning | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Presensi | /presensi | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| BK/Pelanggaran | /bk | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ | — | — | — | — |
| Perpustakaan | /perpustakaan | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | — | — |
| Sarpras | /sarpras | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | ✅ | — |
| Surat | /surat | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — | ✅ |
| SPP/Keuangan | /spp | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — |
| PPDB | /ppdb | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Kelulusan | /kelulusan | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — |
| Pemilihan OSIS | /osis | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | — | — | — |
| Pengumuman | /pengumuman | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — | — | — |
| Ekstrakurikuler | /ekstrakurikuler | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — | — | — | — |
| Tugas | /tugas | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Ujian Online | /ujian | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — | — | — |
| Audit Log | /audit | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — |
| Pengaturan | /pengaturan | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — |

### Ringkasan jumlah modul per role
- **admin / operator / kepsek**: 24 (semua)
- **guru**: 12 · **kurikulum**: 13 · **kesiswaan**: 9 · **walikelas**: 6
- **humas**: 3 · **resepsionis**: 2 · **bk**: 2
- **bendahara / perpustakaan / sarpras**: 1

> Dashboard (`/dashboard`) dapat diakses semua staf (tanpa cek modul).
