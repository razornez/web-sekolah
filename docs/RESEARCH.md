# Riset Skema SIS/CMS Sekolah & Rekomendasi Adaptasi

> Tujuan: membuat sistem sekolah yang **mutakhir** dengan mengadopsi pola terbaik dari SIS open-source terkenal + **standar pendidikan Indonesia** (Dapodik & Kurikulum Merdeka).
> Tanggal: 2026-06-03. Dasar: [docs/AUDIT.md](AUDIT.md), [docs/SCHEMA.md](SCHEMA.md).

---

## 1. Sistem yang Diriset

| Sistem | Jenis | Stack | Yang dipelajari |
|---|---|---|---|
| **RosarioSIS** | SIS open-source (GPL) | PHP + **PostgreSQL/MySQL** | Marking period fleksibel, school year, grade level, billing, discipline |
| **Gibbon** | School platform open-source | PHP + MySQL | "Families" (grup ortu), enrollment, medical records, planner |
| **openSIS** | SIS open-source/komersial | PHP + MySQL | Modul gradebook, scheduling, portal ortu/siswa |
| **Dapodik** (Kemendikbud) | Standar data nasional 🇮🇩 | — | Entitas resmi: NPSN, NISN, NIK, NUPTK, PTK, **Rombongan Belajar** |
| **e-Rapor Kurikulum Merdeka** 🇮🇩 | Aplikasi rapor resmi | — | **Fase A–F**, Capaian Pembelajaran, **P5**, predikat |

---

## 2. Pola Kunci yang Ditemukan

### 2.1 Struktur akademik fleksibel (RosarioSIS) ⭐
Jangan hardcode "6 semester". Modelkan sebagai data:
- **Tahun Ajaran** → punya banyak **Periode Penilaian** (marking period): bisa semester, triwulan (quarter), atau progress period. Tiap periode punya tanggal & flag "dinilai/tidak".
- **Tingkat/Grade Level** sebagai master data.
- Mendukung sekolah apa pun (SD/SMP/SMA/SMK) tanpa ubah kode.

### 2.2 Enrollment sebagai relasi, bukan kolom ⭐
Di skema lama & v1 kita, `siswa.kelas_id` adalah kolom tunggal → tidak menyimpan **riwayat** kelas antar tahun. Pola modern (Dapodik "rombel"):
- **Rombel** (Rombongan Belajar) = kelas untuk satu tahun ajaran tertentu (punya tingkat + wali kelas).
- **AnggotaRombel** = keanggotaan siswa di rombel (per tahun) + nomor absen.
- Hasil: riwayat kelas siswa lintas tahun tersimpan otomatis (kelas 10 → 11 → 12).

### 2.3 Standar Dapodik 🇮🇩 ⭐
Selaraskan field identitas dengan standar nasional supaya kompatibel/ekspor mudah:
- Sekolah: **NPSN**. Siswa: **NISN**, NIK, nama ibu kandung. Guru/PTK: **NUPTK**, NIP, NIK.
- Istilah resmi: **PTK** (Pendidik & Tenaga Kependidikan), **Rombongan Belajar**, **Peserta Didik**.
- Data wilayah berjenjang: Provinsi → Kabupaten → Kecamatan → Desa/Kel.

### 2.4 Kurikulum Merdeka 🇮🇩 ⭐⭐ (gap terbesar)
Skema lama hanya model gaya **K13** (nilai pengetahuan + keterampilan). Kurikulum Merdeka butuh:
- **Fase** capaian (berlaku lintas 2 kelas, kecuali SMP & SMA kls11-12):

  | Fase | Jenjang / Kelas |
  |---|---|
  | A | SD kelas 1–2 |
  | B | SD kelas 3–4 |
  | C | SD kelas 5–6 |
  | D | SMP kelas 7–9 |
  | E | SMA/SMK kelas 10 |
  | F | SMA/SMK kelas 11–12 |

- **Capaian Pembelajaran (CP)** & **Tujuan Pembelajaran (TP)** per mapel per fase.
- Nilai akhir + **deskripsi capaian** (bukan sekadar angka pengetahuan/keterampilan).
- **P5 (Projek Penguatan Profil Pelajar Pancasila)**: Projek → **Dimensi** → **Elemen** → **Sub-elemen** Profil Pelajar Pancasila, dinilai dengan predikat: *Mulai Berkembang (MB) / Sedang Berkembang (SB) / Berkembang Sesuai Harapan (BSH) / Sangat Berkembang (SAB)*.

### 2.5 Portal Ortu & RBAC (Gibbon / SIS modern)
- **Orang tua/wali sebagai akun** (role `ortu`) yang bisa login lihat nilai/absensi/SPP anaknya. Di skema lama ortu hanya field di tabel siswa.
- **RBAC granular** — hak akses per fitur, bukan sekadar enum role kaku.

