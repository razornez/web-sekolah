"use server";

import { StatusHasil, TipeSoal, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { recomputeSkor } from "@/lib/ujian";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

/** Resolusi siswa + ujian yang tersedia utk siswa tsb. */
async function resolveSiswaUjian(ujianId: number) {
  const user = await getCurrentUser();
  if (user.role !== "siswa" || user.sekolahId == null) return null;
  const siswa = await prisma.siswa.findFirst({
    where: { userId: user.id, sekolahId: user.sekolahId },
    select: { id: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, select: { rombelId: true } } },
  });
  if (!siswa) return null;
  const rombelId = siswa.anggotaRombel[0]?.rombelId ?? null;
  const now = new Date();
  const ujian = await prisma.ujian.findFirst({
    where: {
      id: ujianId,
      sekolahId: user.sekolahId,
      aktif: true,
      OR: [{ rombelId: null }, ...(rombelId ? [{ rombelId }] : [])],
      AND: [{ OR: [{ mulai: null }, { mulai: { lte: now } }] }, { OR: [{ selesai: null }, { selesai: { gte: now } }] }],
    },
    select: { id: true },
  });
  if (!ujian) return null;
  return { siswaId: siswa.id, ujianId };
}

export async function mulaiUjian(formData: FormData) {
  const ujianId = Number(formData.get("ujianId"));
  if (!ujianId) return;
  const ctx = await resolveSiswaUjian(ujianId);
  if (!ctx) return;
  try {
    await prisma.hasilUjian.create({
      data: { ujianId, siswaId: ctx.siswaId, status: StatusHasil.berlangsung, mulaiAt: new Date() },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    // sudah mulai → biarkan
  }
  revalidatePath(`/ujian-saya/${ujianId}`);
}

export async function submitUjian(formData: FormData) {
  const ujianId = Number(formData.get("ujianId"));
  if (!ujianId) return;
  const ctx = await resolveSiswaUjian(ujianId);
  if (!ctx) return;

  const hasil = await prisma.hasilUjian.findUnique({
    where: { ujianId_siswaId: { ujianId, siswaId: ctx.siswaId } },
    select: { id: true, status: true },
  });
  if (!hasil || hasil.status === StatusHasil.selesai) {
    redirect(`/ujian-saya/${ujianId}`);
  }

  const soal = await prisma.soal.findMany({ where: { ujianId } });
  const ops: Prisma.PrismaPromise<unknown>[] = soal.map((s) => {
    const jawaban = str(formData.get(`jawaban_${s.id}`));
    const nilai = s.tipe === TipeSoal.pilihan_ganda ? (jawaban && jawaban === s.kunci ? s.bobot : 0) : null;
    return prisma.jawabanUjian.upsert({
      where: { hasilId_soalId: { hasilId: hasil.id, soalId: s.id } },
      update: { jawaban, nilai },
      create: { hasilId: hasil.id, soalId: s.id, jawaban, nilai },
    });
  });
  ops.push(
    prisma.hasilUjian.update({
      where: { id: hasil.id },
      data: { status: StatusHasil.selesai, selesaiAt: new Date() },
    }),
  );
  await prisma.$transaction(ops);
  await recomputeSkor(hasil.id);
  redirect(`/ujian-saya/${ujianId}`);
}
