"use server";

import { Prisma } from "@prisma/client";
import { catchDeleteError } from "@/lib/deleteError";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { rombelSchema } from "@/lib/validations";

export type RombelFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveRombel(
  _prev: RombelFormState,
  formData: FormData,
): Promise<RombelFormState> {
  const sekolahId = await requireModule("rombel");
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = rombelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  // Validasi kepemilikan tenant atas relasi (cegah manipulasi form lintas-sekolah).
  const [ta, tingkat, wali] = await Promise.all([
    prisma.tahunAjaran.findFirst({ where: { id: d.tahunAjaranId, sekolahId }, select: { id: true } }),
    prisma.tingkat.findFirst({ where: { id: d.tingkatId, sekolahId }, select: { id: true } }),
    d.waliGuruId
      ? prisma.guru.findFirst({ where: { id: d.waliGuruId, sekolahId }, select: { id: true } })
      : Promise.resolve(null),
  ]);
  if (!ta) return { ok: false, message: "Tahun ajaran tidak valid." };
  if (!tingkat) return { ok: false, message: "Tingkat tidak valid." };
  if (d.waliGuruId && !wali) return { ok: false, message: "Wali kelas tidak valid." };

  const data = {
    nama: d.nama,
    kodeKelas: d.kodeKelas,
    tahunAjaranId: d.tahunAjaranId,
    tingkatId: d.tingkatId,
    waliGuruId: d.waliGuruId,
  };

  try {
    if (id) {
      const existing = await prisma.rombel.findFirst({ where: { id, sekolahId }, select: { id: true } });
      if (!existing) return { ok: false, message: "Rombel tidak ditemukan." };
      await prisma.rombel.update({ where: { id }, data });
      await auditLog({ aksi: "update", entitas: "rombel", entitasId: id, detail: `Update rombel: ${d.nama}` });
    } else {
      const r = await prisma.rombel.create({ data: { ...data, sekolahId } });
      await auditLog({ aksi: "create", entitas: "rombel", entitasId: r.id, detail: `Tambah rombel: ${d.nama}` });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Nama rombel sudah ada di tahun ajaran tersebut." };
    }
    throw e;
  }

  revalidatePath("/rombel");
  redirect("/rombel");
}

export async function deleteRombel(formData: FormData) {
  const sekolahId = await requireModule("rombel");
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await prisma.rombel.deleteMany({ where: { id, sekolahId } });
    await auditLog({ aksi: "delete", entitas: "rombel", entitasId: id, detail: `Hapus rombel #${id}` });
    revalidatePath("/rombel");
    return { ok: true };
  } catch (e) {
    return catchDeleteError(e, "Rombel");
  }
}

export async function addAnggota(formData: FormData) {
  const sekolahId = await requireModule("rombel");
  const rombelId = Number(formData.get("rombelId"));
  const siswaId = Number(formData.get("siswaId"));
  if (!rombelId || !siswaId) return;

  // Pastikan rombel & siswa milik sekolah yang sama.
  const [rombel, siswa] = await Promise.all([
    prisma.rombel.findFirst({ where: { id: rombelId, sekolahId }, select: { id: true } }),
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
  ]);
  if (!rombel || !siswa) return;

  try {
    await prisma.anggotaRombel.create({ data: { rombelId, siswaId } });
    await auditLog({ aksi: "create", entitas: "rombel", entitasId: rombelId, detail: `Tambah siswa #${siswaId} ke rombel #${rombelId}` });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    // sudah jadi anggota → abaikan
  }
  revalidatePath(`/rombel/${rombelId}`);
}

export async function removeAnggota(formData: FormData) {
  const sekolahId = await requireModule("rombel");
  const anggotaId = Number(formData.get("id"));
  const rombelId = Number(formData.get("rombelId"));
  if (!anggotaId) return;
  // Hapus hanya bila rombel-nya milik sekolah ini.
  await prisma.anggotaRombel.deleteMany({
    where: { id: anggotaId, rombel: { sekolahId } },
  });
  await auditLog({ aksi: "delete", entitas: "rombel", entitasId: rombelId || null, detail: `Hapus anggota #${anggotaId} dari rombel` });
  if (rombelId) revalidatePath(`/rombel/${rombelId}`);
}
