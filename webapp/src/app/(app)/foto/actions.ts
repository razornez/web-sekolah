"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { saveImage } from "@/lib/upload";

export type FotoState = { ok: boolean; message?: string };

async function upload(kind: "guru" | "siswa", formData: FormData): Promise<FotoState> {
  const sekolahId = await requireStaff();
  const ownerId = Number(formData.get("ownerId"));
  const file = formData.get("file");
  if (!ownerId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pilih file foto dulu." };
  }

  let url: string;
  try {
    url = await saveImage(file, `${kind}/${sekolahId}`);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  if (kind === "guru") {
    const g = await prisma.guru.findFirst({ where: { id: ownerId, sekolahId }, select: { id: true } });
    if (!g) return { ok: false, message: "Data tidak ditemukan." };
    await prisma.guru.update({ where: { id: ownerId }, data: { foto: url } });
  } else {
    const s = await prisma.siswa.findFirst({ where: { id: ownerId, sekolahId }, select: { id: true } });
    if (!s) return { ok: false, message: "Data tidak ditemukan." };
    await prisma.siswa.update({ where: { id: ownerId }, data: { foto: url } });
  }
  revalidatePath(`/${kind}/${ownerId}`);
  return { ok: true, message: "Foto berhasil diperbarui." };
}

export async function uploadFotoGuru(_prev: FotoState, fd: FormData) {
  return upload("guru", fd);
}
export async function uploadFotoSiswa(_prev: FotoState, fd: FormData) {
  return upload("siswa", fd);
}
