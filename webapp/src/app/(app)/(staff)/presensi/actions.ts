"use server";

import { StatusPresensi } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const VALID: StatusPresensi[] = [
  StatusPresensi.hadir,
  StatusPresensi.izin,
  StatusPresensi.sakit,
  StatusPresensi.alpa,
  StatusPresensi.terlambat,
];

/** Simpan presensi satu rombel pada satu tanggal (batch upsert per siswa). */
export async function savePresensi(formData: FormData) {
  const sekolahId = await requireStaff();
  const rombelId = Number(formData.get("rombelId"));
  const tanggalStr = String(formData.get("tanggal") ?? "");
  if (!rombelId || !tanggalStr) return;
  const tanggal = new Date(tanggalStr);
  if (Number.isNaN(tanggal.getTime())) return;

  const rombel = await prisma.rombel.findFirst({
    where: { id: rombelId, sekolahId },
    include: { anggota: { select: { siswaId: true } } },
  });
  if (!rombel) return;

  await prisma.$transaction(
    rombel.anggota.map((a) => {
      const sid = a.siswaId;
      const raw = String(formData.get(`status_${sid}`) ?? "hadir") as StatusPresensi;
      const status = VALID.includes(raw) ? raw : StatusPresensi.hadir;
      const ket = String(formData.get(`ket_${sid}`) ?? "").trim() || null;
      return prisma.kehadiranSiswa.upsert({
        where: { siswaId_tanggal: { siswaId: sid, tanggal } },
        update: { status, keterangan: ket },
        create: { sekolahId, siswaId: sid, tanggal, status, keterangan: ket },
      });
    }),
  );

  revalidatePath("/presensi");
  redirect(`/presensi?rombelId=${rombelId}&tanggal=${tanggalStr}`);
}
