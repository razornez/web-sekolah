"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { kategoriSarprasSchema, sarprasSchema } from "@/lib/validations";
import { catchDeleteError } from "@/lib/deleteError";
import { auditLog } from "@/lib/audit";

// ---- Kategori ------------------------------------------------------------
export async function createKategoriSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const parsed = kategoriSarprasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const k = await prisma.kategoriSarpras.create({ data: { ...parsed.data, sekolahId } });
  await auditLog({ aksi: "create", entitas: "sarpras", entitasId: k.id, detail: `Tambah kategori sarpras: ${parsed.data.nama}` });
  revalidatePath("/sarpras/kategori");
}

export async function updateKategoriSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const id = Number(formData.get("id"));
  const parsed = kategoriSarprasSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.kategoriSarpras.updateMany({ where: { id, sekolahId }, data: parsed.data });
  await auditLog({ aksi: "update", entitas: "sarpras", entitasId: id, detail: `Update kategori sarpras: ${parsed.data.nama}` });
  revalidatePath("/sarpras/kategori");
}

export async function deleteKategoriSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await prisma.kategoriSarpras.deleteMany({ where: { id, sekolahId } });
    await auditLog({ aksi: "delete", entitas: "sarpras", entitasId: id, detail: `Hapus kategori sarpras #${id}` });
    revalidatePath("/sarpras/kategori");
    return { ok: true };
  } catch (e) {
    return catchDeleteError(e, "Kategori Sarpras");
  }
}

// ---- Sarpras -------------------------------------------------------------
async function validKategori(sekolahId: number, kategoriId: number | null) {
  if (!kategoriId) return true;
  const k = await prisma.kategoriSarpras.findFirst({ where: { id: kategoriId, sekolahId }, select: { id: true } });
  return !!k;
}

export async function createSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const parsed = sarprasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  if (!(await validKategori(sekolahId, parsed.data.kategoriId))) return;
  const s = await prisma.sarpras.create({ data: { ...parsed.data, sekolahId } });
  await auditLog({ aksi: "create", entitas: "sarpras", entitasId: s.id, detail: `Tambah sarpras: ${parsed.data.nama}` });
  revalidatePath("/sarpras");
}

export async function updateSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const id = Number(formData.get("id"));
  const parsed = sarprasSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  if (!(await validKategori(sekolahId, parsed.data.kategoriId))) return;
  await prisma.sarpras.updateMany({ where: { id, sekolahId }, data: parsed.data });
  await auditLog({ aksi: "update", entitas: "sarpras", entitasId: id, detail: `Update sarpras: ${parsed.data.nama}` });
  revalidatePath("/sarpras");
}

export async function deleteSarpras(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.sarpras.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "sarpras", entitasId: id, detail: `Hapus sarpras #${id}` });
  revalidatePath("/sarpras");
}

const TINDAK_LANJUT = ["", "Diajukan", "Dalam Perbaikan", "Selesai", "Dihapuskan"];
/** Set status tindak lanjut untuk item rusak (BUG-SARPRAS-01) */
export async function setTindakLanjut(formData: FormData) {
  const sekolahId = await requireModule("sarpras");
  const id = Number(formData.get("id"));
  const status = String(formData.get("tindakLanjut") ?? "");
  if (!id || !TINDAK_LANJUT.includes(status)) return;
  await prisma.sarpras.updateMany({ where: { id, sekolahId }, data: { tindakLanjut: status || null } });
  await auditLog({ aksi: "update", entitas: "sarpras", entitasId: id, detail: `Tindak lanjut: ${status || "—"}` });
  revalidatePath("/sarpras");
}
