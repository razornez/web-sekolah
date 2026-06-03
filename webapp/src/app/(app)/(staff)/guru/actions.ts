"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";
import { guruSchema } from "@/lib/validations";

export type GuruFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveGuru(
  _prev: GuruFormState,
  formData: FormData,
): Promise<GuruFormState> {
  const sekolahId = await requireStaff();
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
  redirect("/guru");
}

export async function deleteGuru(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.guru.deleteMany({ where: { id, sekolahId } }); await auditLog({ aksi: "delete", entitas: "guru", entitasId: id, detail: "Hapus guru" });
  revalidatePath("/guru");
}
