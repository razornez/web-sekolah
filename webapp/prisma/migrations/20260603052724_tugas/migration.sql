-- CreateTable
CREATE TABLE "tugas" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "guru_id" INTEGER,
    "rombel_id" INTEGER,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "mapel" TEXT,
    "deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumpulan_tugas" (
    "id" SERIAL NOT NULL,
    "tugas_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "teks" TEXT,
    "link" TEXT,
    "nilai" INTEGER,
    "tanggal_kumpul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengumpulan_tugas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tugas_sekolah_id_idx" ON "tugas"("sekolah_id");

-- CreateIndex
CREATE INDEX "pengumpulan_tugas_siswa_id_idx" ON "pengumpulan_tugas"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pengumpulan_tugas_tugas_id_siswa_id_key" ON "pengumpulan_tugas"("tugas_id", "siswa_id");

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_tugas_id_fkey" FOREIGN KEY ("tugas_id") REFERENCES "tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
