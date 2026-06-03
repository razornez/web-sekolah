/*
  Warnings:

  - Added the required column `updated_at` to the `pengumuman` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pengumuman" ADD COLUMN     "kategori" TEXT NOT NULL DEFAULT 'umum',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
