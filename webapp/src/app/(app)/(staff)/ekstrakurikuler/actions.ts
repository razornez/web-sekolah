"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const num = (v: FormDataEntryValue | null) => Number(v) || null;

export async function createEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const nama = String(formData.get("nama") ?? "").trim();
  if (!nama) return;
  const pembinaGuruId = num(formData.get("pembinaGuruId"));
  if (pembinaGuruId) {
    const g = await prisma.guru.findFirst({ where: { id: pembinaGuruId, sekolahId }, select: { id: true } });
    if (!g) return;
  }
  await prisma.ekstrakurikuler.create({ data: { sekolahId, nama, pembinaGuruId } });
  revalidatePath("/ekstrakurikuler");
}

export async function updateEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  const nama = String(formData.get("nama") ?? "").trim();
  if (!id || !nama) return;
  const pembinaGuruId = num(formData.get("pembinaGuruId"));
  await prisma.ekstrakurikuler.updateMany({ where: { id, sekolahId }, data: { nama, pembinaGuruId } });
  revalidatePath("/ekstrakurikuler");
}

export async function deleteEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.ekstrakurikuler.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/ekstrakurikuler");
}

export async function addAnggotaEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const ekstraId = Number(formData.get("ekstraId"));
  const siswaId = Number(formData.get("siswaId"));
  if (!ekstraId || !siswaId) return;
  const [ekstra, siswa] = await Promise.all([
    prisma.ekstrakurikuler.findFirst({ where: { id: ekstraId, sekolahId }, select: { id: true } }),
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
  ]);
  if (!ekstra || !siswa) return;
  try {
    await prisma.anggotaEkstra.create({ data: { ekstraId, siswaId } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  revalidatePath(`/ekstrakurikuler/${ekstraId}`);
}

export async function removeAnggotaEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  const ekstraId = Number(formData.get("ekstraId"));
  if (!id) return;
  await prisma.anggotaEkstra.deleteMany({ where: { id, ekstra: { sekolahId } } });
  revalidatePath(`/ekstrakurikuler/${ekstraId}`);
}
