"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/** Siswa memberikan 1 suara (unik per sekolah). */
export async function castVote(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "siswa" || user.sekolahId == null) return;
  const calonId = Number(formData.get("calonId"));
  if (!calonId) return;

  const [siswa, calon] = await Promise.all([
    prisma.siswa.findFirst({ where: { userId: user.id, sekolahId: user.sekolahId }, select: { id: true } }),
    prisma.calonOsis.findFirst({ where: { id: calonId, sekolahId: user.sekolahId }, select: { id: true } }),
  ]);
  if (!siswa || !calon) return;

  try {
    await prisma.votePemilihan.create({
      data: { sekolahId: user.sekolahId, calonId, siswaId: siswa.id },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    // sudah memilih → abaikan
  }
  revalidatePath("/vote");
}
