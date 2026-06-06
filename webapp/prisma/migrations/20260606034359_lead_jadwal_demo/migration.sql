-- AlterTable
ALTER TABLE "pendaftaran_sekolah" ADD COLUMN     "jadwal_at" TIMESTAMP(3),
ADD COLUMN     "tipe" TEXT NOT NULL DEFAULT 'registrasi';
