"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

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
  const t = await prisma.tugas.create({
    data: {
      sekolahId,
      judul,
      mapel: str(formData.get("mapel")),
      rombelId,
      deskripsi: str(formData.get("deskripsi")),
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  await auditLog({ aksi: "create", entitas: "tugas", entitasId: t.id, detail: `Tambah tugas: ${judul}` });
  revalidatePath("/tugas");
}

export async function updateTugas(formData: FormData) {
  const sekolahId = await requireModule("tugas");
  const id = Number(formData.get("id"));
  const judul = String(formData.get("judul") ?? "").trim();
  if (!id || !judul) return;
  const rombelId = Number(formData.get("rombelId")) || null;
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  await prisma.tugas.updateMany({
    where: { id, sekolahId },
    data: {
      judul,
      mapel: str(formData.get("mapel")),
      rombelId,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  await auditLog({ aksi: "update", entitas: "tugas", entitasId: id, detail: `Update tugas: ${judul}` });
  revalidatePath("/tugas");
}

export async function deleteTugas(formData: FormData) {
  const sekolahId = await requireModule("tugas");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.tugas.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "tugas", entitasId: id, detail: `Hapus tugas #${id}` });
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
  await auditLog({ aksi: "update", entitas: "tugas", entitasId: tugasId, detail: `Nilai pengumpulan #${id} tugas #${tugasId}` });
  revalidatePath(`/tugas/${tugasId}`);
}
