"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { bukuSchema } from "@/lib/validations";

export type BukuFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveBuku(
  _prev: BukuFormState,
  formData: FormData,
): Promise<BukuFormState> {
  const sekolahId = await requireStaff();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = bukuSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (id) {
    const existing = await prisma.bukuPerpustakaan.findFirst({ where: { id, sekolahId }, select: { id: true } });
    if (!existing) return { ok: false, message: "Buku tidak ditemukan." };
    await prisma.bukuPerpustakaan.update({ where: { id }, data });
  } else {
    await prisma.bukuPerpustakaan.create({ data: { ...data, sekolahId } });
  }

  revalidatePath("/perpustakaan");
  redirect("/perpustakaan");
}

export async function deleteBuku(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.bukuPerpustakaan.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/perpustakaan");
}

export async function pinjamBuku(formData: FormData) {
  const sekolahId = await requireStaff();
  const siswaId = Number(formData.get("siswaId"));
  const bukuId = Number(formData.get("bukuId"));
  const durasiHari = Number(formData.get("durasiHari")) || null;
  if (!siswaId || !bukuId) return;

  const [siswa, buku] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
    prisma.bukuPerpustakaan.findFirst({ where: { id: bukuId, sekolahId }, select: { id: true } }),
  ]);
  if (!siswa || !buku) return;

  await prisma.pinjamanBuku.create({
    data: { sekolahId, bukuId, siswaId, durasiHari },
  });
  revalidatePath(`/perpustakaan/pinjam?siswaId=${siswaId}`);
}

export async function kembalikanBuku(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!id) return;
  await prisma.pinjamanBuku.updateMany({
    where: { id, sekolahId },
    data: { tanggalKembali: new Date() },
  });
  revalidatePath(`/perpustakaan/pinjam?siswaId=${siswaId}`);
}
