-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'operator', 'kepsek', 'humas', 'kurikulum', 'kesiswaan', 'guru', 'walikelas', 'siswa', 'ortu', 'bk', 'bendahara', 'resepsionis', 'perpustakaan', 'sarpras');

-- CreateEnum
CREATE TYPE "Jenjang" AS ENUM ('PAUD', 'TK', 'SD', 'MI', 'SMP', 'MTS', 'SMA', 'MA', 'SMK');

-- CreateEnum
CREATE TYPE "Fase" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');

-- CreateEnum
CREATE TYPE "Kurikulum" AS ENUM ('MERDEKA', 'K13');

-- CreateEnum
CREATE TYPE "JenisPeriode" AS ENUM ('semester', 'triwulan', 'caturwulan');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusSiswa" AS ENUM ('aktif', 'lulus', 'pindah', 'keluar', 'alumni');

-- CreateEnum
CREATE TYPE "TipeWali" AS ENUM ('ayah', 'ibu', 'wali');

-- CreateEnum
CREATE TYPE "JenisPresensi" AS ENUM ('masuk', 'pulang');

-- CreateEnum
CREATE TYPE "StatusPresensi" AS ENUM ('hadir', 'izin', 'sakit', 'alpa', 'terlambat');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('lunas', 'belum', 'cicil');

-- CreateEnum
CREATE TYPE "StatusPpdb" AS ENUM ('baru', 'diterima', 'ditolak', 'cadangan');

-- CreateEnum
CREATE TYPE "KelompokMapel" AS ENUM ('A', 'B', 'C', 'lintasminat', 'muatanlokal');

-- CreateEnum
CREATE TYPE "PredikatP5" AS ENUM ('MB', 'SB', 'BSH', 'SAB');

