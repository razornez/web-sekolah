"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";
import { calonOsisSchema } from "@/lib/validations";

export async function createCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = calonOsisSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const c = await prisma.calonOsis.create({ data: { ...parsed.data, sekolahId } });
  await auditLog({ aksi: "create", entitas: "osis", entitasId: c.id, detail: `Tambah calon OSIS: ${parsed.data.namaKetua}` });
  revalidatePath("/osis");
}

export async function updateCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = calonOsisSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.calonOsis.updateMany({ where: { id, sekolahId }, data: parsed.data });
  await auditLog({ aksi: "update", entitas: "osis", entitasId: id, detail: `Update calon OSIS: ${parsed.data.namaKetua}` });
  revalidatePath("/osis");
}

export async function deleteCalon(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.calonOsis.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "osis", entitasId: id, detail: `Hapus calon OSIS #${id}` });
  revalidatePath("/osis");
}
