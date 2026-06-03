"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function submitTugas(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "siswa" || user.sekolahId == null) return;
  const tugasId = Number(formData.get("tugasId"));
  if (!tugasId) return;

  const [siswa, tugas] = await Promise.all([
    prisma.siswa.findFirst({ where: { userId: user.id, sekolahId: user.sekolahId }, select: { id: true } }),
    prisma.tugas.findFirst({ where: { id: tugasId, sekolahId: user.sekolahId }, select: { id: true } }),
  ]);
  if (!siswa || !tugas) return;

  await prisma.pengumpulanTugas.upsert({
    where: { tugasId_siswaId: { tugasId, siswaId: siswa.id } },
    update: { teks: str(formData.get("teks")), link: str(formData.get("link")), tanggalKumpul: new Date() },
    create: { tugasId, siswaId: siswa.id, teks: str(formData.get("teks")), link: str(formData.get("link")) },
  });
  revalidatePath("/tugas-saya");
}
