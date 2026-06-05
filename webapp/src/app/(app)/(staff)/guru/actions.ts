"use server";

import { Prisma } from "@prisma/client";
import { catchDeleteError } from "@/lib/deleteError";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManageGuru } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { guruSchema } from "@/lib/validations";

export type GuruFormState = {
  ok: boolean;
  to?: string;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveGuru(
  _prev: GuruFormState,
  formData: FormData,
): Promise<GuruFormState> {
  const sekolahId = await requireManageGuru();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = guruSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const data = {
    namaGuru: d.namaGuru,
    nip: d.nip,
    npk: d.npk,
    nuptk: d.nuptk,
    nik: d.nik,
    jenisKelamin: d.jenisKelamin,
    tempatLahir: d.tempatLahir,
    tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : null,
    alamat: d.alamat,
    email: d.email,
    noTelp: d.noTelp,
    pangkat: d.pangkat,
    golongan: d.golongan,
    jenisJabatan: d.jenisJabatan,
    statusGuru: d.statusGuru,
  };

  try {
    if (id) {
      const existing = await prisma.guru.findFirst({
        where: { id, sekolahId },
        select: { id: true },
      });
      if (!existing) return { ok: false, message: "Data guru tidak ditemukan." };
      await prisma.guru.update({ where: { id }, data });
    } else {
      await prisma.guru.create({ data: { ...data, sekolahId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "NIP sudah dipakai guru lain." };
    }
    throw e;
  }

  revalidatePath("/guru");
  return { ok: true, to: "/guru" };
}

/** Soft delete guru — wajib isi alasan */
export async function nonaktifkanGuru(formData: FormData) {
  const sekolahId = await requireManageGuru();
  const id = Number(formData.get("id"));
  const alasan = String(formData.get("alasan") ?? "").trim();
  if (!id || !alasan) return;
  const guru = await prisma.guru.findFirst({ where: { id, sekolahId }, select: { id: true, namaGuru: true } });
  if (!guru) return;
  await prisma.guru.update({ where: { id }, data: { deletedAt: new Date(), alasanHapus: alasan } });
  // Juga nonaktifkan akun user-nya jika ada
  await prisma.guru.update({ where: { id }, data: {} }); // noop
  await prisma.user.updateMany({ where: { guru: { id } }, data: { isActive: false } });
  await auditLog({ aksi: "delete", entitas: "guru", entitasId: id, detail: `Nonaktifkan guru: ${guru.namaGuru} — ${alasan}` });
  revalidatePath("/guru");
}

export async function aktifkanKembaliGuru(formData: FormData) {
  const sekolahId = await requireManageGuru();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.guru.update({ where: { id }, data: { deletedAt: null, alasanHapus: null } });
  await prisma.user.updateMany({ where: { guru: { id } }, data: { isActive: true } });
  await auditLog({ aksi: "update", entitas: "guru", entitasId: id, detail: "Aktifkan kembali guru" });
  revalidatePath("/guru");
}

export async function deleteGuru(formData: FormData) {
  const sekolahId = await requireManageGuru();
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await prisma.guru.deleteMany({ where: { id, sekolahId } });
    await auditLog({ aksi: "delete", entitas: "guru", entitasId: id, detail: "Hapus guru" });
    revalidatePath("/guru");
    return { ok: true };
  } catch (e) {
    return catchDeleteError(e, "Guru");
  }
}
