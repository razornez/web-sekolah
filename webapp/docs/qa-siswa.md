# QA Test — Modul Siswa (Akadewa)

Checklist uji **5 halaman Siswa** (List, Detail, Form, Edit, Rapor) + data-completeness + dwibahasa + performa/cache.
Tujuan: pastikan semua fitur **berfungsi**, angka **dari database** (no static data), dan **id↔en** konsisten.

> Cara pakai: jalankan tiap langkah, tandai ✅/❌, catat reproduksi bila gagal.

## Konteks & persiapan
- **Login** sebagai **admin / kepsek / operator** (role staf, akses modul `siswa`). Sekolah showcase (mis. id 2 / "SMA Tirta Marta").
- **Hard refresh** (Ctrl+Shift+R). Cek juga di **Incognito** untuk menyingkirkan ekstensi.
- Data sudah di-seed (foto/lat-lng/P5/catatan). Re-seed bila perlu (dari `webapp/`):
  `node --env-file=.env prisma/seed-foto-geo.mjs`
- **Switcher bahasa** ada di topbar (LanguageSwitcher) → uji tiap halaman dua kali (id & en).

---

## A. Halaman LIST (`/siswa`)
- [ ] A1. **Pulse — Komposisi**: total siswa nyata + DNA bar per-jenjang (klik segmen/kartu → fokus) + L/P + jumlah rombel.
- [ ] A2. **Pulse — Ulang tahun**: daftar ultah minggu ini (Hari ini/Besok/hari) dari `tanggalLahir`; klik baris → profil.
- [ ] A3. **Pulse — Perlu Perhatian**: Alpa berturut, belum foto, NIK belum lengkap, SPP nunggak — angka nyata; tiap baris nge-link.
- [ ] A4. **Mini-game**: soal dari data sekolah (kelas XI, ultah, foto, rasio P, SPP), klik benar → flash hijau + streak naik; salah → reveal; streak persist (refresh).
- [ ] A5. **Toolbar**: search (nama/NISN/NIS) → list tersaring; pill **Jenjang** (X/XI/XII); toggle **Galeri/Tabel**; **Tambah Siswa**.
- [ ] A6. **Quick-filter** (URL-driven): Aktif/Lulus/Pindah/Alumni + ♂/♀ + Perlu data lengkap → angka + filter benar; chip aktif jadi gelap.
- [ ] A7. **Galeri**: kartu **foto avatar** (DiceBear) + badge ultah + JK + tag (beasiswa/prestasi) + mini-stat **Rata²/Hadir%/SPP** nyata.
- [ ] A8. **Tabel**: avatar/nama/kelas/status/JK/rata²/hadir + aksi Profil/Rapor.
- [ ] A9. **Bulk bar**: klik kotak centang ≥1 → bar muncul (Broadcast WA/Cetak kartu/Batal).
- [ ] A10. **Pagination** muncul bila >24, navigasi benar.

## B. Halaman DETAIL (`/siswa/[id]`) — buka mis. `/siswa/146`
- [ ] B1. **Hero**: foto avatar tampil, chips (status/JK/kelas/fase/prestasi/beasiswa), meta, aksi (Kartu/WA-ortu/Edit/Rapor).
- [ ] B2. **Strip 6 metrik**: rata², kehadiran%, **peringkat kelas**, SPP, **BMI**, **Poin Pelanggaran** (nyata dari KasusSiswa).
- [ ] B3. **Persona**: Zodiak + **BMI meter** + Numerologi (dihitung dari tgl lahir & tinggi/berat).
- [ ] B4. **Akademik**: grafik **garis** tren + **radar** bakat (SVG dari nilai nyata).
- [ ] B5. **Perjalanan kelas** (timeline), **Rapor** (tab per-semester, ringkasan KKM).
- [ ] B6. **Heatmap kehadiran** 53 minggu dari KehadiranSiswa.
- [ ] B7. **Peta**: jarak **"±X km"** + **estimasi tempuh** (dihitung haversine dari lat/lng), alamat/transportasi.
- [ ] B8. **BK & Disiplin**: bila ada kasus → "N catatan · P poin" + daftar; gauge = 100−poin; bila bersih → empty state.
- [ ] B9. **SPP 12 bulan**, **Award shelf prestasi**, **Kartu ortu** (WA/Telepon nyata).
- [ ] B10. **Modal Kartu Pelajar**: klik "Cetak Kartu" → modal + 4 tema warna + preview real-time + Unduh/Cetak.

## C. Halaman FORM (`/siswa/new`)
- [ ] C1. Wizard 4 langkah (sidebar stepper), navigasi Selanjutnya/Mundur + klik step.
- [ ] C2. **Live preview**: mini kartu pelajar update real-time, **persona hint** muncul saat isi tgl lahir, **BMI auto** saat isi tinggi/berat, **meter kelengkapan** 9-item.
- [ ] C3. Isi nama+JK+tgl lahir + pilih **rombel** + isi ayah/ibu → **Simpan** → siswa baru muncul di list, **masuk rombel**, **ortu tersimpan** (cek di Detail).
- [ ] C4. Submit nama kosong → error validasi.

