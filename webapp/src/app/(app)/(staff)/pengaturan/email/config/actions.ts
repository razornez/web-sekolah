"use server";

import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff, getCurrentUser } from "@/lib/session";
import { encryptSecret, decryptSecret } from "@/lib/email-crypto";
import { sendEmail } from "@/lib/mailer";

export async function saveEmailConfig(_prev: unknown, fd: FormData) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();

  const provider = fd.get("provider") as string;
  const fromEmail = (fd.get("fromEmail") as string).trim();
  const fromName = (fd.get("fromName") as string).trim();
  const isActive = fd.get("isActive") === "1";

  const existing = await prisma.emailConfig.findUnique({ where: { sekolahId } });

  const rawSmtpPass = fd.get("smtpPass") as string;
  const rawResendKey = fd.get("resendKey") as string;

  let smtpPassEnc: string | null = existing?.smtpPassEnc ?? null;
  let resendKeyEnc: string | null = existing?.resendKeyEnc ?? null;

  if (rawSmtpPass) smtpPassEnc = encryptSecret(rawSmtpPass);
  if (rawResendKey) resendKeyEnc = encryptSecret(rawResendKey);

  const data = {
    provider,
    fromEmail,
    fromName,
    isActive,
    smtpHost: (fd.get("smtpHost") as string).trim() || null,
    smtpPort: fd.get("smtpPort") ? Number(fd.get("smtpPort")) : null,
    smtpSecure: fd.get("smtpSecure") === "1",
    smtpUser: (fd.get("smtpUser") as string).trim() || null,
    smtpPassEnc,
    resendKeyEnc,
  };

  if (existing) {
    await prisma.emailConfig.update({ where: { id: existing.id }, data });
  } else {
    await prisma.emailConfig.create({ data: { ...data, sekolahId } });
  }

  return { ok: true, message: "Konfigurasi berhasil disimpan." };
}

export async function testEmailConfig(_prev: unknown, _fd: FormData) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const user = await getCurrentUser();

  if (!user.email) return { ok: false, message: "Akun Anda tidak memiliki email terdaftar." };

  const result = await sendEmail({
    templateKey: "reset_password",
    to: { email: user.email as string, name: user.name ?? undefined },
    variables: {
      namaUser: user.name ?? "",
      link: "https://contoh.com/reset?token=test",
      expiredAt: "dalam 1 jam",
      namaAplikasi: "Smart School",
    },
    sekolahId,
  });

  if (!result.ok) return { ok: false, message: `Gagal: ${result.error}` };

  await prisma.emailConfig.updateMany({ where: { sekolahId }, data: { lastTestedAt: new Date(), lastTestOk: true } });
  return { ok: true, message: "Email test berhasil dikirim ke " + user.email };
}

export async function getEmailConfigDecrypted(sekolahId: number) {
  const cfg = await prisma.emailConfig.findUnique({ where: { sekolahId } });
  if (!cfg) return null;
  return {
    ...cfg,
    smtpPassDec: cfg.smtpPassEnc ? (() => { try { return decryptSecret(cfg.smtpPassEnc!); } catch { return ""; } })() : "",
    resendKeyDec: cfg.resendKeyEnc ? (() => { try { return decryptSecret(cfg.resendKeyEnc!); } catch { return ""; } })() : "",
  };
}
