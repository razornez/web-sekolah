"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";
import { suratSchema } from "@/lib/validations";

export type SuratFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveSurat(
  _prev: SuratFormState,
  formData: FormData,
): Promise<SuratFormState> {
  const sekolahId = await requireStaff();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = suratSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const data = {
    perihal: d.perihal,
    nomor: d.nomor,
    jenis: d.jenis,
    isi: d.isi,
    tanggal: d.tanggal ? new Date(d.tanggal) : new Date(),
  };

  if (id) {
    const existing = await prisma.surat.findFirst({ where: { id, sekolahId }, select: { id: true } });
    if (!existing) return { ok: false, message: "Surat tidak ditemukan." };
    await prisma.surat.update({ where: { id }, data });
    await auditLog({ aksi: "update", entitas: "surat", entitasId: id, detail: `Update surat: ${d.perihal}` });
  } else {
    const s = await prisma.surat.create({ data: { ...data, sekolahId } });
    await auditLog({ aksi: "create", entitas: "surat", entitasId: s.id, detail: `Tambah surat: ${d.perihal}` });
  }

  revalidatePath("/surat");
  redirect("/surat");
}

export async function deleteSurat(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.surat.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "surat", entitasId: id, detail: `Hapus surat #${id}` });
  revalidatePath("/surat");
}
