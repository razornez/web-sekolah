"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
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
  const sekolahId = await requireModule("perpustakaan");
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
    await auditLog({ aksi: "update", entitas: "buku", entitasId: id, detail: `Update buku: ${data.judul}` });
  } else {
    const b = await prisma.bukuPerpustakaan.create({ data: { ...data, sekolahId } });
    await auditLog({ aksi: "create", entitas: "buku", entitasId: b.id, detail: `Tambah buku: ${data.judul}` });
  }

  revalidatePath("/perpustakaan");
  redirect("/perpustakaan");
}

export async function deleteBuku(formData: FormData) {
  const sekolahId = await requireModule("perpustakaan");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.bukuPerpustakaan.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "buku", entitasId: id, detail: `Hapus buku #${id}` });
  revalidatePath("/perpustakaan");
}

export async function pinjamBuku(formData: FormData) {
  const sekolahId = await requireModule("perpustakaan");
  const siswaId = Number(formData.get("siswaId"));
  const bukuId = Number(formData.get("bukuId"));
  const durasiHari = Number(formData.get("durasiHari")) || null;
  if (!siswaId || !bukuId) return;

  const [siswa, buku] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
    prisma.bukuPerpustakaan.findFirst({ where: { id: bukuId, sekolahId }, select: { id: true } }),
  ]);
  if (!siswa || !buku) return;

  const p = await prisma.pinjamanBuku.create({
    data: { sekolahId, bukuId, siswaId, durasiHari },
  });
  await auditLog({ aksi: "create", entitas: "pinjaman", entitasId: p.id, detail: `Pinjam buku #${bukuId} oleh siswa #${siswaId}` });
  revalidatePath(`/perpustakaan/pinjam?siswaId=${siswaId}`);
}

export async function kembalikanBuku(formData: FormData) {
  const sekolahId = await requireModule("perpustakaan");
  const id = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!id) return;
  await prisma.pinjamanBuku.updateMany({
    where: { id, sekolahId },
    data: { tanggalKembali: new Date() },
  });
  await auditLog({ aksi: "update", entitas: "pinjaman", entitasId: id, detail: `Kembalikan pinjaman #${id}` });
  revalidatePath(`/perpustakaan/pinjam?siswaId=${siswaId}`);
}
