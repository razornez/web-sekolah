"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createJadwal(formData: FormData) {
  const sekolahId = await requireStaff();
  const guruId = Number(formData.get("guruId"));
  const namaHari = String(formData.get("hari") ?? "");
  if (!guruId || !HARI.includes(namaHari)) return;

  const guru = await prisma.guru.findFirst({ where: { id: guruId, sekolahId }, select: { id: true } });
  if (!guru) return;

  // find-or-create Hari (tanpa perlu seed)
  let hari = await prisma.hari.findFirst({ where: { sekolahId, nama: namaHari }, select: { id: true } });
  if (!hari) {
    hari = await prisma.hari.create({ data: { sekolahId, nama: namaHari, urutan: HARI.indexOf(namaHari) + 1 }, select: { id: true } });
  }

  const rombelId = Number(formData.get("rombelId")) || null;
  await prisma.jadwalGuru.create({
    data: {
      sekolahId,
      guruId,
      hariId: hari.id,
      rombelId,
      mapel: str(formData.get("mapel")),
      jamMulai: str(formData.get("jamMulai")),
      jamSelesai: str(formData.get("jamSelesai")),
    },
  });
  revalidatePath("/jadwal");
}

export async function deleteJadwal(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jadwalGuru.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/jadwal");
}
