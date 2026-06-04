"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { mapelSchema } from "@/lib/validations";

export type MapelFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveMapel(
  _prev: MapelFormState,
  formData: FormData,
): Promise<MapelFormState> {
  const sekolahId = await requireStaff();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = mapelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  if (d.guruId) {
    const g = await prisma.guru.findFirst({
      where: { id: d.guruId, sekolahId },
      select: { id: true },
    });
    if (!g) return { ok: false, message: "Guru pengampu tidak valid." };
  }

  const data = {
    namaMapel: d.namaMapel,
    kodeMapel: d.kodeMapel,
    kelompok: d.kelompok,
    fase: d.fase,
    kkm: d.kkm,
    noUrut: d.noUrut,
    guruId: d.guruId,
  };

  try {
    if (id) {
      const existing = await prisma.mapel.findFirst({ where: { id, sekolahId }, select: { id: true } });
      if (!existing) return { ok: false, message: "Mapel tidak ditemukan." };
      await prisma.mapel.update({ where: { id }, data });
    } else {
      await prisma.mapel.create({ data: { ...data, sekolahId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Kode mapel sudah dipakai." };
    }
    throw e;
  }

  revalidatePath("/mapel");
  redirect("/mapel");
}

/** Soft deactivate — tidak hard delete */
export async function toggleMapelAktif(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  const m = await prisma.mapel.findFirst({ where: { id, sekolahId }, select: { aktif: true } });
  if (!m) return;
  await prisma.mapel.update({ where: { id }, data: { aktif: !m.aktif } });
  revalidatePath("/mapel");
}

/** Tambah guru ke history mapel */
export async function addGuruMapel(formData: FormData) {
  const sekolahId = await requireStaff();
  const mapelId = Number(formData.get("mapelId"));
  const guruId = Number(formData.get("guruId"));
  const tahunAjaran = String(formData.get("tahunAjaran") ?? "").trim() || null;
  if (!mapelId || !guruId) return;
  const [mapel, guru] = await Promise.all([
    prisma.mapel.findFirst({ where: { id: mapelId, sekolahId }, select: { id: true } }),
    prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } }),
  ]);
  if (!mapel || !guru) return;
  try {
    await prisma.mapelGuru.create({ data: { mapelId, guruId, tahunAjaran, aktif: true } });
  } catch { /* duplikat ok */ }
  revalidatePath(`/mapel/${mapelId}`);
}

export async function deleteMapel(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.mapel.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/mapel");
}
