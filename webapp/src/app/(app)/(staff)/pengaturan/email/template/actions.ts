"use server";

import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { sendEmail } from "@/lib/mailer";

export async function saveTemplate(_prev: unknown, fd: FormData) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();

  const key = fd.get("key") as string;
  const subject = (fd.get("subject") as string).trim();
  const bodyHtml = (fd.get("bodyHtml") as string).trim();
  const bodyText = (fd.get("bodyText") as string).trim() || null;
  const isEnabled = fd.get("isEnabled") === "1";

  // Ambil default platform sebagai sumber name/description/category/variables
  const defaults = await prisma.emailTemplate.findFirst({ where: { key, sekolahId: null } });

  await prisma.emailTemplate.upsert({
    where: { key_sekolahId: { key, sekolahId } },
    create: {
      key,
      sekolahId,
      name: defaults?.name ?? key,
      description: defaults?.description,
      category: defaults?.category ?? "sistem",
      variables: defaults?.variables ?? [],
      subject,
      bodyHtml,
      bodyText,
      isEnabled,
    },
    update: { subject, bodyHtml, bodyText, isEnabled },
  });

  return { ok: true, message: "Template berhasil disimpan." };
}

export async function sendTestTemplate(_prev: unknown, fd: FormData) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const user = await getCurrentUser();

  const key = fd.get("key") as string;
  // Pakai resolveTemplate logic: template tenant dulu, fallback platform
  const template =
    (await prisma.emailTemplate.findFirst({ where: { key, sekolahId } })) ??
    (await prisma.emailTemplate.findFirst({ where: { key, sekolahId: null } }));

  if (!template) return { ok: false, message: "Template tidak ditemukan." };

  const vars = (template.variables as { name: string; example: string }[])
    .reduce<Record<string, string>>((acc, v) => { acc[v.name] = v.example; return acc; }, {});

  if (!user.email) return { ok: false, message: "Akun Anda tidak memiliki email terdaftar." };

  const result = await sendEmail({
    templateKey: key,
    to: { email: user.email as string, name: user.name ?? undefined },
    variables: vars,
    sekolahId,
  });

  if (!result.ok) return { ok: false, message: `Gagal: ${result.error}` };
  return { ok: true, message: `Email test terkirim ke ${user.email}` };
}
