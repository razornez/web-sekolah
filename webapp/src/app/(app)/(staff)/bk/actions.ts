"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { kategoriKasusSchema, kasusSchema } from "@/lib/validations";

// ---- Kategori Kasus (master) --------------------------------------------
export async function createKategori(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = kategoriKasusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.kategoriKasus.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/bk/kategori");
}

export async function updateKategori(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = kategoriKasusSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.kategoriKasus.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/bk/kategori");
}

export async function deleteKategori(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.kategoriKasus.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/bk/kategori");
}

// ---- Kasus / Pelanggaran siswa ------------------------------------------
export async function addKasus(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = kasusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;

  const siswa = await prisma.siswa.findFirst({
    where: { id: d.siswaId, sekolahId },
    select: { id: true },
  });
  if (!siswa) return;

  let namaKasus = d.namaKasus;
  let poin = d.poin;
  if (d.kategoriId) {
    const kat = await prisma.kategoriKasus.findFirst({
      where: { id: d.kategoriId, sekolahId },
      select: { nama: true, poin: true },
    });
    if (!kat) return;
    if (!namaKasus) namaKasus = kat.nama;
    if (!poin) poin = kat.poin;
  }
  if (!namaKasus) return; // wajib ada nama (manual atau dari kategori)

  await prisma.kasusSiswa.create({
    data: {
      sekolahId,
      siswaId: d.siswaId,
      kategoriId: d.kategoriId,
      namaKasus,
      poin,
      tanggal: d.tanggal ? new Date(d.tanggal) : new Date(),
      keterangan: d.keterangan,
    },
  });
  revalidatePath(`/bk?siswaId=${d.siswaId}`);
}

export async function deleteKasus(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!id) return;
  await prisma.kasusSiswa.deleteMany({ where: { id, sekolahId } });
  revalidatePath(`/bk?siswaId=${siswaId}`);
}
