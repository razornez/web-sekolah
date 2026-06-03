-- CreateEnum
CREATE TYPE "TipeSoal" AS ENUM ('pilihan_ganda', 'esai');

-- CreateEnum
CREATE TYPE "StatusHasil" AS ENUM ('berlangsung', 'selesai');

-- CreateTable
CREATE TABLE "ujian" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER,
    "rombel_id" INTEGER,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "mapel" TEXT,
    "durasi_menit" INTEGER,
    "acak_soal" BOOLEAN NOT NULL DEFAULT false,
    "mulai" TIMESTAMP(3),
    "selesai" TIMESTAMP(3),
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal" (
    "id" SERIAL NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "nomor" INTEGER NOT NULL DEFAULT 1,
    "pertanyaan" TEXT NOT NULL,
    "tipe" "TipeSoal" NOT NULL DEFAULT 'pilihan_ganda',
    "opsi" JSONB,
    "kunci" TEXT,
    "bobot" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hasil_ujian" (
    "id" SERIAL NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "status" "StatusHasil" NOT NULL DEFAULT 'berlangsung',
    "skor" INTEGER,
    "mulai_at" TIMESTAMP(3),
    "selesai_at" TIMESTAMP(3),

    CONSTRAINT "hasil_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_ujian" (
    "id" SERIAL NOT NULL,
    "hasil_id" INTEGER NOT NULL,
    "soal_id" INTEGER NOT NULL,
    "jawaban" TEXT,
    "nilai" INTEGER,

    CONSTRAINT "jawaban_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ujian_sekolah_id_idx" ON "ujian"("sekolah_id");

-- CreateIndex
CREATE INDEX "soal_ujian_id_idx" ON "soal"("ujian_id");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_ujian_ujian_id_siswa_id_key" ON "hasil_ujian"("ujian_id", "siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_ujian_hasil_id_soal_id_key" ON "jawaban_ujian"("hasil_id", "soal_id");

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal" ADD CONSTRAINT "soal_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian" ADD CONSTRAINT "hasil_ujian_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian" ADD CONSTRAINT "hasil_ujian_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_ujian" ADD CONSTRAINT "jawaban_ujian_hasil_id_fkey" FOREIGN KEY ("hasil_id") REFERENCES "hasil_ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_ujian" ADD CONSTRAINT "jawaban_ujian_soal_id_fkey" FOREIGN KEY ("soal_id") REFERENCES "soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
