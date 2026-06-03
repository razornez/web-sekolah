"use server";

import { Prisma, StatusPembayaran } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { jenisPembayaranSchema, tagihanSchema } from "@/lib/validations";

// ---- Jenis Pembayaran ----------------------------------------------------
export async function createJenis(formData: FormData) {
  const sekolahId = await getSekolahId();
  const parsed = jenisPembayaranSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.jenisPembayaran.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/spp/jenis");
}

export async function updateJenis(formData: FormData) {
  const sekolahId = await getSekolahId();
  const id = Number(formData.get("id"));
  const parsed = jenisPembayaranSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.jenisPembayaran.updateMany({
    where: { id, sekolahId },
    data: parsed.data,
  });
  revalidatePath("/spp/jenis");
}

export async function deleteJenis(formData: FormData) {
  const sekolahId = await getSekolahId();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jenisPembayaran.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/spp/jenis");
}

// ---- Tagihan & Pembayaran ------------------------------------------------
export async function addTagihan(formData: FormData) {
  const sekolahId = await getSekolahId();
  const parsed = tagihanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;

  const [siswa, jenis] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: d.siswaId, sekolahId }, select: { id: true } }),
    prisma.jenisPembayaran.findFirst({ where: { id: d.jenisId, sekolahId }, select: { id: true, nominal: true } }),
  ]);
  if (!siswa || !jenis) return;

  try {
    await prisma.tagihanSpp.create({
      data: {
        sekolahId,
        siswaId: d.siswaId,
        jenisId: d.jenisId,
        bulan: d.bulan,
        tahun: d.tahun,
        nominal: d.nominal || jenis.nominal,
        status: StatusPembayaran.belum,
      },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    // tagihan bulan tsb sudah ada → abaikan
  }
  revalidatePath(`/spp?siswaId=${d.siswaId}`);
}

export async function bayarTagihan(formData: FormData) {
  const sekolahId = await getSekolahId();
  const tagihanId = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!tagihanId) return;

  const tagihan = await prisma.tagihanSpp.findFirst({
    where: { id: tagihanId, sekolahId },
    select: { id: true, nominal: true },
  });
  if (!tagihan) return;

  await prisma.$transaction(async (tx) => {
    const bayar = await tx.pembayaranSpp.create({
      data: { tagihanId, jumlah: tagihan.nominal },
    });
    await tx.kwitansi.create({
      data: { pembayaranId: bayar.id, nomor: `KW-${Date.now()}-${tagihanId}` },
    });
    await tx.tagihanSpp.update({
      where: { id: tagihanId },
      data: { status: StatusPembayaran.lunas },
    });
  });
  revalidatePath(`/spp?siswaId=${siswaId}`);
}

export async function deleteTagihan(formData: FormData) {
  const sekolahId = await getSekolahId();
  const tagihanId = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!tagihanId) return;
  await prisma.tagihanSpp.deleteMany({ where: { id: tagihanId, sekolahId } });
  revalidatePath(`/spp?siswaId=${siswaId}`);
}
