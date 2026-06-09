# QA Test — Halaman Pengumuman (Akadewa)

Checklist uji fitur & fungsi halaman **Pengumuman** hasil revamp Akadewa.
Tujuan: pastikan semua fitur **berfungsi** dan semua angka **berasal dari database** (no static data).

> Cara pakai: jalankan tiap langkah, tandai ✅/❌, catat langkah reproduksi bila gagal.

## Konteks & persiapan
- **URL:** `/pengumuman` — login sebagai **admin / kepsek / operator** (role staf dengan akses modul `pengumuman`).
- **Data:** pakai sekolah showcase yang sudah punya pengumuman.
- **Sebelum mulai:** **hard refresh** (Ctrl+Shift+R). Untuk menyingkirkan false-positive ekstensi browser, jalankan juga sekali di **Incognito**.
- **Cek data nyata (opsional, dari `webapp/`):**
  `node --env-file=.env -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.pengumuman.groupBy({by:['kategori'],_count:{_all:true}}).then(r=>{console.log(r);return p.$disconnect()})"`

---

## A. Mini-game "Tebak Kategori"
- [ ] A1. Kartu berisi **judul pengumuman nyata** (bukan teks contoh); footer "Untuk: <target>".
- [ ] A2. Timer mulai **8s**, ring mengecil; saat ≤3s ring & angka jadi **oranye**.
- [ ] A3. Klik bin **benar** → flash hijau, sticky **terbang**, muncul **"+1"**, **Streak** naik.
- [ ] A4. Klik bin **salah** → flash oranye, sticky **shake**, bin benar di-highlight, **Streak reset**.
- [ ] A5. Biarkan **timeout** → streak reset, kartu ganti, tanpa flash bin.
- [ ] A6. Naikkan streak lalu **refresh** → **Rekor** tetap (localStorage).
- [ ] A7. Setelah **3 benar beruntun** → muncul **kartu Insight** fakta nyata sekolah; "Lanjut →" lanjut ronde.
- [ ] A8. "Buat pengumuman" → buka wizard; tombol reset → ronde baru.

## B. Kartu filter kategori
- [ ] B1. 6 kartu: **Semua / Umum / Akademik / Keuangan / Kegiatan / Penting**, masing-masing ber-angka.
- [ ] B2. Angka tiap kategori **cocok** dengan jumlah pengumuman (cek silang ke list/DB).
- [ ] B3. Klik kartu → list terfilter, kartu aktif jadi **gelap**; "Semua" → tampil semua.

## C. Toolbar
- [ ] C1. **Search** → menyaring berdasarkan **judul + isi** (real-time).
- [ ] C2. Pills **Target** (Semua/Staf/Siswa/Ortu) → list tersaring per target.

## D. Cork board "Disematkan"
- [ ] D1. Muncul **hanya** bila ada pengumuman `pinned`/`prioritas`/kategori `penting`; tampil ≤3 sticky.
- [ ] D2. Tiap sticky: **push pin** warna beda (merah/biru/hijau), rotasi beda; **hover** → tegak + terangkat.
- [ ] D3. Klik sticky → buka **detail drawer**.

## E. List collapsible
- [ ] E1. Terkelompok **per kategori**; header grup punya ikon, nama, jumlah, **chevron**.
- [ ] E2. Klik header → **collapse/expand** (animasi).
- [ ] E3. Item: thumbnail, judul, badge **kategori + target + "Penting"** (badge Penting berkedip), snippet, meta: **tanggal**, **"Dibaca X% · N dari M"**, status WA/terjadwal.
- [ ] E4. **Hover** item → aksi **Detail / Edit / WA**.
- [ ] E5. Klik **WA** → buka `wa.me` berisi judul+isi.

## F. Detail drawer
- [ ] F1. Buka dari item/sticky → **slide dari kanan**, overlay gelap blur.
- [ ] F2. Hero gradient sesuai kategori; chips kategori/target/penting; judul; meta tanggal/penulis/dilihat.
- [ ] F3. Isi HTML ter-render (heading, list, bold).
- [ ] F4. Bila ada **lampiran** → tautan file; klik → terbuka di tab baru.
- [ ] F5. **Reach widget** multi-segmen + legend **Dibaca siswa / ortu / guru / Belum** (angka nyata).
- [ ] F6. Footer: **Edit / Kirim WA ulang / Tutup**; klik overlay / ✕ → tertutup.