### 2.6 Multi-tenant (opsional, untuk SaaS)
Jika ingin satu aplikasi melayani **banyak sekolah** (model SaaS), tambahkan `sekolah_id` (tenant) di tiap tabel + isolasi data via Row-Level Security Postgres/Supabase. Jika hanya 1 sekolah, cukup satu baris `Sekolah` sebagai profil.

---

## 3. Gap Analysis: Skema v1 Kita vs Standar Modern

| Aspek | Skema v1 (sekarang) | Rekomendasi |
|---|---|---|
| Periode akademik | `semester` int 1–6 (hardcode) | `TahunAjaran` + `Periode` (data-driven) ✅ |
| Penempatan kelas | kolom `siswa.kelas_id` | `Rombel` + `AnggotaRombel` (riwayat) ✅ |
| Identitas | NISN/NIK/NUPTK ada | + NPSN sekolah, data wilayah berjenjang ✅ |
| Kurikulum | hanya K13 (pengetahuan/keterampilan) | dukung **Kurikulum Merdeka**: Fase, CP, deskripsi, **P5** ✅ |
| Orang tua | field di `siswa`/`orang_tua_wali` | + akun login ortu (role `ortu`) ✅ |
| Akses | enum `role` | RBAC granular (permission) — opsional ✅ |
| Multi-sekolah | tidak ada | `sekolah_id` + RLS (opsional, SaaS) |

---

## 4. Rencana Adaptasi ke Skema Kita (v2)

Yang akan ditambah/diubah pada [prisma/schema.prisma](../prisma/schema.prisma):

1. **`Sekolah`** (NPSN, jenjang, kurikulum aktif) — profil + calon tenant root.
2. **`TahunAjaran` + `Periode`** menggantikan kolom `semester` hardcode.
3. **`Tingkat`** diperkaya: `fase` (enum A–F) + urutan kelas.
4. **`Rombel` + `AnggotaRombel`** menggantikan `siswa.kelas_id` & `wali_kelas`.
5. **Kurikulum Merdeka**: `Mapel` + `fase`, `CapaianPembelajaran`, `NilaiRapor` diperluas (nilai akhir + deskripsi), dan modul **P5**: `ProjekP5`, `DimensiProfil`, `PenilaianP5`.
6. **Portal ortu**: `OrangTuaWali.userId` + role `ortu`; relasi anak-ortu.
7. **Wilayah** (opsional): tabel referensi `Wilayah` berjenjang.

> Field K13 lama tetap dipertahankan agar data historis bisa diimpor; Kurikulum Merdeka jadi mode utama untuk data baru.

---

## 5. Keputusan yang Diperlukan (sebelum enhance skema)

Pilihan berikut **mengubah bentuk skema secara signifikan**, jadi perlu konfirmasi Anda:
1. **Jenjang sekolah** — SD / SMP / SMA / SMK / MA? (menentukan Fase & jumlah tingkat yang di-seed)
2. **Kurikulum** — Kurikulum Merdeka, K13, atau dukung keduanya?
3. **Cakupan** — satu sekolah saja, atau multi-sekolah (SaaS)?
4. **Portal orang tua** — perlu akun login ortu atau cukup akun siswa?

---

## Sumber
- [RosarioSIS — GitHub](https://github.com/francoisjacquet/rosariosis) · [rosariosis.org](https://www.rosariosis.org/)
- [Gibbon — Features](https://gibbonedu.org/features/)
- [openSIS — Features](https://opensis.com/features)
- [Dapodik — Helpdesk Data Siswa](https://helpdesk.pauddasmen.id/help/en-us/21-data-pokok/53-data-siswa) · [Data Rinci PTK](https://helpdesk.pauddasmen.id/help/en-us/16-data-gtk/68-data-rinci-ptk)
- [NISN — Kemendikbud](https://jendela.kemdikbud.go.id/v2/fokus/detail/pendataan-siswa-indonesia-pastikan-siswa-miliki-nisn-dan-peroleh-manfaatnya)
- [Fase Kurikulum Merdeka — Quipper](https://www.quipper.com/id/blog/uncategorized/fase-kurikulum-merdeka/) · [Struktur Kurikulum Merdeka](https://ringkasanku.com/struktur-kurikulum-merdeka/)
- [e-Rapor Kurikulum Merdeka — Ditpsd Kemdikbud](https://ditpsd.kemdikbud.go.id/artikel/detail/e-rapor-kurikulum-merdeka-dikembangkan-sesederhana-mungkin) · [Pengisian Rapor P5 — Tirto](https://tirto.id/cara-pengisian-raport-p5-kurikulum-merdeka-dan-caranya-gZBG)
- [Multi-tenant DB design — GeeksforGeeks](https://www.geeksforgeeks.org/dbms/multi-tenant-application-database-design/)
