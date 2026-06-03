-- CreateEnum
CREATE TYPE "PengumumanTarget" AS ENUM ('semua', 'staf', 'siswa', 'ortu');

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "target" "PengumumanTarget" NOT NULL DEFAULT 'semua',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pengumuman_sekolah_id_created_at_idx" ON "pengumuman"("sekolah_id", "created_at");

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
