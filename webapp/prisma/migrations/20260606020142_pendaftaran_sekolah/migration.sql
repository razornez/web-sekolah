-- CreateTable
CREATE TABLE "pendaftaran_sekolah" (
    "id" SERIAL NOT NULL,
    "nama_sekolah" TEXT NOT NULL,
    "jenjang" TEXT,
    "jumlah_siswa" TEXT,
    "nama_pic" TEXT NOT NULL,
    "jabatan" TEXT,
    "email" TEXT,
    "telepon" TEXT,
    "kota" TEXT,
    "paket" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'baru',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendaftaran_sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pendaftaran_sekolah_status_idx" ON "pendaftaran_sekolah"("status");
