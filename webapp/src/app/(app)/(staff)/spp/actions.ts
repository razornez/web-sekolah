"use server";

import { Prisma, StatusPembayaran } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";
import { jenisPembayaranSchema, tagihanSchema } from "@/lib/validations";

// ---- Jenis Pembayaran ----------------------------------------------------
export async function createJenis(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = jenisPembayaranSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const j = await prisma.jenisPembayaran.create({ data: { ...parsed.data, sekolahId } });
  await auditLog({ aksi: "create", entitas: "tagihan_spp", entitasId: j.id, detail: `Tambah jenis pembayaran: ${parsed.data.nama}` });
  revalidatePath("/spp/jenis");
}

export async function updateJenis(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = jenisPembayaranSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.jenisPembayaran.updateMany({
    where: { id, sekolahId },
    data: parsed.data,
  });
  await auditLog({ aksi: "update", entitas: "tagihan_spp", entitasId: id, detail: `Update jenis pembayaran: ${parsed.data.nama}` });
  revalidatePath("/spp/jenis");
}

export async function deleteJenis(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jenisPembayaran.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "tagihan_spp", entitasId: id, detail: `Hapus jenis pembayaran #${id}` });
  revalidatePath("/spp/jenis");
}

// ---- Tagihan & Pembayaran ------------------------------------------------
export async function addTagihan(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = tagihanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;

  const [siswa, jenis] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: d.siswaId, sekolahId }, select: { id: true } }),
    prisma.jenisPembayaran.findFirst({ where: { id: d.jenisId, sekolahId }, select: { id: true, nominal: true } }),
  ]);
  if (!siswa || !jenis) return;

  try {
    const t = await prisma.tagihanSpp.create({
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
    await auditLog({ aksi: "create", entitas: "tagihan_spp", entitasId: t.id, detail: `Tambah tagihan SPP siswa #${d.siswaId} (${d.bulan}/${d.tahun})` });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    // tagihan bulan tsb sudah ada → abaikan
  }
  revalidatePath(`/spp?siswaId=${d.siswaId}`);
}

export async function bayarTagihan(formData: FormData) {
  const sekolahId = await requireStaff();
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
    await auditLog({ aksi: "update", entitas: "spp", entitasId: tagihanId, detail: "Bayar SPP" }); await tx.tagihanSpp.update({
      where: { id: tagihanId },
      data: { status: StatusPembayaran.lunas },
    });
  });
  revalidatePath(`/spp?siswaId=${siswaId}`);
}

export async function deleteTagihan(formData: FormData) {
  const sekolahId = await requireStaff();
  const tagihanId = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!tagihanId) return;
  await prisma.tagihanSpp.deleteMany({ where: { id: tagihanId, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "tagihan_spp", entitasId: tagihanId, detail: `Hapus tagihan SPP #${tagihanId}` });
  revalidatePath(`/spp?siswaId=${siswaId}`);
}
