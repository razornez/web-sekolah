-- CreateEnum
CREATE TYPE "JenisDokumenPpdb" AS ENUM ('ijazah', 'rapor', 'prestasi', 'kwitansi', 'ktp_ortu', 'kartu_keluarga', 'foto', 'surat_keterangan', 'lainnya');

-- CreateEnum
CREATE TYPE "TipeNilai" AS ENUM ('harian', 'tugas', 'ulangan', 'uts', 'uas', 'sumatif_harian', 'sumatif_akhir', 'formatif', 'praktik');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusPpdb" ADD VALUE 'verifikasi';
ALTER TYPE "StatusPpdb" ADD VALUE 'tes';
ALTER TYPE "StatusPpdb" ADD VALUE 'wawancara';

-- AlterTable
ALTER TABLE "ekstrakurikuler" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deskripsi" TEXT;

-- AlterTable
ALTER TABLE "guru" ADD COLUMN     "alasan_hapus" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "mapel" ADD COLUMN     "aktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "mutasi_siswa" DROP COLUMN "asal_tujuan",
ADD COLUMN     "asal_sekolah" TEXT,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "tujuan_sekolah" TEXT;

-- AlterTable
ALTER TABLE "pendaftaran_ppdb" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "catatan" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "tahun_ajaran" TEXT;

-- AlterTable
ALTER TABLE "pengumuman" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sarpras" ADD COLUMN     "tahun_pengadaan" INTEGER,
ADD COLUMN     "tindak_lanjut" TEXT;

-- AlterTable
ALTER TABLE "siswa" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "tahun_masuk" INTEGER;