## G. Compose wizard (Buat Pengumuman)
- [ ] G1. Buka dari **FAB**, mini-game, atau cork board. Klik overlay → tutup.
- [ ] G2. **Step 1:** 6 kartu kategori **berikon**; pilih → **tercentang**; chip **Sematkan / Prioritas / Butuh balasan** toggle.
- [ ] G3. **Step 2:** isi **Judul**; editor **Tiptap** (B/I/U/list/link) jalan; **dropzone** klik **atau drag-drop** file → **nama file muncul** (PNG/JPG/PDF ≤5MB).
- [ ] G4. **Step 3:** 4 kartu target **berikon** + **jumlah audiens nyata**; chip persempit kelas; **"@ sapa langsung"** → ketik ≥2 huruf → **dropdown nama siswa nyata + NISN** → klik → ter-tambah.
- [ ] G5. **Step 4:** Kirim sekarang/**Jadwalkan** (input tanggal-jam); channel WA/Email/SMS; pengingat ulang; **Preview WhatsApp** menampilkan **judul + isi asli** + footer; **Ringkasan** "terkirim ke N <unit>".
- [ ] G6. Navigasi Selanjutnya/Mundur; klik step di sidebar (yang sudah dilewati) untuk lompat.
- [ ] G7. **"Kirim pengumuman"** → tersimpan, redirect ke list, **muncul** di list + angka kategori naik.

## H. Integrasi data nyata
- [ ] H1. Buat dengan **lampiran** → file ada di `public/uploads/pengumuman/<sekolahId>/` & **tampil di drawer**.
- [ ] H2. Buat dengan **Jadwalkan** (masa depan) → **tidak langsung** publish (`publishedAt` kosong).
- [ ] H3. **Read-receipt:** login **siswa/ortu**, buka 1 detail → kembali ke staff, refresh → **"Dibaca %"** & reach naik.
- [ ] H4. **Edit** judul/isi → simpan → perubahan terlihat.

## I. Cron (terjadwal & pengingat)
- [ ] I1. `GET /api/cron/pengumuman-kirim` dengan header `x-cron-secret: <CRON_SECRET>` → `{ ok, published, reminders }`; terjadwal yang jatuh tempo ter-publish.
- [ ] I2. Tanpa secret / secret salah → **403/503**.

## J. Permission & tenant
- [ ] J1. Pengumuman target **"staf"** **tidak** terlihat oleh siswa/ortu (detail → 404).
- [ ] J2. Tidak bisa membuka pengumuman **sekolah lain** (ubah id di URL → 404).

## K. Responsif
- [ ] K1. **≤1180px**: mini-game menumpuk, kategori 3 kolom, cork 1 kolom, **sidebar wizard hilang**.
- [ ] K2. **≤720px**: kategori 2 kolom, **drawer full-width**.
- [ ] K3. Tidak ada **horizontal-scroll / zoom-out** di mobile.

## L. Edge cases
- [ ] L1. Sekolah tanpa pengumuman → **empty state** rapi.
- [ ] L2. Wizard submit **judul/isi kosong** → **pesan error**, tidak tersimpan.
- [ ] L3. Upload **>5MB** atau tipe selain PNG/JPG/PDF → **ditolak**.
- [ ] L4. Search tanpa hasil → "Tidak ada pengumuman yang cocok."

---

## ⚠️ Batasan yang DISENGAJA (bukan bug — jangan dilaporkan)
- **"Persempit ke kelas"** & **"@ sapa langsung"**: nama **muncul** sesuai desain, tapi **belum mempersempit** pengiriman nyata (model `target` masih kasar: semua/staf/siswa/ortu). Perlu tabel penerima per-orang bila ingin benar-benar dihormati saat kirim.
- **Dispatch WA/SMS eksternal**: belum ada gateway → log status tercatat, blast otomatis belum jalan. Kanal **in-app/portal** nyata (terlacak read-receipt).
- **Reach widget** dibedah per **tipe penerima** (siswa/ortu/guru), **bukan** per channel (DB mencatat *siapa* yang baca, bukan *lewat mana*).
- **Countdown D-1/D-5** tidak ada (tak ada kolom tanggal-acara) → label PRIORITAS/DISEMATKAN.
- **Bahasa** halaman masih Indonesia (belum EN).
- **DB**: kolom/tabel baru (`PengumumanBaca`, `PengumumanKirim`, kolom `scheduledAt`/`channels`/`lampiran`/dst) di-`db push` ke dev. Untuk deploy perlu `prisma migrate` proper.

---

## Catatan: error "The children should not have changed if we pass in the same set"
Ini **bug ekstensi React DevTools** (stack 100% di `installHook.js`, dipanggil React saat *menotifikasi* DevTools setelah commit) + diperparah HMR WebSocket putus saat dev server restart. **Bukan** error app/React. Verifikasi: **Incognito** atau **disable React DevTools** → error hilang. Tidak akan muncul di production.
