-- CreateTable
CREATE TABLE "rapor_catatan" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "catatan" TEXT,
    "sikap" TEXT,

    CONSTRAINT "rapor_catatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rapor_catatan_siswa_id_periode_id_key" ON "rapor_catatan"("siswa_id", "periode_id");

-- AddForeignKey
ALTER TABLE "rapor_catatan" ADD CONSTRAINT "rapor_catatan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_catatan" ADD CONSTRAINT "rapor_catatan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_catatan" ADD CONSTRAINT "rapor_catatan_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
