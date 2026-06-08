"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/mailer";

async function requireSuperadmin() {
  const user = await getCurrentUser();
  if (user.role !== "superadmin") redirect("/dashboard");
  return user;
}

export async function saveTemplate(_prev: unknown, fd: FormData) {
  await requireSuperadmin();

  const key = fd.get("key") as string;
  const subject = (fd.get("subject") as string).trim();
  const bodyHtml = (fd.get("bodyHtml") as string).trim();
  const bodyText = (fd.get("bodyText") as string).trim() || null;
  const isEnabled = fd.get("isEnabled") === "1";

  await prisma.emailTemplate.update({
    where: { key },
    data: { subject, bodyHtml, bodyText, isEnabled },
  });

  return { ok: true, message: "Template berhasil disimpan." };
}

export async function sendTestTemplate(_prev: unknown, fd: FormData) {
  const user = await requireSuperadmin();

  const key = fd.get("key") as string;
  const template = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!template) return { ok: false, message: "Template tidak ditemukan." };

  // Buat sample variables dari daftar yang tersedia
  const vars = (template.variables as { name: string; example: string }[])
    .reduce<Record<string, string>>((acc, v) => { acc[v.name] = v.example; return acc; }, {});

  if (!user.email) return { ok: false, message: "Akun superadmin tidak memiliki email." };

  const result = await sendEmail({
    templateKey: key,
    to: { email: user.email as string, name: user.name ?? undefined },
    variables: vars,
  });

  if (!result.ok) return { ok: false, message: `Gagal: ${result.error}` };
  return { ok: true, message: `Email test terkirim ke ${user.email}` };
}
