"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createTugas(formData: FormData) {
  const sekolahId = await requireModule("tugas");
  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return;
  const rombelId = Number(formData.get("rombelId")) || null;
  if (rombelId) {
    const r = await prisma.rombel.findFirst({ where: { id: rombelId, sekolahId }, select: { id: true } });
    if (!r) return;
  }
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  await prisma.tugas.create({
    data: {
      sekolahId,
      judul,
      mapel: str(formData.get("mapel")),
      rombelId,
      deskripsi: str(formData.get("deskripsi")),
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  revalidatePath("/tugas");
}

export async function deleteTugas(formData: FormData) {
  const sekolahId = await requireModule("tugas");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.tugas.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/tugas");
}

export async function nilaiPengumpulan(formData: FormData) {
  const sekolahId = await requireModule("tugas");
  const id = Number(formData.get("id"));
  const tugasId = Number(formData.get("tugasId"));
  if (!id) return;
  const nilai = Number(formData.get("nilai"));
  await prisma.pengumpulanTugas.updateMany({
    where: { id, tugas: { sekolahId } },
    data: { nilai: Number.isNaN(nilai) ? null : nilai },
  });
  revalidatePath(`/tugas/${tugasId}`);
}
