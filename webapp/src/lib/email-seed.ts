/**
 * Seed 17 template email default platform.
 * Dipanggil sekali via `npx tsx src/lib/email-seed.ts` atau via /api/admin.
 * Menggunakan upsert — aman dijalankan berulang.
 */
import { prisma } from "@/lib/prisma";

const TEMPLATES = [
  {
    key: "reset_password",
    name: "Reset Password",
    description: "Dikirim saat user meminta reset password via /lupa-password.",
    category: "auth",
    subject: "Reset Password — {{namaAplikasi}}",
    bodyHtml: `<p>Halo <b>{{namaUser}}</b>,</p>
<p>Kami menerima permintaan reset password untuk akun Anda di <b>{{namaAplikasi}}</b>.</p>
<p><a href="{{link}}" style="background:#1e293b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
<p>Link berlaku sampai <b>{{expiredAt}}</b>. Jika bukan Anda yang meminta, abaikan email ini.</p>`,
    variables: [
      { name: "namaUser", description: "Nama lengkap penerima", example: "Budi Santoso" },
      { name: "link", description: "URL reset password (token)", example: "https://app.com/reset?token=xxx" },
      { name: "expiredAt", description: "Waktu kedaluwarsa link", example: "08 Jun 2026 15:30" },
      { name: "namaAplikasi", description: "Nama brand aplikasi", example: "Smart School" },
    ],
  },
  {
    key: "verifikasi_email",
    name: "Verifikasi Email Signup",
    description: "Dikirim setelah daftar mandiri untuk konfirmasi alamat email.",
    category: "auth",
    subject: "Verifikasi Email — {{namaAplikasi}}",
    bodyHtml: `<p>Halo <b>{{namaUser}}</b>,</p>
<p>Terima kasih telah mendaftar di <b>{{namaAplikasi}}</b>. Klik tombol berikut untuk memverifikasi alamat email Anda:</p>
<p><a href="{{link}}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Verifikasi Email</a></p>
<p>Link berlaku sampai <b>{{expiredAt}}</b>.</p>`,
    variables: [
      { name: "namaUser", description: "Nama PIC", example: "Budi Santoso" },
      { name: "link", description: "URL verifikasi email", example: "https://app.com/verify?token=xxx" },
      { name: "expiredAt", description: "Waktu kedaluwarsa", example: "08 Jun 2026 15:30" },
      { name: "namaAplikasi", description: "Nama brand", example: "Smart School" },
    ],
  },
  {
    key: "demo_welcome",
    name: "Sambutan Akun Demo",
    description: "Dikirim langsung setelah sekolah berhasil daftar demo mandiri.",
    category: "saas",
    subject: "Selamat Datang di {{namaAplikasi}} — Akun Demo Anda Siap!",
    bodyHtml: `<p>Halo <b>{{namaUser}}</b>,</p>
<p>Akun demo <b>{{namaSekolah}}</b> sudah siap digunakan di <b>{{namaAplikasi}}</b>!</p>
<ul>
  <li><b>Kode Sekolah:</b> <code>{{slug}}</code></li>
  <li><b>Username:</b> {{username}}</li>
  <li><b>Berlaku sampai:</b> {{expiredAt}}</li>
</ul>
<p><a href="{{linkLogin}}" style="background:#1e293b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Login Sekarang</a></p>
<p>Data demo akan dihapus otomatis setelah masa berlaku habis. <a href="{{linkUpgrade}}">Upgrade ke akun penuh</a> untuk menyimpan data.</p>`,
    variables: [
      { name: "namaUser", description: "Nama PIC yang daftar", example: "Budi Santoso" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "slug", description: "Kode sekolah untuk login", example: "sma-n-1-jakarta" },
      { name: "username", description: "Username admin sekolah", example: "admin" },
      { name: "expiredAt", description: "Waktu berakhir demo", example: "09 Jun 2026 10:00" },
      { name: "linkLogin", description: "URL halaman login", example: "https://app.com/login" },
      { name: "linkUpgrade", description: "URL halaman upgrade", example: "https://app.com/daftar-sekolah" },
      { name: "namaAplikasi", description: "Nama brand", example: "Smart School" },
    ],
  },
  {
    key: "demo_expiry_warning",
    name: "Peringatan Demo Hampir Berakhir",
    description: "Dikirim H-6 jam sebelum akun demo dihapus.",
    category: "saas",
    subject: "⏳ Akun Demo {{namaSekolah}} Berakhir dalam {{jamTersisa}} Jam",
    bodyHtml: `<p>Halo,</p>
<p>Akun demo <b>{{namaSekolah}}</b> di <b>{{namaAplikasi}}</b> akan berakhir dalam <b>{{jamTersisa}} jam</b>.</p>
<p>Seluruh data akan dihapus otomatis setelah masa berlaku habis.</p>
<p><a href="{{linkUpgrade}}" style="background:#d97706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Upgrade Sekarang</a></p>`,
    variables: [
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "jamTersisa", description: "Sisa jam demo", example: "6" },
      { name: "linkUpgrade", description: "URL upgrade", example: "https://app.com/daftar-sekolah" },
      { name: "namaAplikasi", description: "Nama brand", example: "Smart School" },
    ],
  },
  {
    key: "demo_expired",
    name: "Demo Sudah Berakhir",
    description: "Dikirim setelah data demo dihapus oleh CRON.",
    category: "saas",
    subject: "Akun Demo {{namaSekolah}} Telah Berakhir",
    bodyHtml: `<p>Halo,</p>
<p>Masa demo <b>{{namaSekolah}}</b> di <b>{{namaAplikasi}}</b> telah berakhir dan data telah dihapus.</p>
<p>Daftar akun penuh kapan saja untuk memulai dengan data baru:</p>
<p><a href="{{linkDaftar}}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Daftar Akun Penuh</a></p>`,
    variables: [
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "linkDaftar", description: "URL daftar sekolah", example: "https://app.com/daftar-sekolah" },
      { name: "namaAplikasi", description: "Nama brand", example: "Smart School" },
    ],
  },
  {
    key: "jadwal_demo_konfirmasi",
    name: "Konfirmasi Jadwal Demo (ke lead)",
    description: "Auto-reply ke calon pelanggan yang mengisi form /jadwal-demo.",
    category: "saas",
    subject: "Konfirmasi Jadwal Demo — {{namaAplikasi}}",
    bodyHtml: `<p>Halo <b>{{namaPIC}}</b>,</p>
<p>Terima kasih telah menjadwalkan demo <b>{{namaAplikasi}}</b> untuk <b>{{namaSekolah}}</b>.</p>
<p>Tim kami akan menghubungi Anda pada <b>{{jadwalAt}}</b>.</p>
<p>Jika ada pertanyaan, balas email ini atau hubungi kami langsung.</p>`,
    variables: [
      { name: "namaPIC", description: "Nama penanggung jawab", example: "Budi Santoso" },
      { name: "namaSekolah", description: "Nama sekolah lead", example: "SMP Islam Al Hikmah" },
      { name: "jadwalAt", description: "Waktu demo dijadwalkan", example: "Senin, 10 Jun 2026 10:00" },
      { name: "namaAplikasi", description: "Nama brand", example: "Smart School" },
    ],
  },
  {
    key: "jadwal_demo_notif_admin",
    name: "Notif Lead Baru (ke operator)",
    description: "Dikirim ke email superadmin/operator saat ada jadwal demo masuk.",
    category: "saas",
    subject: "Lead Baru: {{namaSekolah}} — Jadwal {{jadwalAt}}",
    bodyHtml: `<p>Lead jadwal demo baru masuk:</p>
<ul>
  <li><b>Sekolah:</b> {{namaSekolah}}</li>
  <li><b>PIC:</b> {{namaPIC}}</li>
  <li><b>Email:</b> {{email}}</li>
  <li><b>Telepon:</b> {{telepon}}</li>
  <li><b>Jadwal:</b> {{jadwalAt}}</li>
</ul>`,
    variables: [
      { name: "namaSekolah", description: "Nama sekolah lead", example: "SMP Islam Al Hikmah" },
      { name: "namaPIC", description: "Nama PIC", example: "Budi Santoso" },
      { name: "email", description: "Email lead", example: "budi@sekolah.sch.id" },
      { name: "telepon", description: "No telepon lead", example: "08123456789" },
      { name: "jadwalAt", description: "Waktu demo", example: "Senin, 10 Jun 2026 10:00" },
    ],
  },
  {
    key: "ppdb_konfirmasi",
    name: "Konfirmasi Terima Pendaftaran PPDB",
    description: "Dikirim ke email calon siswa/orang tua setelah submit PPDB.",
    category: "ppdb",
    subject: "Konfirmasi Pendaftaran PPDB — {{namaSekolah}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Pendaftaran <b>{{namaSiswa}}</b> di <b>{{namaSekolah}}</b> telah kami terima.</p>
<ul>
  <li><b>No. Pendaftaran:</b> {{noPendaftaran}}</li>
  <li><b>Tanggal Daftar:</b> {{tanggal}}</li>
</ul>
<p>Simpan nomor pendaftaran ini untuk keperluan selanjutnya. Kami akan menghubungi Anda jika ada update status.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua/wali", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama calon siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "noPendaftaran", description: "Nomor pendaftaran", example: "PPDB-2026-0042" },
      { name: "tanggal", description: "Tanggal pendaftaran", example: "08 Jun 2026" },
    ],
  },
  {
    key: "ppdb_status_update",
    name: "Update Status PPDB",
    description: "Dikirim saat status pendaftaran PPDB berubah.",
    category: "ppdb",
    subject: "Update Status PPDB {{namaSiswa}} — {{namaSekolah}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Status pendaftaran <b>{{namaSiswa}}</b> di <b>{{namaSekolah}}</b> telah diperbarui:</p>
<p style="font-size:18px;font-weight:bold;color:#1e293b;">{{status}}</p>
<p>{{catatan}}</p>
<p>Hubungi pihak sekolah untuk informasi lebih lanjut.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua/wali", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama calon siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "status", description: "Status baru (Diterima/Ditolak/dll)", example: "Diterima" },
      { name: "catatan", description: "Catatan tambahan dari sekolah", example: "Harap hadir orientasi pada 15 Jul 2026." },
    ],
  },
  {
    key: "spp_tagihan",
    name: "Tagihan SPP Bulanan",
    description: "Dikirim ke email orang tua tiap awal bulan.",
    category: "spp",
    subject: "Tagihan SPP {{bulan}} — {{namaSekolah}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Tagihan SPP <b>{{namaSiswa}}</b> bulan <b>{{bulan}}</b>:</p>
<ul>
  <li><b>Nominal:</b> Rp {{nominal}}</li>
  <li><b>Batas Bayar:</b> {{batasBayar}}</li>
</ul>
<p>Pembayaran dapat dilakukan melalui teller sekolah atau transfer ke rekening yang telah ditentukan.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "bulan", description: "Bulan tagihan", example: "Juli 2026" },
      { name: "nominal", description: "Nominal tagihan", example: "350.000" },
      { name: "batasBayar", description: "Batas waktu bayar", example: "10 Jul 2026" },
    ],
  },
  {
    key: "spp_konfirmasi_bayar",
    name: "Konfirmasi Pembayaran SPP",
    description: "Dikirim ke orang tua saat SPP dicatat lunas.",
    category: "spp",
    subject: "Konfirmasi Pembayaran SPP {{bulan}} — {{namaSiswa}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Pembayaran SPP <b>{{namaSiswa}}</b> bulan <b>{{bulan}}</b> sebesar <b>Rp {{nominal}}</b> telah kami terima pada <b>{{tanggalBayar}}</b>.</p>
<p>Terima kasih atas pembayaran tepat waktu.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "bulan", description: "Bulan yang dibayar", example: "Juli 2026" },
      { name: "nominal", description: "Nominal dibayar", example: "350.000" },
      { name: "tanggalBayar", description: "Tanggal pembayaran", example: "05 Jul 2026" },
    ],
  },
  {
    key: "rapor_tersedia",
    name: "Rapor Sudah Dapat Dilihat",
    description: "Dikirim ke orang tua saat rapor semester dipublikasikan.",
    category: "nilai",
    subject: "Rapor {{semester}} {{namaSiswa}} Sudah Tersedia",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Rapor <b>{{namaSiswa}}</b> semester <b>{{semester}}</b> di <b>{{namaSekolah}}</b> sudah dapat dilihat.</p>
<p><a href="{{linkRapor}}" style="background:#1e293b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Lihat Rapor</a></p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "semester", description: "Semester/periode rapor", example: "Ganjil 2025/2026" },
      { name: "linkRapor", description: "URL lihat rapor online", example: "https://app.com/portal/rapor" },
    ],
  },
  {
    key: "presensi_absen",
    name: "Notif Ketidakhadiran Siswa",
    description: "Dikirim ke orang tua saat siswa tidak hadir (alpha/sakit/izin).",
    category: "presensi",
    subject: "Info Kehadiran {{namaSiswa}} — {{tanggal}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Kami ingin memberitahu bahwa <b>{{namaSiswa}}</b> hari ini (<b>{{tanggal}}</b>) tercatat: <b>{{status}}</b>.</p>
<p>Jika ada pertanyaan, silakan hubungi <b>{{namaSekolah}}</b>.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "tanggal", description: "Tanggal absen", example: "Senin, 08 Jun 2026" },
      { name: "status", description: "Status kehadiran", example: "Alpha" },
    ],
  },
  {
    key: "tugas_baru",
    name: "Tugas Baru Diterbitkan",
    description: "Dikirim ke siswa saat guru menerbitkan tugas baru.",
    category: "tugas",
    subject: "Tugas Baru: {{judulTugas}} — {{namaMapel}}",
    bodyHtml: `<p>Halo <b>{{namaSiswa}}</b>,</p>
<p>Guru <b>{{namaMapel}}</b> telah memberikan tugas baru:</p>
<p style="font-size:16px;font-weight:bold;">{{judulTugas}}</p>
<p><b>Deadline:</b> {{deadline}}</p>
<p>Login ke portal siswa untuk melihat detail dan mengumpulkan tugas.</p>`,
    variables: [
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaMapel", description: "Nama mata pelajaran", example: "Matematika" },
      { name: "judulTugas", description: "Judul tugas", example: "Latihan Soal Persamaan Kuadrat" },
      { name: "deadline", description: "Batas pengumpulan", example: "Jumat, 12 Jun 2026 23:59" },
    ],
  },
  {
    key: "tugas_deadline",
    name: "Pengingat Deadline Tugas",
    description: "Dikirim ke siswa H-1 deadline jika belum mengumpulkan.",
    category: "tugas",
    subject: "⏰ Pengingat: Tugas {{judulTugas}} Deadline Besok",
    bodyHtml: `<p>Halo <b>{{namaSiswa}}</b>,</p>
<p>Tugas <b>{{judulTugas}}</b> ({{namaMapel}}) akan berakhir pada <b>{{deadline}}</b>.</p>
<p>Kamu belum mengumpulkan. Jangan sampai terlambat!</p>`,
    variables: [
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaMapel", description: "Nama mata pelajaran", example: "Matematika" },
      { name: "judulTugas", description: "Judul tugas", example: "Latihan Soal Persamaan Kuadrat" },
      { name: "deadline", description: "Batas pengumpulan", example: "Jumat, 12 Jun 2026 23:59" },
    ],
  },
  {
    key: "bk_kasus",
    name: "Notif Kasus BK ke Orang Tua",
    description: "Dikirim ke orang tua saat ada pencatatan kasus BK untuk siswa mereka.",
    category: "bk",
    subject: "Pemberitahuan BK — {{namaSiswa}}",
    bodyHtml: `<p>Halo <b>{{namaOrtu}}</b>,</p>
<p>Kami ingin memberitahu bahwa <b>{{namaSiswa}}</b> telah dicatat dalam buku konseling pada <b>{{tanggal}}</b>.</p>
<p><b>Kategori:</b> {{kategori}}</p>
<p>Mohon untuk menghubungi guru BK <b>{{namaSekolah}}</b> untuk informasi lebih lanjut.</p>`,
    variables: [
      { name: "namaOrtu", description: "Nama orang tua", example: "Bapak Hendra" },
      { name: "namaSiswa", description: "Nama siswa", example: "Rizky Firmansyah" },
      { name: "namaSekolah", description: "Nama sekolah", example: "SMA Negeri 1 Jakarta" },
      { name: "tanggal", description: "Tanggal kasus dicatat", example: "08 Jun 2026" },
      { name: "kategori", description: "Kategori kasus BK", example: "Kedisiplinan" },
    ],
  },
  {
    key: "cron_cleanup_report",
    name: "Laporan CRON Cleanup Demo",
    description: "Dikirim ke superadmin setiap kali CRON cleanup demo selesai berjalan.",
    category: "sistem",
    subject: "Laporan Cleanup Demo — {{tanggal}}",
    bodyHtml: `<p>CRON cleanup demo selesai pada <b>{{tanggal}}</b>.</p>
<ul>
  <li><b>Jumlah sekolah dihapus:</b> {{jumlahDihapus}}</li>
</ul>
<p>{{daftarSekolah}}</p>`,
    variables: [
      { name: "tanggal", description: "Waktu CRON berjalan", example: "08 Jun 2026 04:00" },
      { name: "jumlahDihapus", description: "Jumlah tenant yang dihapus", example: "3" },
      { name: "daftarSekolah", description: "Daftar nama sekolah yang dihapus", example: "Demo SD A, Demo SMP B" },
    ],
  },
];

async function seedTemplates() {
  console.log("Seeding email templates...");
  for (const t of TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, description: t.description, category: t.category, subject: t.subject, bodyHtml: t.bodyHtml, variables: t.variables },
      create: { ...t, variables: t.variables },
    });
    console.log(`  ✓ ${t.key}`);
  }
  console.log(`Done. ${TEMPLATES.length} templates seeded.`);
}

seedTemplates().catch(console.error).finally(() => prisma.$disconnect());
