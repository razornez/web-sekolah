"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { siswaSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";

export type SiswaFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveSiswa(
  _prev: SiswaFormState,
  formData: FormData,
): Promise<SiswaFormState> {
  const sekolahId = await requireStaff();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = siswaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const data = {
    namaLengkap: d.namaLengkap,
    nisn: d.nisn,
    nis: d.nis,
    nik: d.nik,
    jenisKelamin: d.jenisKelamin,
    tempatLahir: d.tempatLahir,
    tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : null,
    agama: d.agama,
    alamat: d.alamat,
    noHp: d.noHp,
    status: d.status,
  };

  try {
    if (id) {
      // Pastikan milik tenant ini sebelum update.
      const existing = await prisma.siswa.findFirst({
        where: { id, sekolahId },
        select: { id: true },
      });
      if (!existing) return { ok: false, message: "Data siswa tidak ditemukan." };
      await prisma.siswa.update({ where: { id }, data });
      await auditLog({ aksi: "update", entitas: "siswa", entitasId: id, detail: `Update siswa: ${d.namaLengkap}` });
    } else {
      const s = await prisma.siswa.create({ data: { ...data, sekolahId } });
      await auditLog({ aksi: "create", entitas: "siswa", entitasId: s.id, detail: `Buat siswa: ${d.namaLengkap}` });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "NISN sudah dipakai siswa lain." };
    }
    throw e;
  }

  revalidatePath("/siswa");
  redirect("/siswa");
}

export async function deleteSiswa(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  // deleteMany dengan filter tenant → aman lintas-sekolah & tidak error bila tak ada.
  await prisma.siswa.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "siswa", entitasId: id, detail: `Hapus siswa id: ${id}` });
  revalidatePath("/siswa");
}
