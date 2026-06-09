-- CreateEnum
CREATE TYPE "PenerimaTipe" AS ENUM ('siswa', 'ortu', 'guru');

-- CreateEnum
CREATE TYPE "KirimChannel" AS ENUM ('wa', 'email', 'sms', 'app');

-- CreateEnum
CREATE TYPE "KirimStatus" AS ENUM ('antri', 'terkirim', 'gagal');

-- DropForeignKey
ALTER TABLE "email_log" DROP CONSTRAINT "email_log_template_key_fkey";

-- DropIndex
DROP INDEX "email_template_key_key";

-- AlterTable
ALTER TABLE "email_config" ADD COLUMN     "sekolah_id" INTEGER;

-- AlterTable
ALTER TABLE "email_template" ADD COLUMN     "sekolah_id" INTEGER;

-- AlterTable
ALTER TABLE "pengumuman" ADD COLUMN     "arsip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "butuh_balasan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lampiran" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prioritas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "reminder_hours" INTEGER,
ADD COLUMN     "reminder_sent_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sekolah" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "siswa" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'credentials',
ADD COLUMN     "provider_account_id" TEXT,
ADD COLUMN     "session_version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "pengumuman_baca" (
    "id" SERIAL NOT NULL,
    "pengumuman_id" INTEGER NOT NULL,
    "user_id" UUID,
    "tipe" "PenerimaTipe" NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengumuman_baca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumuman_kirim" (
    "id" SERIAL NOT NULL,
    "pengumuman_id" INTEGER NOT NULL,
    "channel" "KirimChannel" NOT NULL,
    "status" "KirimStatus" NOT NULL DEFAULT 'antri',
    "tujuan" INTEGER NOT NULL DEFAULT 0,
    "terkirim" INTEGER NOT NULL DEFAULT 0,
    "gagal" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengumuman_kirim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_module_permissions" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_export" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "role_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pengumuman_baca_pengumuman_id_idx" ON "pengumuman_baca"("pengumuman_id");

-- CreateIndex
CREATE UNIQUE INDEX "pengumuman_baca_pengumuman_id_user_id_key" ON "pengumuman_baca"("pengumuman_id", "user_id");

-- CreateIndex
CREATE INDEX "pengumuman_kirim_pengumuman_id_idx" ON "pengumuman_kirim"("pengumuman_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "role_module_permissions_sekolah_id_role_idx" ON "role_module_permissions"("sekolah_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "role_module_permissions_sekolah_id_role_module_key_key" ON "role_module_permissions"("sekolah_id", "role", "module_key");

-- CreateIndex
CREATE UNIQUE INDEX "email_config_sekolah_id_key" ON "email_config"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_key_sekolah_id_key" ON "email_template"("key", "sekolah_id");

-- CreateIndex
CREATE INDEX "pengumuman_sekolah_id_scheduled_at_idx" ON "pengumuman"("sekolah_id", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_account_id_key" ON "users"("provider_account_id");

-- AddForeignKey
ALTER TABLE "pengumuman_baca" ADD CONSTRAINT "pengumuman_baca_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumuman_kirim" ADD CONSTRAINT "pengumuman_kirim_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_config" ADD CONSTRAINT "email_config_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