-- CreateTable
CREATE TABLE "mapel_guru" (
    "id" SERIAL NOT NULL,
    "mapel_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "tahun_ajaran" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mapel_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_status_ppdb" (
    "id" SERIAL NOT NULL,
    "pendaftaran_id" INTEGER NOT NULL,
    "status" "StatusPpdb" NOT NULL,
    "catatan" TEXT,
    "oleh" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "riwayat_status_ppdb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_ppdb" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "pendaftaran_id" INTEGER NOT NULL,
    "jenis" "JenisDokumenPpdb" NOT NULL DEFAULT 'lainnya',
    "nama" TEXT NOT NULL,
    "url" TEXT,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_ppdb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_provinsi" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "ref_provinsi_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "ref_kabupaten" (
    "kode" TEXT NOT NULL,
    "provinsi_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ref_kabupaten_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "ref_kecamatan" (
    "kode" TEXT NOT NULL,
    "kabupaten_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ref_kecamatan_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "ref_kelurahan" (
    "kode" TEXT NOT NULL,
    "kecamatan_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode_pos" TEXT,

    CONSTRAINT "ref_kelurahan_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "prestasi_master" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL DEFAULT 'Sekolah',
    "kategori" TEXT NOT NULL DEFAULT 'Akademik',
    "penyelenggara" TEXT,
    "tahun" TEXT,
    "keterangan" TEXT,

    CONSTRAINT "prestasi_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penerima_prestasi" (
    "id" SERIAL NOT NULL,
    "prestasi_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "tahun" TEXT,
    "keterangan" TEXT,

    CONSTRAINT "penerima_prestasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beasiswa_master" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "penyelenggara" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'Pemerintah',
    "nominal" INTEGER,
    "keterangan" TEXT,

    CONSTRAINT "beasiswa_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penerima_beasiswa" (
    "id" SERIAL NOT NULL,
    "beasiswa_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "tahun" TEXT,
    "nominal" INTEGER,

    CONSTRAINT "penerima_beasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "komponen_nilai" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "mapel_id" INTEGER,
    "periode_id" INTEGER,
    "kurikulum" "Kurikulum" NOT NULL DEFAULT 'MERDEKA',
    "tipe" "TipeNilai" NOT NULL,
    "bobot" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "komponen_nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entri_nilai" (
    "id" BIGSERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "mapel_id" INTEGER NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "rombel_id" INTEGER,
    "guru_id" INTEGER,
    "tipe" "TipeNilai" NOT NULL,
    "nilai" DECIMAL(5,2) NOT NULL,
    "keterangan" TEXT,
    "tanggal" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entri_nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templat_rapor" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "versi" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "konfigurasi" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templat_rapor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mapel_guru_mapel_id_guru_id_tahun_ajaran_key" ON "mapel_guru"("mapel_id", "guru_id", "tahun_ajaran");

-- CreateIndex
CREATE INDEX "riwayat_status_ppdb_pendaftaran_id_idx" ON "riwayat_status_ppdb"("pendaftaran_id");

-- CreateIndex
CREATE INDEX "dokumen_ppdb_pendaftaran_id_idx" ON "dokumen_ppdb"("pendaftaran_id");

-- CreateIndex
CREATE INDEX "ref_kabupaten_provinsi_id_idx" ON "ref_kabupaten"("provinsi_id");

-- CreateIndex
CREATE INDEX "ref_kecamatan_kabupaten_id_idx" ON "ref_kecamatan"("kabupaten_id");

-- CreateIndex
CREATE INDEX "ref_kelurahan_kecamatan_id_idx" ON "ref_kelurahan"("kecamatan_id");

-- CreateIndex
CREATE INDEX "prestasi_master_sekolah_id_idx" ON "prestasi_master"("sekolah_id");

-- CreateIndex
CREATE INDEX "penerima_prestasi_siswa_id_idx" ON "penerima_prestasi"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "penerima_prestasi_prestasi_id_siswa_id_key" ON "penerima_prestasi"("prestasi_id", "siswa_id");

-- CreateIndex
CREATE INDEX "beasiswa_master_sekolah_id_idx" ON "beasiswa_master"("sekolah_id");

-- CreateIndex
CREATE INDEX "penerima_beasiswa_siswa_id_idx" ON "penerima_beasiswa"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "penerima_beasiswa_beasiswa_id_siswa_id_key" ON "penerima_beasiswa"("beasiswa_id", "siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "komponen_nilai_sekolah_id_mapel_id_periode_id_tipe_key" ON "komponen_nilai"("sekolah_id", "mapel_id", "periode_id", "tipe");

-- CreateIndex
CREATE INDEX "entri_nilai_sekolah_id_periode_id_idx" ON "entri_nilai"("sekolah_id", "periode_id");

-- CreateIndex
CREATE INDEX "entri_nilai_siswa_id_mapel_id_periode_id_idx" ON "entri_nilai"("siswa_id", "mapel_id", "periode_id");

-- CreateIndex
CREATE INDEX "mapel_sekolah_id_kelompok_idx" ON "mapel"("sekolah_id", "kelompok");

-- CreateIndex
CREATE INDEX "mutasi_siswa_sekolah_id_idx" ON "mutasi_siswa"("sekolah_id");

-- AddForeignKey
ALTER TABLE "mapel_guru" ADD CONSTRAINT "mapel_guru_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapel_guru" ADD CONSTRAINT "mapel_guru_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_guru" ADD CONSTRAINT "jadwal_guru_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_siswa" ADD CONSTRAINT "mutasi_siswa_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_status_ppdb" ADD CONSTRAINT "riwayat_status_ppdb_pendaftaran_id_fkey" FOREIGN KEY ("pendaftaran_id") REFERENCES "pendaftaran_ppdb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_ppdb" ADD CONSTRAINT "dokumen_ppdb_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_ppdb" ADD CONSTRAINT "dokumen_ppdb_pendaftaran_id_fkey" FOREIGN KEY ("pendaftaran_id") REFERENCES "pendaftaran_ppdb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_kabupaten" ADD CONSTRAINT "ref_kabupaten_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "ref_provinsi"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_kecamatan" ADD CONSTRAINT "ref_kecamatan_kabupaten_id_fkey" FOREIGN KEY ("kabupaten_id") REFERENCES "ref_kabupaten"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_kelurahan" ADD CONSTRAINT "ref_kelurahan_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "ref_kecamatan"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestasi_master" ADD CONSTRAINT "prestasi_master_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penerima_prestasi" ADD CONSTRAINT "penerima_prestasi_prestasi_id_fkey" FOREIGN KEY ("prestasi_id") REFERENCES "prestasi_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penerima_prestasi" ADD CONSTRAINT "penerima_prestasi_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beasiswa_master" ADD CONSTRAINT "beasiswa_master_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penerima_beasiswa" ADD CONSTRAINT "penerima_beasiswa_beasiswa_id_fkey" FOREIGN KEY ("beasiswa_id") REFERENCES "beasiswa_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penerima_beasiswa" ADD CONSTRAINT "penerima_beasiswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "komponen_nilai" ADD CONSTRAINT "komponen_nilai_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "komponen_nilai" ADD CONSTRAINT "komponen_nilai_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "komponen_nilai" ADD CONSTRAINT "komponen_nilai_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entri_nilai" ADD CONSTRAINT "entri_nilai_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entri_nilai" ADD CONSTRAINT "entri_nilai_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entri_nilai" ADD CONSTRAINT "entri_nilai_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entri_nilai" ADD CONSTRAINT "entri_nilai_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entri_nilai" ADD CONSTRAINT "entri_nilai_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templat_rapor" ADD CONSTRAINT "templat_rapor_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
