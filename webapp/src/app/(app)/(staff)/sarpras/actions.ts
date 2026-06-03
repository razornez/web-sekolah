"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { kategoriSarprasSchema, sarprasSchema } from "@/lib/validations";

// ---- Kategori ------------------------------------------------------------
export async function createKategoriSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = kategoriSarprasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.kategoriSarpras.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/sarpras/kategori");
}

export async function updateKategoriSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = kategoriSarprasSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.kategoriSarpras.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/sarpras/kategori");
}

export async function deleteKategoriSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.kategoriSarpras.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/sarpras/kategori");
}

// ---- Sarpras -------------------------------------------------------------
async function validKategori(sekolahId: number, kategoriId: number | null) {
  if (!kategoriId) return true;
  const k = await prisma.kategoriSarpras.findFirst({ where: { id: kategoriId, sekolahId }, select: { id: true } });
  return !!k;
}

export async function createSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = sarprasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  if (!(await validKategori(sekolahId, parsed.data.kategoriId))) return;
  await prisma.sarpras.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/sarpras");
}

export async function updateSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = sarprasSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  if (!(await validKategori(sekolahId, parsed.data.kategoriId))) return;
  await prisma.sarpras.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/sarpras");
}

export async function deleteSarpras(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.sarpras.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/sarpras");
}
