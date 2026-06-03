"use server";

import { PengumumanTarget } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

const TARGETS: PengumumanTarget[] = [
  PengumumanTarget.semua,
  PengumumanTarget.staf,
  PengumumanTarget.siswa,
  PengumumanTarget.ortu,
];

export async function createPengumuman(formData: FormData) {
  const sekolahId = await requireModule("pengumuman");
  const user = await getCurrentUser();
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  if (!judul || !isi) return;
  const targetRaw = String(formData.get("target") ?? "semua") as PengumumanTarget;
  const target = TARGETS.includes(targetRaw) ? targetRaw : PengumumanTarget.semua;
  const pinned = formData.get("pinned") === "on";

  await prisma.pengumuman.create({
    data: { sekolahId, judul, isi, target, pinned, createdById: user.id },
  });
  revalidatePath("/pengumuman");
}

export async function deletePengumuman(formData: FormData) {
  const sekolahId = await requireModule("pengumuman");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pengumuman.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/pengumuman");
}
