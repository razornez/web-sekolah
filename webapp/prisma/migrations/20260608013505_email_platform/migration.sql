-- CreateTable
CREATE TABLE "email_config" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_secure" BOOLEAN NOT NULL DEFAULT true,
    "smtp_user" TEXT,
    "smtp_pass_enc" TEXT,
    "resend_key_enc" TEXT,
    "from_email" TEXT NOT NULL DEFAULT '',
    "from_name" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_tested_at" TIMESTAMP(3),
    "last_test_ok" BOOLEAN,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "variables" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" SERIAL NOT NULL,
    "template_key" TEXT,
    "sekolah_id" INTEGER,
    "to_email" TEXT NOT NULL,
    "to_name" TEXT,
    "subject" TEXT NOT NULL,
    "body_html" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_msg" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_template_key_key" ON "email_template"("key");

-- CreateIndex
CREATE INDEX "email_log_status_idx" ON "email_log"("status");

-- CreateIndex
CREATE INDEX "email_log_sekolah_id_idx" ON "email_log"("sekolah_id");

-- CreateIndex
CREATE INDEX "email_log_created_at_idx" ON "email_log"("created_at");

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_template_key_fkey" FOREIGN KEY ("template_key") REFERENCES "email_template"("key") ON DELETE SET NULL ON UPDATE CASCADE;
