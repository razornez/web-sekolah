"use server";

import { PredikatP5 } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const PREDIKAT: PredikatP5[] = [PredikatP5.MB, PredikatP5.SB, PredikatP5.BSH, PredikatP5.SAB];

export async function createProjek(formData: FormData) {
  const sekolahId = await requireStaff();
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  const tema = String(formData.get("tema") ?? "").trim();
  const judul = String(formData.get("judul") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim() || null;
  if (!tahunAjaranId || !tema || !judul) return;

  const ta = await prisma.tahunAjaran.findFirst({ where: { id: tahunAjaranId, sekolahId }, select: { id: true } });
  if (!ta) return;

  await prisma.projekP5.create({ data: { sekolahId, tahunAjaranId, tema, judul, deskripsi } });
  revalidatePath("/p5");
}

export async function deleteProjek(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.projekP5.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/p5");
}

/** Set elemen yang ditargetkan projek (replace). */
export async function saveTarget(formData: FormData) {
  const sekolahId = await requireStaff();
  const projekP5Id = Number(formData.get("projekP5Id"));
  if (!projekP5Id) return;
  const projek = await prisma.projekP5.findFirst({ where: { id: projekP5Id, sekolahId }, select: { id: true } });
  if (!projek) return;

  const elemenIds = formData.getAll("elemenId").map((v) => Number(v)).filter((n) => n > 0);

  await prisma.$transaction([
    prisma.projekP5Target.deleteMany({ where: { projekP5Id } }),
    ...(elemenIds.length
      ? [prisma.projekP5Target.createMany({ data: elemenIds.map((elemenId) => ({ projekP5Id, elemenId })) })]
      : []),
  ]);
  revalidatePath(`/p5/${projekP5Id}`);
}

/** Penilaian batch: siswa (rombel) x elemen target -> predikat. */
export async function savePenilaian(formData: FormData) {
  const sekolahId = await requireStaff();
  const projekP5Id = Number(formData.get("projekP5Id"));
  const rombelId = Number(formData.get("rombelId"));
  if (!projekP5Id || !rombelId) return;

  const [projek, rombel] = await Promise.all([
    prisma.projekP5.findFirst({
      where: { id: projekP5Id, sekolahId },
      include: { target: { select: { elemenId: true } } },
    }),
    prisma.rombel.findFirst({ where: { id: rombelId, sekolahId }, include: { anggota: { select: { siswaId: true } } } }),
  ]);
  if (!projek || !rombel) return;

  const ops = [];
  for (const a of rombel.anggota) {
    for (const t of projek.target) {
      const raw = String(formData.get(`p_${a.siswaId}_${t.elemenId}`) ?? "") as PredikatP5;
      if (!PREDIKAT.includes(raw)) continue;
      ops.push(
        prisma.penilaianP5.upsert({
          where: { projekP5Id_siswaId_elemenId: { projekP5Id, siswaId: a.siswaId, elemenId: t.elemenId } },
          update: { predikat: raw },
          create: { projekP5Id, siswaId: a.siswaId, elemenId: t.elemenId, predikat: raw },
        }),
      );
    }
  }
  if (ops.length) await prisma.$transaction(ops);

  revalidatePath(`/p5/${projekP5Id}`);
  redirect(`/p5/${projekP5Id}?rombelId=${rombelId}`);
}
