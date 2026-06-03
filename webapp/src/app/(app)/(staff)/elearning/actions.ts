"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createElearning(formData: FormData) {
  const sekolahId = await requireStaff();
  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return;
  const guruId = Number(formData.get("guruId")) || null;
  if (guruId) {
    const g = await prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } });
    if (!g) return;
  }
  await prisma.elearning.create({
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
  revalidatePath("/elearning");
}

export async function deleteElearning(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.elearning.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/elearning");
}
