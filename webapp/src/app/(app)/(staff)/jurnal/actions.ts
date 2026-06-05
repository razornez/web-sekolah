"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createJurnal(formData: FormData) {
  const sekolahId = await requireStaff();
  const guruId = Number(formData.get("guruId"));
  const tglRaw = String(formData.get("tanggal") ?? "").trim();
  if (!guruId || !tglRaw) return;
  const guru = await prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } });
  if (!guru) return;
  const j = await prisma.jurnalGuru.create({
    data: {
      sekolahId,
      guruId,
      tanggal: new Date(tglRaw),
      kelas: str(formData.get("kelas")),
      mapel: str(formData.get("mapel")),
      materi: str(formData.get("materi")),
      deskripsi: str(formData.get("deskripsi")),
    },
  });
  await auditLog({ aksi: "create", entitas: "jurnal", entitasId: j.id, detail: `Tambah jurnal guru #${guruId} (${tglRaw})` });
  revalidatePath("/jurnal");
}

export async function updateJurnal(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const tglRaw = String(formData.get("tanggal") ?? "").trim();
  if (!id) return;
  await prisma.jurnalGuru.updateMany({
    where: { id, sekolahId },
    data: {
      ...(tglRaw ? { tanggal: new Date(tglRaw) } : {}),
      kelas: str(formData.get("kelas")),
      mapel: str(formData.get("mapel")),
      materi: str(formData.get("materi")),
    },
  });
  await auditLog({ aksi: "update", entitas: "jurnal", entitasId: id, detail: `Update jurnal #${id}` });
  revalidatePath("/jurnal");
}

export async function deleteJurnal(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jurnalGuru.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "jurnal", entitasId: id, detail: `Hapus jurnal #${id}` });
  revalidatePath("/jurnal");
}
