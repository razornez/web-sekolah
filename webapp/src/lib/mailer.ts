import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/email-crypto";

export interface SendEmailOptions {
  templateKey: string;
  to: { email: string; name?: string };
  variables: Record<string, string>;
  sekolahId?: number;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/** Ganti semua {{var}} dalam string dengan nilai dari `vars`. */
function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/** Config tenant dulu, fallback ke platform default (sekolahId=null). */
async function resolveConfig(sekolahId?: number) {
  if (sekolahId) {
    const tenantCfg = await prisma.emailConfig.findUnique({ where: { sekolahId } });
    if (tenantCfg?.isActive) return tenantCfg;
  }
  return prisma.emailConfig.findFirst({ where: { sekolahId: null, isActive: true } });
}

/** Template tenant dulu, fallback ke platform default (sekolahId=null). */
async function resolveTemplate(key: string, sekolahId?: number) {
  if (sekolahId) {
    const tenantTpl = await prisma.emailTemplate.findFirst({ where: { key, sekolahId } });
    if (tenantTpl?.isEnabled) return tenantTpl;
  }
  return prisma.emailTemplate.findFirst({ where: { key, sekolahId: null } });
}

/**
 * Kirim email menggunakan template dari DB.
 * Lookup per-tenant dulu, fallback ke platform default.
 * Jika config tidak aktif atau template disabled → no-op (tidak error).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const [config, template] = await Promise.all([
      resolveConfig(opts.sekolahId),
      resolveTemplate(opts.templateKey, opts.sekolahId),
    ]);

    if (!config) return { ok: false, error: "Email config not active" };
    if (!template?.isEnabled) return { ok: false, error: "Template disabled or not found" };

    const subject = render(template.subject, opts.variables);
    const bodyHtml = render(template.bodyHtml, opts.variables);
    const bodyText = template.bodyText ? render(template.bodyText, opts.variables) : undefined;

    const logEntry = await prisma.emailLog.create({
      data: {
        templateKey: opts.templateKey,
        sekolahId: opts.sekolahId,
        toEmail: opts.to.email,
        toName: opts.to.name,
        subject,
        bodyHtml,
        status: "pending",
      },
    });

    let sendError: string | null = null;

    if (config.provider === "resend") {
      sendError = await sendViaResend(config.resendKeyEnc!, opts.to, subject, bodyHtml, config.fromEmail, config.fromName);
    } else {
      sendError = await sendViaSmtp(config, opts.to, subject, bodyHtml, bodyText);
    }

    await prisma.emailLog.update({
      where: { id: logEntry.id },
      data: {
        status: sendError ? "failed" : "sent",
        errorMsg: sendError,
        sentAt: sendError ? null : new Date(),
      },
    });

    if (sendError) return { ok: false, error: sendError };
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

async function sendViaSmtp(
  config: { smtpHost?: string | null; smtpPort?: number | null; smtpSecure: boolean; smtpUser?: string | null; smtpPassEnc?: string | null; fromEmail: string; fromName: string },
  to: { email: string; name?: string },
  subject: string,
  html: string,
  text?: string,
): Promise<string | null> {
  try {
    const nodemailer = await import("nodemailer");
    const pass = config.smtpPassEnc ? decryptSecret(config.smtpPassEnc) : "";
    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost ?? "",
      port: config.smtpPort ?? 587,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser ?? "", pass },
    });
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: to.name ? `"${to.name}" <${to.email}>` : to.email,
      subject,
      html,
      text,
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

async function sendViaResend(
  resendKeyEnc: string,
  to: { email: string; name?: string },
  subject: string,
  html: string,
  fromEmail: string,
  fromName: string,
): Promise<string | null> {
  try {
    const apiKey = decryptSecret(resendKeyEnc);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to.email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return `Resend error ${res.status}: ${body}`;
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