## D. Halaman EDIT (`/siswa/[id]/edit`)
- [ ] D1. Header "MODE EDIT" + "Diperbarui … oleh …" (dari AuditLog).
- [ ] D2. 5 section **collapsible** (klik header buka/tutup), badge "diubah" per-section.
- [ ] D3. Ubah field → **highlight emas "● Diubah"** + **save bar** muncul (hitung perubahan) + Batalkan reset.
- [ ] D4. **Riwayat Perubahan** (audit nyata) + **Danger** (Arsipkan=soft, Hapus=hard dgn ketik "HAPUS").
- [ ] D5. Simpan ubahan ortu → tersimpan (upsert). **FotoUpload** & **AccountPanel** ada di bawah.

## E. Halaman RAPOR (`/siswa/[id]/rapor`)
- [ ] E1. Dokumen Kurmer: kop 2 logo/NPSN, ornamen 4-sudut + watermark, tabel nilai per-KelompokMapel, ekstra/hadir/catatan/keputusan, TTD+stempel.
- [ ] E2. Tab **Rapor P5**: skala **MB/SB/BSH/SAB**, proyek dari PenilaianP5 (mis. siswa 146) atau empty state.
- [ ] E3. **Cetak / PDF** → print preview menyembunyikan action bar/tab/sidebar.

## F. Data-completeness (item 1–4)
- [ ] F1. **Foto**: avatar DiceBear tampil di hero/kartu (bukan inisial). Cek `siswa.foto` berisi URL `api.dicebear.com`.
- [ ] F2. **Jarak peta**: Detail menampilkan km + menit nyata (cek beberapa siswa beda jarak).
- [ ] F3. **Pelanggaran**: siswa dengan kasus → poin & daftar BK muncul; gauge turun.
- [ ] F4. **P5 & catatan**: siswa 146 → tab P5 terisi + catatan wali di rapor.

## G. Dwibahasa (item 5) — toggle id↔en di tiap halaman
- [ ] G1. **List**: Pulse, mini-game (pertanyaan+insight), toolbar, quick-filter, galeri/tabel, bulk bar — semua ganti bahasa; angka format locale (1.122 ↔ 1,122).
- [ ] G2. **Form**: step, label, hint, preview, completion ganti bahasa.
- [ ] G3. **Edit**: section, field, audit ("Diperbarui … / Updated …"), danger, save bar ganti bahasa.
- [ ] G4. **Detail**: hero/strip/persona/akademik/heatmap/peta/BK/SPP/ortu + modal kartu + tab rapor ganti bahasa.
- [ ] G5. **Rapor**: action bar + tab + crumb ganti bahasa.
- [ ] G6. Tidak ada teks mentah `siswa.xxx` / `MISSING_MESSAGE` di mana pun (cek console).

## H. Performa & Cache
- [ ] H1. **Pulse cached**: muat `/siswa` dua kali cepat berturut — load kedua lebih ringan (Pulse di-cache 60 dtk per sekolah, locale-independent).
- [ ] H2. **List selalu fresh**: Tambah/Edit/Hapus siswa → **galeri langsung update** (per-request, bukan cache).
- [ ] H3. **Pulse menyusul ≤60 dtk**: angka komposisi/quick-filter update dalam ≤1 menit setelah mutasi (TTL). *(Catatan: ini disengaja — widget at-a-glance, bukan bug.)*
- [ ] H4. Tidak ada query lambat mencolok: Detail/Rapor terbuka <1 dtk untuk 1 siswa.

## I. Permission & tenant
- [ ] I1. Tidak bisa buka siswa sekolah lain (ubah id URL → 404).
- [ ] I2. Hard delete butuh ketik "HAPUS"; soft delete reversibel via arsip.

## J. Responsif
- [ ] J1. ≤1180px: Pulse/persona/akademik/peta 1 kolom, stepper wizard horizontal, rail detail menumpuk.
- [ ] J2. ≤720px: galeri 2 kolom, drawer/modal full-width, tidak ada horizontal-scroll.

---

## ⚠️ Batasan yang DISENGAJA (bukan bug)
- **Foto** = avatar ilustrasi DiceBear (dummy, bukan wajah asli — aman untuk anak). Foto asli diunggah lewat **FotoUpload** di halaman Edit.
- **Peta** dekoratif (pin + rute stilasi); **jarak/menit NYATA** dari haversine lat/lng, tapi bukan rute jalan sebenarnya (belum ada routing engine).
- **Teks persona** (deskripsi zodiak/numerologi) tetap **Indonesia** walau mode EN — itu konten dari `persona.ts`, bukan UI chrome.
- **Badan dokumen Rapor** tetap **Indonesia** (dokumen resmi); hanya action bar/tab/crumb yang dwibahasa.
- **Medali prestasi** = emoji 🥇🥈🥉 di atas cakram gradient (bukan SVG 3D), dari data prestasi nyata.
- **Penempatan rombel & ortu** tersimpan saat **create/update**; ubah kelas masal lewat fitur Pindah Kelas terpisah.
- **Pulse staleness ≤60 dtk** setelah mutasi (TTL cache) — desain at-a-glance, galeri tetap instan.
- **"Persempit kelas" / broadcast WA / cetak kartu massal** di bulk bar = placeholder (perlu gateway WA / generator PDF massal).

## Cek data cepat (opsional, dari `webapp/`)
```
node --env-file=.env -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const sid=2;console.log('foto:',await p.siswa.count({where:{sekolahId:sid,foto:{not:null}}}),'/',await p.siswa.count({where:{sekolahId:sid,status:'aktif'}}));console.log('geo:',await p.siswa.count({where:{sekolahId:sid,lat:{not:null}}}));console.log('kasus:',await p.kasusSiswa.count({where:{sekolahId:sid}}));await p.\$disconnect()})()"
```
