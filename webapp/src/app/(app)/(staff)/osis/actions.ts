"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { calonOsisSchema } from "@/lib/validations";

export async function createCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = calonOsisSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.calonOsis.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/osis");
}

export async function updateCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = calonOsisSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.calonOsis.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/osis");
}

export async function deleteCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.calonOsis.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/osis");
}
