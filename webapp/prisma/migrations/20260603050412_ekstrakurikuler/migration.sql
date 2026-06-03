-- CreateTable
CREATE TABLE "ekstrakurikuler" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "pembina_guru_id" INTEGER,

    CONSTRAINT "ekstrakurikuler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota_ekstra" (
    "id" SERIAL NOT NULL,
    "ekstra_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,

    CONSTRAINT "anggota_ekstra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anggota_ekstra_siswa_id_idx" ON "anggota_ekstra"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_ekstra_ekstra_id_siswa_id_key" ON "anggota_ekstra"("ekstra_id", "siswa_id");

-- AddForeignKey
ALTER TABLE "ekstrakurikuler" ADD CONSTRAINT "ekstrakurikuler_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstrakurikuler" ADD CONSTRAINT "ekstrakurikuler_pembina_guru_id_fkey" FOREIGN KEY ("pembina_guru_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_ekstra" ADD CONSTRAINT "anggota_ekstra_ekstra_id_fkey" FOREIGN KEY ("ekstra_id") REFERENCES "ekstrakurikuler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_ekstra" ADD CONSTRAINT "anggota_ekstra_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
