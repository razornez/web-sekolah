# Roadmap Fitur — Smart School

Hasil grooming 10 permintaan fitur + keputusan arsitektur. Dikerjakan bertahap.

## Keputusan arsitektur (dibakukan)
- **Payment**: gateway dibuat sendiri (widget consumable) → sekarang pakai abstraksi
  `PaymentProvider` + implementasi **stub/manual** (status pending→success, konfirmasi
  manual). UI lengkap, seam siap untuk widget gateway.
- **Notifikasi**: dispatcher 1 pintu → `inApp` (aktif), `email` (stub, aktif saat SMTP
  diisi), `wa` (stub + nomor dummy, aktif saat API diisi).
- **Storage**: lokal disk VPS `/public/uploads/{materi,selfie,...}` via helper `saveUpload()`.
- **Aplikasi Ortu**: web responsif (bukan PWA/native).

## Fase

### FASE A — Landing/Marketing (cepat, 0 backend) ← SEDANG DIKERJAKAN
- #4 Trusted-by (logo dummy)
- #8 Testimonial (dummy)
- #3 Matrix fitur × harga per-paket
- #1 Jadwalkan Demo (form → lead `pendaftaran_sekolah`, tipe=jadwal_demo)
- Section highlight LMS/CBT, Aplikasi Ortu, Satu Kartu (marketing copy)

### FASE B — Onboarding (#2)
- Checklist "Mulai Cepat" di dashboard sekolah baru (progress dari data).

### FASE C — Modul mandiri (tanpa dependensi eksternal)
- #9 RAPBS (anggaran: rencana vs realisasi)
- #10 Presensi Pegawai (selfie → /uploads, GPS geolocation, geofence opsional)
- #5a LMS inti: BankSoal (reusable), Materi terstruktur + upload, Diskusi, monitoring
- Notifikasi: bell in-app + dispatcher (email/WA stub)

### FASE D — Cluster fintech & kartu (stub payment + dummy WA)
- Dompet/Uang Saku: SaldoSiswa + TransaksiSaldo (top-up stub, konfirmasi manual)
- #6 Aplikasi Ortu lengkap: kehadiran/jadwal/tugas/capaian, perizinan + approval,
  tagihan & bayar (stub), uang saku, pengumuman
- #7 Satu Kartu: kartuUid (siswa+pegawai) → presensi/cashless/perpus (reader = hardware)
- #5b Distribusi otomatis materi/tugas terjadwal + notif

## Model data baru (akan dibuat per fase, semua tenant-scoped + cascade)
Notifikasi · BankSoal · Materi (+MateriFile) · Diskusi · Perizinan · SaldoSiswa ·
TransaksiSaldo · AnggaranRapbs · PresensiPegawai · kolom kartuUid · (lead: tipe + jadwalAt)

## Status sudah ada (jangan dibangun ulang)
CBT/Ujian (auto-grade PG) · E-Learning (link) · Tugas+Pengumpulan · Portal siswa/ortu
(basic) · SPP (pencatatan) · Pengumuman · Presensi siswa · RBAC · multi-tenant · i18n.