-- CreateTable
CREATE TABLE "sekolah" (
    "id" SERIAL NOT NULL,
    "npsn" TEXT,
    "nama" TEXT NOT NULL,
    "jenjang" "Jenjang" NOT NULL,
    "kurikulum_default" "Kurikulum" NOT NULL DEFAULT 'MERDEKA',
    "slug" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "website" TEXT,
    "kepala_sekolah" TEXT,
    "nip_kepala" TEXT,
    "logo" TEXT,
    "visi" TEXT,
    "misi" TEXT,
    "sejarah" TEXT,
    "npsn_dinas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "sekolah_id" INTEGER,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "password_legacy_md5" BOOLEAN NOT NULL DEFAULT false,
    "nama_lengkap" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "no_telp" TEXT,
    "foto" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_login" (
    "id" BIGSERIAL NOT NULL,
    "sekolah_id" INTEGER,
    "user_id" UUID,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "tahun" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periode" (
    "id" SERIAL NOT NULL,
    "tahun_ajaran_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" "JenisPeriode" NOT NULL DEFAULT 'semester',
    "urutan" INTEGER NOT NULL,
    "tanggal_mulai" DATE,
    "tanggal_selesai" DATE,
    "dinilai" BOOLEAN NOT NULL DEFAULT true,
    "aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tingkat" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "fase" "Fase",

    CONSTRAINT "tingkat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rombel" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "tahun_ajaran_id" INTEGER NOT NULL,
    "tingkat_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "kode_kelas" TEXT,
    "wali_guru_id" INTEGER,

    CONSTRAINT "rombel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota_rombel" (
    "id" SERIAL NOT NULL,
    "rombel_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "nomor_absen" INTEGER,

    CONSTRAINT "anggota_rombel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "user_id" UUID,
    "nis" TEXT,
    "nisn" TEXT,
    "nik" TEXT,
    "no_induk" TEXT,
    "no_kk" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "jenis_kelamin" "JenisKelamin",
    "agama" TEXT,
    "hobi" TEXT,
    "cita_cita" TEXT,
    "anak_ke" INTEGER,
    "jumlah_saudara" INTEGER,
    "kewarganegaraan" TEXT,
    "bahasa" TEXT,
    "status_anak_yatim" TEXT,
    "foto" TEXT,
    "status" "StatusSiswa" NOT NULL DEFAULT 'aktif',
    "alamat" TEXT,
    "desa_kel" TEXT,
    "kecamatan" TEXT,
    "kabupaten" TEXT,
    "provinsi" TEXT,
    "kode_pos" TEXT,
    "no_hp" TEXT,
    "tinggal_dengan" TEXT,
    "transportasi" TEXT,
    "tinggi_badan" TEXT,
    "berat_badan" TEXT,
    "golongan_darah" TEXT,
    "riwayat_penyakit" TEXT,
    "kebutuhan_khusus" TEXT,
    "asal_sekolah" TEXT,
    "asal_no_ijazah" TEXT,
    "asal_no_skhu" TEXT,
    "asal_nilai_un" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orang_tua_wali" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "user_id" UUID,
    "tipe" "TipeWali" NOT NULL,
    "nik" TEXT,
    "nama" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "agama" TEXT,
    "pendidikan" TEXT,
    "pekerjaan" TEXT,
    "penghasilan" TEXT,
    "alamat" TEXT,
    "no_hp" TEXT,
    "status_hidup" TEXT,

    CONSTRAINT "orang_tua_wali_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beasiswa_siswa" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "tahun" TEXT,
    "nominal" INTEGER,

    CONSTRAINT "beasiswa_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestasi_siswa" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER,
    "nama_prestasi" TEXT NOT NULL,
    "tingkat" TEXT,
    "tahun" TEXT,
    "keterangan" TEXT,
    "tanggal" DATE,

    CONSTRAINT "prestasi_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "user_id" UUID,
    "nip" TEXT,
    "npk" TEXT,
    "nuptk" TEXT,
    "nik" TEXT,
    "nama_guru" TEXT NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "alamat" TEXT,
    "email" TEXT,
    "no_telp" TEXT,
    "foto" TEXT,
    "pangkat" TEXT,
    "golongan" TEXT,
    "jenis_jabatan" TEXT,
    "status_guru" TEXT,
    "tmt" DATE,

    CONSTRAINT "guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendidikan_guru" (
    "id" SERIAL NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "jenjang" TEXT NOT NULL,
    "nama_sekolah" TEXT,
    "jurusan" TEXT,
    "tahun_lulus" TEXT,

    CONSTRAINT "pendidikan_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekinerja" (
    "id" SERIAL NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "ekinerja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skp" (
    "id" SERIAL NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "uraian" TEXT NOT NULL,
    "target" TEXT,
    "realisasi" TEXT,
    "nilai" TEXT,
    "tahun" TEXT,

    CONSTRAINT "skp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mapel" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "kode_mapel" TEXT NOT NULL,
    "nama_mapel" TEXT NOT NULL,
    "kelompok" "KelompokMapel" NOT NULL,
    "fase" "Fase",
    "kkm" INTEGER NOT NULL DEFAULT 0,
    "no_urut" INTEGER,
    "guru_id" INTEGER,

    CONSTRAINT "mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capaian_pembelajaran" (
    "id" SERIAL NOT NULL,
    "mapel_id" INTEGER NOT NULL,
    "fase" "Fase" NOT NULL,
    "elemen" TEXT,
    "deskripsi" TEXT NOT NULL,

    CONSTRAINT "capaian_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tujuan_pembelajaran" (
    "id" SERIAL NOT NULL,
    "capaian_id" INTEGER NOT NULL,
    "kode" TEXT,
    "deskripsi" TEXT NOT NULL,

    CONSTRAINT "tujuan_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai_rapor" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "mapel_id" INTEGER NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "rombel_id" INTEGER,
    "kurikulum" "Kurikulum" NOT NULL DEFAULT 'MERDEKA',
    "kkm" INTEGER NOT NULL DEFAULT 0,
    "nilai_pengetahuan" INTEGER,
    "nilai_keterampilan" INTEGER,
    "nilai_akhir" INTEGER,
    "deskripsi_capaian" TEXT,

    CONSTRAINT "nilai_rapor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai_rapor_ekstra" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "nama_ekstra" TEXT NOT NULL,
    "nilai" TEXT,
    "deskripsi" TEXT,

    CONSTRAINT "nilai_rapor_ekstra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dimensi_profil" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dimensi_profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elemen_profil" (
    "id" SERIAL NOT NULL,
    "dimensi_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "elemen_profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_elemen_profil" (
    "id" SERIAL NOT NULL,
    "elemen_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "fase" "Fase",

    CONSTRAINT "sub_elemen_profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projek_p5" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "tahun_ajaran_id" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "projek_p5_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projek_p5_target" (
    "id" SERIAL NOT NULL,
    "projek_p5_id" INTEGER NOT NULL,
    "elemen_id" INTEGER NOT NULL,

    CONSTRAINT "projek_p5_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penilaian_p5" (
    "id" SERIAL NOT NULL,
    "projek_p5_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "elemen_id" INTEGER NOT NULL,
    "predikat" "PredikatP5" NOT NULL,
    "catatan" TEXT,

    CONSTRAINT "penilaian_p5_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hari" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_guru" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "hari_id" INTEGER NOT NULL,
    "rombel_id" INTEGER,
    "mapel" TEXT,
    "jam_mulai" TEXT,
    "jam_selesai" TEXT,

    CONSTRAINT "jadwal_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurnal_guru" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "kelas" TEXT,
    "mapel" TEXT,
    "materi" TEXT,
    "deskripsi" TEXT,

    CONSTRAINT "jurnal_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elearning" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "file" TEXT,
    "link" TEXT,
    "kelas" TEXT,
    "mapel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elearning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latihan_soal" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER,
    "judul" TEXT NOT NULL,
    "mapel" TEXT,
    "kelas" TEXT,
    "file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "latihan_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_pembelajaran" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_digital" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "pengarang" TEXT,
    "cover" TEXT,
    "file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buku_digital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_siswa" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "link" TEXT,
    "icon" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kehadiran_siswa" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "periode_id" INTEGER,
    "tanggal" DATE NOT NULL,
    "jam_masuk" TIME,
    "jam_pulang" TIME,
    "jenis" "JenisPresensi" NOT NULL DEFAULT 'masuk',
    "status" "StatusPresensi" NOT NULL DEFAULT 'hadir',
    "keterangan" TEXT,

    CONSTRAINT "kehadiran_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kehadiran_guru" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_masuk" TIME,
    "jam_pulang" TIME,
    "status" "StatusPresensi" NOT NULL DEFAULT 'hadir',
    "keterangan" TEXT,

    CONSTRAINT "kehadiran_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting_kehadiran" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "jam_masuk" TEXT NOT NULL,
    "jam_pulang" TEXT NOT NULL,
    "toleransi" INTEGER NOT NULL DEFAULT 0,
    "keterangan" TEXT,

    CONSTRAINT "setting_kehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_kasus" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "poin" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kategori_kasus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kasus_siswa" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "kategori_id" INTEGER,
    "nama_kasus" TEXT NOT NULL,
    "poin" INTEGER NOT NULL DEFAULT 0,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "kasus_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_siswa" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER,
    "jenis" TEXT NOT NULL,
    "asal_tujuan" TEXT,
    "alasan" TEXT,
    "tanggal" DATE NOT NULL,

    CONSTRAINT "mutasi_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "undangan_ortu" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER,
    "perihal" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "undangan_ortu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_pembayaran" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL DEFAULT 0,
    "keterangan" TEXT,

    CONSTRAINT "jenis_pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kode_rekening" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "kode_rekening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagihan_spp" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "jenis_id" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'belum',

    CONSTRAINT "tagihan_spp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran_spp" (
    "id" SERIAL NOT NULL,
    "tagihan_id" INTEGER NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlah" INTEGER NOT NULL,
    "kode_rekening" TEXT,
    "petugas" TEXT,

    CONSTRAINT "pembayaran_spp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kwitansi" (
    "id" SERIAL NOT NULL,
    "pembayaran_id" INTEGER NOT NULL,
    "nomor" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kwitansi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_perpustakaan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "pengarang" TEXT,
    "penerbit" TEXT,
    "tahun_terbit" TEXT,
    "isbn" TEXT,
    "jumlah_buku" INTEGER NOT NULL DEFAULT 0,
    "jumlah_eksemplar" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "buku_perpustakaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinjaman_buku" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "buku_id" INTEGER NOT NULL,
    "siswa_id" INTEGER,
    "durasi_hari" INTEGER,
    "tanggal_pinjam" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_kembali" TIMESTAMP(3),

    CONSTRAINT "pinjaman_buku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengunjung_perpustakaan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "identitas" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengunjung_perpustakaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_sarpras" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "kategori_sarpras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sarpras" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "kategori_id" INTEGER,
    "nama" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 0,
    "kondisi" TEXT,
    "keterangan" TEXT,

    CONSTRAINT "sarpras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jalur_ppdb" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "kuota" INTEGER,
    "keterangan" TEXT,

    CONSTRAINT "jalur_ppdb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran_ppdb" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "jalur_id" INTEGER,
    "nisn" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "asal_sekolah" TEXT,
    "no_hp" TEXT,
    "status" "StatusPpdb" NOT NULL DEFAULT 'baru',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendaftaran_ppdb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ketentuan_ppdb" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,

    CONSTRAINT "ketentuan_ppdb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelulusan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "kelulusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting_kelulusan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "tanggal_rilis" TIMESTAMP(3),
    "pengumuman" TEXT,

    CONSTRAINT "setting_kelulusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calon_osis" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "no_urut" INTEGER NOT NULL,
    "nama_ketua" TEXT NOT NULL,
    "nama_wakil" TEXT,
    "foto_ketua" TEXT,
    "foto_wakil" TEXT,
    "visi" TEXT,
    "misi" TEXT,

    CONSTRAINT "calon_osis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_pemilihan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "calon_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_pemilihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nomor" TEXT,
    "perihal" TEXT NOT NULL,
    "jenis" TEXT,
    "isi" TEXT,
    "tanggal" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat_keterangan_aktif" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER,
    "nomor" TEXT,
    "keperluan" TEXT,
    "tanggal" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surat_keterangan_aktif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamu" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "instansi" TEXT,
    "keperluan" TEXT,
    "no_hp" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tamu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_tamu" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT,
    "pesan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buku_tamu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "tahun_lulus" TEXT,
    "pekerjaan" TEXT,
    "lanjut_ke" TEXT,
    "no_hp" TEXT,
    "foto" TEXT,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting_banner" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT,
    "gambar" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "setting_banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tema" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "style" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counter" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,

    CONSTRAINT "counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sekolah_npsn_key" ON "sekolah"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "sekolah_slug_key" ON "sekolah"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_sekolah_id_role_idx" ON "users"("sekolah_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_sekolah_id_username_key" ON "users"("sekolah_id", "username");

-- CreateIndex
CREATE INDEX "log_login_sekolah_id_idx" ON "log_login"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_sekolah_id_tahun_key" ON "tahun_ajaran"("sekolah_id", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "periode_tahun_ajaran_id_urutan_key" ON "periode"("tahun_ajaran_id", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "tingkat_sekolah_id_urutan_key" ON "tingkat"("sekolah_id", "urutan");

-- CreateIndex
CREATE INDEX "rombel_sekolah_id_idx" ON "rombel"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "rombel_tahun_ajaran_id_nama_key" ON "rombel"("tahun_ajaran_id", "nama");

-- CreateIndex
CREATE INDEX "anggota_rombel_siswa_id_idx" ON "anggota_rombel"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_rombel_rombel_id_siswa_id_key" ON "anggota_rombel"("rombel_id", "siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_user_id_key" ON "siswa"("user_id");

-- CreateIndex
CREATE INDEX "siswa_sekolah_id_status_idx" ON "siswa"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_sekolah_id_nisn_key" ON "siswa"("sekolah_id", "nisn");

-- CreateIndex
CREATE INDEX "orang_tua_wali_user_id_idx" ON "orang_tua_wali"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orang_tua_wali_siswa_id_tipe_key" ON "orang_tua_wali"("siswa_id", "tipe");

-- CreateIndex
CREATE UNIQUE INDEX "guru_user_id_key" ON "guru"("user_id");

-- CreateIndex
CREATE INDEX "guru_sekolah_id_idx" ON "guru"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "guru_sekolah_id_nip_key" ON "guru"("sekolah_id", "nip");

-- CreateIndex
CREATE UNIQUE INDEX "mapel_sekolah_id_kode_mapel_key" ON "mapel"("sekolah_id", "kode_mapel");

-- CreateIndex
CREATE INDEX "nilai_rapor_sekolah_id_periode_id_idx" ON "nilai_rapor"("sekolah_id", "periode_id");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_rapor_siswa_id_mapel_id_periode_id_key" ON "nilai_rapor"("siswa_id", "mapel_id", "periode_id");

-- CreateIndex
CREATE UNIQUE INDEX "dimensi_profil_nama_key" ON "dimensi_profil"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "elemen_profil_dimensi_id_nama_key" ON "elemen_profil"("dimensi_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "sub_elemen_profil_elemen_id_nama_key" ON "sub_elemen_profil"("elemen_id", "nama");

-- CreateIndex
CREATE INDEX "projek_p5_sekolah_id_idx" ON "projek_p5"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "projek_p5_target_projek_p5_id_elemen_id_key" ON "projek_p5_target"("projek_p5_id", "elemen_id");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_p5_projek_p5_id_siswa_id_elemen_id_key" ON "penilaian_p5"("projek_p5_id", "siswa_id", "elemen_id");

-- CreateIndex
CREATE INDEX "kehadiran_siswa_sekolah_id_tanggal_idx" ON "kehadiran_siswa"("sekolah_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "kehadiran_siswa_siswa_id_tanggal_key" ON "kehadiran_siswa"("siswa_id", "tanggal");

-- CreateIndex
CREATE INDEX "kehadiran_guru_sekolah_id_tanggal_idx" ON "kehadiran_guru"("sekolah_id", "tanggal");

-- CreateIndex
CREATE INDEX "kasus_siswa_sekolah_id_idx" ON "kasus_siswa"("sekolah_id");

-- CreateIndex
CREATE INDEX "kasus_siswa_siswa_id_idx" ON "kasus_siswa"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "kode_rekening_sekolah_id_kode_key" ON "kode_rekening"("sekolah_id", "kode");

-- CreateIndex
CREATE INDEX "tagihan_spp_sekolah_id_idx" ON "tagihan_spp"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "tagihan_spp_siswa_id_jenis_id_bulan_tahun_key" ON "tagihan_spp"("siswa_id", "jenis_id", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "kwitansi_pembayaran_id_key" ON "kwitansi"("pembayaran_id");

-- CreateIndex
CREATE INDEX "pendaftaran_ppdb_sekolah_id_idx" ON "pendaftaran_ppdb"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "kelulusan_siswa_id_key" ON "kelulusan"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "vote_pemilihan_sekolah_id_siswa_id_key" ON "vote_pemilihan"("sekolah_id", "siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "setting_sekolah_id_key_key" ON "setting"("sekolah_id", "key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_login" ADD CONSTRAINT "log_login_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_login" ADD CONSTRAINT "log_login_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahun_ajaran" ADD CONSTRAINT "tahun_ajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periode" ADD CONSTRAINT "periode_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tingkat" ADD CONSTRAINT "tingkat_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_tingkat_id_fkey" FOREIGN KEY ("tingkat_id") REFERENCES "tingkat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_wali_guru_id_fkey" FOREIGN KEY ("wali_guru_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_rombel" ADD CONSTRAINT "anggota_rombel_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_rombel" ADD CONSTRAINT "anggota_rombel_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orang_tua_wali" ADD CONSTRAINT "orang_tua_wali_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orang_tua_wali" ADD CONSTRAINT "orang_tua_wali_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beasiswa_siswa" ADD CONSTRAINT "beasiswa_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestasi_siswa" ADD CONSTRAINT "prestasi_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendidikan_guru" ADD CONSTRAINT "pendidikan_guru_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekinerja" ADD CONSTRAINT "ekinerja_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skp" ADD CONSTRAINT "skp_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapel" ADD CONSTRAINT "mapel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapel" ADD CONSTRAINT "mapel_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capaian_pembelajaran" ADD CONSTRAINT "capaian_pembelajaran_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_capaian_id_fkey" FOREIGN KEY ("capaian_id") REFERENCES "capaian_pembelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor" ADD CONSTRAINT "nilai_rapor_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor" ADD CONSTRAINT "nilai_rapor_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor" ADD CONSTRAINT "nilai_rapor_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor" ADD CONSTRAINT "nilai_rapor_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor" ADD CONSTRAINT "nilai_rapor_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor_ekstra" ADD CONSTRAINT "nilai_rapor_ekstra_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_rapor_ekstra" ADD CONSTRAINT "nilai_rapor_ekstra_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elemen_profil" ADD CONSTRAINT "elemen_profil_dimensi_id_fkey" FOREIGN KEY ("dimensi_id") REFERENCES "dimensi_profil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_elemen_profil" ADD CONSTRAINT "sub_elemen_profil_elemen_id_fkey" FOREIGN KEY ("elemen_id") REFERENCES "elemen_profil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projek_p5" ADD CONSTRAINT "projek_p5_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projek_p5" ADD CONSTRAINT "projek_p5_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projek_p5_target" ADD CONSTRAINT "projek_p5_target_projek_p5_id_fkey" FOREIGN KEY ("projek_p5_id") REFERENCES "projek_p5"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projek_p5_target" ADD CONSTRAINT "projek_p5_target_elemen_id_fkey" FOREIGN KEY ("elemen_id") REFERENCES "elemen_profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian_p5" ADD CONSTRAINT "penilaian_p5_projek_p5_id_fkey" FOREIGN KEY ("projek_p5_id") REFERENCES "projek_p5"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian_p5" ADD CONSTRAINT "penilaian_p5_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian_p5" ADD CONSTRAINT "penilaian_p5_elemen_id_fkey" FOREIGN KEY ("elemen_id") REFERENCES "elemen_profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hari" ADD CONSTRAINT "hari_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_guru" ADD CONSTRAINT "jadwal_guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_guru" ADD CONSTRAINT "jadwal_guru_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_guru" ADD CONSTRAINT "jadwal_guru_hari_id_fkey" FOREIGN KEY ("hari_id") REFERENCES "hari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_guru" ADD CONSTRAINT "jurnal_guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_guru" ADD CONSTRAINT "jurnal_guru_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elearning" ADD CONSTRAINT "elearning_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "latihan_soal" ADD CONSTRAINT "latihan_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_pembelajaran" ADD CONSTRAINT "video_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_digital" ADD CONSTRAINT "buku_digital_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_siswa" ADD CONSTRAINT "menu_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_siswa" ADD CONSTRAINT "kehadiran_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_siswa" ADD CONSTRAINT "kehadiran_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_siswa" ADD CONSTRAINT "kehadiran_siswa_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_guru" ADD CONSTRAINT "kehadiran_guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_guru" ADD CONSTRAINT "kehadiran_guru_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting_kehadiran" ADD CONSTRAINT "setting_kehadiran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori_kasus" ADD CONSTRAINT "kategori_kasus_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kasus_siswa" ADD CONSTRAINT "kasus_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kasus_siswa" ADD CONSTRAINT "kasus_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kasus_siswa" ADD CONSTRAINT "kasus_siswa_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori_kasus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_siswa" ADD CONSTRAINT "mutasi_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_siswa" ADD CONSTRAINT "mutasi_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan_ortu" ADD CONSTRAINT "undangan_ortu_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenis_pembayaran" ADD CONSTRAINT "jenis_pembayaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kode_rekening" ADD CONSTRAINT "kode_rekening_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan_spp" ADD CONSTRAINT "tagihan_spp_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan_spp" ADD CONSTRAINT "tagihan_spp_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan_spp" ADD CONSTRAINT "tagihan_spp_jenis_id_fkey" FOREIGN KEY ("jenis_id") REFERENCES "jenis_pembayaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_spp" ADD CONSTRAINT "pembayaran_spp_tagihan_id_fkey" FOREIGN KEY ("tagihan_id") REFERENCES "tagihan_spp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kwitansi" ADD CONSTRAINT "kwitansi_pembayaran_id_fkey" FOREIGN KEY ("pembayaran_id") REFERENCES "pembayaran_spp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_perpustakaan" ADD CONSTRAINT "buku_perpustakaan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinjaman_buku" ADD CONSTRAINT "pinjaman_buku_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinjaman_buku" ADD CONSTRAINT "pinjaman_buku_buku_id_fkey" FOREIGN KEY ("buku_id") REFERENCES "buku_perpustakaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinjaman_buku" ADD CONSTRAINT "pinjaman_buku_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengunjung_perpustakaan" ADD CONSTRAINT "pengunjung_perpustakaan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori_sarpras" ADD CONSTRAINT "kategori_sarpras_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sarpras" ADD CONSTRAINT "sarpras_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sarpras" ADD CONSTRAINT "sarpras_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori_sarpras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jalur_ppdb" ADD CONSTRAINT "jalur_ppdb_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran_ppdb" ADD CONSTRAINT "pendaftaran_ppdb_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran_ppdb" ADD CONSTRAINT "pendaftaran_ppdb_jalur_id_fkey" FOREIGN KEY ("jalur_id") REFERENCES "jalur_ppdb"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ketentuan_ppdb" ADD CONSTRAINT "ketentuan_ppdb_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelulusan" ADD CONSTRAINT "kelulusan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelulusan" ADD CONSTRAINT "kelulusan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting_kelulusan" ADD CONSTRAINT "setting_kelulusan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calon_osis" ADD CONSTRAINT "calon_osis_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_pemilihan" ADD CONSTRAINT "vote_pemilihan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_pemilihan" ADD CONSTRAINT "vote_pemilihan_calon_id_fkey" FOREIGN KEY ("calon_id") REFERENCES "calon_osis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_pemilihan" ADD CONSTRAINT "vote_pemilihan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat_keterangan_aktif" ADD CONSTRAINT "surat_keterangan_aktif_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tamu" ADD CONSTRAINT "tamu_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_tamu" ADD CONSTRAINT "buku_tamu_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting_banner" ADD CONSTRAINT "setting_banner_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tema" ADD CONSTRAINT "tema_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter" ADD CONSTRAINT "counter_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

