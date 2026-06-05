"use server";

import { StatusPresensi } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";

const VALID: StatusPresensi[] = [
  StatusPresensi.hadir, StatusPresensi.izin, StatusPresensi.sakit,
  StatusPresensi.alpa, StatusPresensi.terlambat,
];

/** Batch upsert presensi satu rombel (form lama). */
export async function savePresensi(formData: FormData) {
  const sekolahId = await requireStaff();
  const rombelId = Number(formData.get("rombelId"));
  const tanggalStr = String(formData.get("tanggal") ?? "");
  if (!rombelId || !tanggalStr) return;
  const tanggal = new Date(tanggalStr);
  if (isNaN(tanggal.getTime())) return;

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
  await auditLog({ aksi: "update", entitas: "presensi", entitasId: rombelId, detail: `Simpan presensi rombel #${rombelId} (${tanggalStr})` });
  revalidatePath("/presensi");
  revalidatePath("/presensi/input");
}

/** Tandai satu siswa hadir pada tanggal tertentu (klik dot kuning). */
export async function markSiswaHadir(siswaId: number, tanggalStr: string): Promise<void> {
  const sekolahId = await requireStaff();
  const tanggal = new Date(tanggalStr);
  if (isNaN(tanggal.getTime())) return;

  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
  if (!siswa) return;

  await prisma.kehadiranSiswa.upsert({
    where: { siswaId_tanggal: { siswaId, tanggal } },
    update: { status: "hadir" },
    create: { sekolahId, siswaId, tanggal, status: "hadir" },
  });
  await auditLog({ aksi: "update", entitas: "presensi", entitasId: siswaId, detail: `Tandai hadir siswa #${siswaId} (${tanggalStr})` });
  revalidatePath("/presensi");
}

/** Set status kehadiran siswa ke nilai tertentu. */
export async function setSiswaStatus(
  siswaId: number, tanggalStr: string, status: StatusPresensi,
): Promise<void> {
  const sekolahId = await requireStaff();
  const tanggal = new Date(tanggalStr);
  if (isNaN(tanggal.getTime()) || !VALID.includes(status)) return;

  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
  if (!siswa) return;

  await prisma.kehadiranSiswa.upsert({
    where: { siswaId_tanggal: { siswaId, tanggal } },
    update: { status },
    create: { sekolahId, siswaId, tanggal, status },
  });
  await auditLog({ aksi: "update", entitas: "presensi", entitasId: siswaId, detail: `Set presensi siswa #${siswaId} → ${status} (${tanggalStr})` });
  revalidatePath("/presensi");
}
