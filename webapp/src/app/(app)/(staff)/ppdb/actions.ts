"use server";

import { StatusPpdb } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { jalurPpdbSchema } from "@/lib/validations";

// ---- Jalur PPDB ----------------------------------------------------------
export async function createJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = jalurPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.jalurPpdb.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/ppdb/jalur");
}

export async function updateJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = jalurPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.jalurPpdb.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/ppdb/jalur");
}

export async function deleteJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jalurPpdb.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/ppdb/jalur");
}

// ---- Pendaftar -----------------------------------------------------------
const VALID: StatusPpdb[] = [StatusPpdb.baru, StatusPpdb.diterima, StatusPpdb.ditolak, StatusPpdb.cadangan];

export async function updateStatusPendaftar(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const raw = String(formData.get("status") ?? "") as StatusPpdb;
  if (!id || !VALID.includes(raw)) return;
  await prisma.pendaftaranPpdb.updateMany({ where: { id, sekolahId }, data: { status: raw } });
  revalidatePath("/ppdb");
}

export async function deletePendaftar(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pendaftaranPpdb.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/ppdb");
}
