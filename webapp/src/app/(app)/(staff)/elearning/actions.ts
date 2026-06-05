"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createElearning(formData: FormData) {
  const sekolahId = await requireModule("elearning");
  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return;
  const guruId = Number(formData.get("guruId")) || null;
  if (guruId) {
    const g = await prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } });
    if (!g) return;
  }
  const e = await prisma.elearning.create({
    data: {
      sekolahId,
      guruId,
      judul,
      deskripsi: str(formData.get("deskripsi")),
      link: str(formData.get("link")),
      kelas: str(formData.get("kelas")),
      mapel: str(formData.get("mapel")),
    },
  });
  await auditLog({ aksi: "create", entitas: "elearning", entitasId: e.id, detail: `Tambah elearning: ${judul}` });
  revalidatePath("/elearning");
}

export async function updateElearning(formData: FormData) {
  const sekolahId = await requireModule("elearning");
  const id = Number(formData.get("id"));
  const judul = String(formData.get("judul") ?? "").trim();
  if (!id || !judul) return;
  const guruId = Number(formData.get("guruId")) || null;
  if (guruId) {
    const g = await prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } });
    if (!g) return;
  }
  await prisma.elearning.updateMany({
    where: { id, sekolahId },
    data: { judul, guruId, kelas: str(formData.get("kelas")), mapel: str(formData.get("mapel")), link: str(formData.get("link")) },
  });
  await auditLog({ aksi: "update", entitas: "elearning", entitasId: id, detail: `Update elearning: ${judul}` });
  revalidatePath("/elearning");
}

export async function deleteElearning(formData: FormData) {
  const sekolahId = await requireModule("elearning");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.elearning.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "elearning", entitasId: id, detail: `Hapus elearning #${id}` });
  revalidatePath("/elearning");
}
