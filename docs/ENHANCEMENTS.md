# Riset Lanjutan & Rekomendasi Enhancement

> Hasil riset fitur SIS/CMS sekolah modern (internasional + Indonesia) dibanding sistem kita, dengan rekomendasi adaptasi. Tanggal: 2026-06-03.

## Yang diriset
- SIS modern: Classter, Classe365, PowerSchool, Gibbon, RosarioSIS, Canvas/Schoology (LMS).
- SIM sekolah Indonesia: SkoolaCloud, CLOBAS, APPSO, SIM-Sekolah, mysch.id.
- Standar e-Rapor Kurikulum Merdeka (struktur rapor resmi).

## Gap Analysis (vs sistem kita)

| Fitur | Umum di SIS modern | Umum di Indonesia | Status kita | Prioritas |
|---|---|---|---|---|
| **Pengumuman + notifikasi** | ✅ | ✅ | ❌ | **🔴 Tinggi** |
| **Rapor: ekstrakurikuler + ketidakhadiran + catatan wali kelas** | ✅ | ✅ (wajib e-Rapor) | ⚠️ sebagian (nilai mapel saja) | **🔴 Tinggi** |
| **LMS: Tugas + pengumpulan + nilai** | ✅ | ✅ | ⚠️ (e-learning materi saja) | 🟠 Sedang |
| **Ujian Online / CBT + bank soal** | ✅ | ✅ (ANBK/ujian) | ❌ (`latihansoal` placeholder) | 🟠 Sedang |
| **Ekstrakurikuler (master + anggota + nilai)** | ✅ | ✅ | ❌ | 🟠 Sedang |
| **Dashboard analytics (grafik tren)** | ✅ | ✅ | ⚠️ (hitung sederhana) | 🟠 Sedang |
| **Bimbingan Konseling (sesi, bukan hanya pelanggaran)** | ✅ | ✅ | ⚠️ (pelanggaran saja) | 🟡 |
| **Izin/leave request (siswa/ortu ajukan)** | ✅ | ✅ | ❌ | 🟡 |
| **Kenaikan kelas (promosi rombel antar TA)** | ✅ | ✅ | ❌ | 🟡 |
| **Buku Induk siswa (ledger cetak)** | — | ✅ | ❌ | 🟡 |
| **Pembayaran online (payment gateway SPP)** | ✅ | ✅ | ❌ (manual) | 🟡 |
| **Prestasi / Beasiswa / Mutasi (UI)** | ✅ | ✅ | ⚠️ (skema ada, UI belum) | 🟡 |
| **Audit log aktivitas** | ✅ | ⚠️ | ⚠️ (`log_login` saja) | 🟢 |

## Rekomendasi terperinci (dengan skema)

### 1. 🔴 Pengumuman / Komunikasi  *(diimplementasikan turn ini)*
Gap lintas-semua-SIS. Model baru:
```prisma
model Pengumuman {
  id Int @id @default(autoincrement())
  sekolahId Int; judul String; isi String
  target PengumumanTarget @default(semua) // semua/staf/siswa/ortu
  pinned Boolean @default(false); createdAt DateTime @default(now())
}
enum PengumumanTarget { semua staf siswa ortu }
```
Staf (admin/humas/kepsek) buat → tampil di Dashboard (staf) & Portal (siswa/ortu) sesuai target. Lanjutan: notifikasi (email/web push), pesan 2 arah ortu↔guru.

### 2. 🔴 Enhance Rapor sesuai e-Rapor Merdeka (halaman 2)
e-Rapor resmi: hal.1 nilai mapel+capaian; **hal.2 = ekstrakurikuler (predikat Sangat Baik/Baik/Cukup/Kurang + deskripsi), rekap ketidakhadiran (sakit/izin/alpa), catatan wali kelas**.
- Reuse `NilaiRaporEkstra` (sudah ada) utk ekstrakurikuler → tambah UI input + render di cetak.
- Model baru `RaporCatatan { sekolahId, siswaId, periodeId, catatan?, sikap? }` (catatan wali kelas + nilai sikap).
- Rekap ketidakhadiran dihitung dari `KehadiranSiswa` per rentang tanggal periode.
- Render ketiganya di `/cetak/rapor`.

### 3. 🟠 LMS: Tugas + Pengumpulan
```prisma
model Tugas { id; sekolahId; guruId?; rombelId?; mapel?; judul; deskripsi?; deadline?; createdAt }
model PengumpulanTugas { id; tugasId; siswaId; fileUrl?/teks?; nilai?; tanggalKumpul; @@unique([tugasId,siswaId]) }
```
Siswa lihat tugas di portal → kumpulkan → guru nilai. Pengembangan dari modul e-learning.

### 4. 🟠 Ujian Online / CBT + Bank Soal
```prisma
model Ujian { id; sekolahId; mapel?; judul; durasiMenit?; mulai?; selesai? }
model Soal { id; ujianId; pertanyaan; opsi Json; kunci }
model HasilUjian { id; ujianId; siswaId; jawaban Json; skor; @@unique([ujianId,siswaId]) }
```
Auto-grade pilihan ganda. Fitur khas Indonesia (ANBK/PTS/PAS online).

### 5. 🟠 Ekstrakurikuler (master)
```prisma
model Ekstrakurikuler { id; sekolahId; nama; pembinaGuruId? }
model AnggotaEkstra { id; ekstraId; siswaId; @@unique([ekstraId,siswaId]) }
```
Feed ke penilaian ekstrakurikuler di rapor (#2).

### 6. 🟠 Dashboard Analytics
Grafik: tren kehadiran, distribusi nilai, status SPP, jumlah pelanggaran per bulan. Pakai chart (Recharts) di dashboard staf.

### 7. 🟡 Lainnya
- **Izin online**: siswa/ortu ajukan izin → masuk presensi (status izin/sakit).
- **Kenaikan kelas**: promosikan anggota rombel ke tingkat berikutnya tiap TA baru.
- **UI Prestasi/Beasiswa/Mutasi** (skema sudah ada).
- **Pembayaran online** SPP (Midtrans/Xendit) — saat ada gateway.
- **Audit log** semua aksi tulis.

## Sumber
- [Classter — 10 must-have SIS features 2026](https://www.classter.com/blog/edtech/10-must-have-features-in-a-student-information-system/) · [Classe365 SIS guide](https://www.classe365.com/blog/what-is-a-student-information-system-sis-features-and-benefits/)
- [SkoolaCloud — fitur SIM sekolah](https://skoolacloud.id/fitur-aplikasi-sistem-informasi-manajemen-sekolah/) · [APPSO](https://www.appso.id/) · [CLOBAS](https://clobas.co.id/) · [SIM-Sekolah](https://sim-sekolah.com/)
- [HashMicro — aplikasi sekolah terbaik 2026](https://www.hashmicro.com/id/blog/5-aplikasi-sekolah-terbaik-di-indonesia/)
- [Struktur rapor Kurikulum Merdeka — SMAN6 Bone](https://sman6bone.sch.id/read/117/rapor-pada-kurikulum-merdeka) · [Catatan wali kelas e-Rapor — mysch.id](https://mysch.id/blog/detail/131/contoh-catatan-wali-kelas) · [Deskripsi ekstrakurikuler rapor](https://www.kherysuryawan.id/2020/12/contoh-deskripsi-ekstrakurikuler-di.html)
- [PowerSchool — LMS untuk K-12](https://www.powerschool.com/blog/learning-management-system/) · [Easy-LMS — online exam builder & bank soal](https://www.easy-lms.com/features/online-exam-builder/question-bank-software/item12872)
