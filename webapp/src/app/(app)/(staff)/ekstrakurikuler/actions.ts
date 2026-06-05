"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

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
  const e = await prisma.ekstrakurikuler.create({ data: { sekolahId, nama, pembinaGuruId } });
  await auditLog({ aksi: "create", entitas: "ekstrakurikuler", entitasId: e.id, detail: `Tambah ekstrakurikuler: ${nama}` });
  revalidatePath("/ekstrakurikuler");
}

export async function updateEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  const nama = String(formData.get("nama") ?? "").trim();
  if (!id || !nama) return;
  const pembinaGuruId = num(formData.get("pembinaGuruId"));
  await prisma.ekstrakurikuler.updateMany({ where: { id, sekolahId }, data: { nama, pembinaGuruId } });
  await auditLog({ aksi: "update", entitas: "ekstrakurikuler", entitasId: id, detail: `Update ekstrakurikuler: ${nama}` });
  revalidatePath("/ekstrakurikuler");
}

/** Soft delete — tidak bisa hard delete karena ada riwayat anggota */
export async function deleteEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.ekstrakurikuler.updateMany({ where: { id, sekolahId }, data: { deletedAt: new Date() } });
  await auditLog({ aksi: "delete", entitas: "ekstrakurikuler", entitasId: id, detail: `Hapus ekstrakurikuler #${id}` });
  revalidatePath("/ekstrakurikuler");
}

export async function restoreEkstra(formData: FormData) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.ekstrakurikuler.updateMany({ where: { id, sekolahId }, data: { deletedAt: null } });
  await auditLog({ aksi: "update", entitas: "ekstrakurikuler", entitasId: id, detail: `Restore ekstrakurikuler #${id}` });
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
    await auditLog({ aksi: "create", entitas: "ekstrakurikuler", entitasId: ekstraId, detail: `Tambah anggota siswa #${siswaId} ke ekstra #${ekstraId}` });
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
  await auditLog({ aksi: "delete", entitas: "ekstrakurikuler", entitasId: id, detail: `Hapus anggota #${id} dari ekstra #${ekstraId}` });
  revalidatePath(`/ekstrakurikuler/${ekstraId}`);
}
