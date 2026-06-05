"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { auditLog } from "@/lib/audit";

const STATUS_VALID = ["LULUS", "TIDAK LULUS"];

/** Set status kelulusan batch utk satu rombel. */
export async function saveKelulusan(formData: FormData) {
  const sekolahId = await requireStaff();
  const rombelId = Number(formData.get("rombelId"));
  if (!rombelId) return;

  const rombel = await prisma.rombel.findFirst({
    where: { id: rombelId, sekolahId },
    include: { anggota: { select: { siswaId: true } } },
  });
  if (!rombel) return;

  const ops = rombel.anggota.flatMap((a) => {
    const sid = a.siswaId;
    const status = String(formData.get(`status_${sid}`) ?? "").trim();
    if (!STATUS_VALID.includes(status)) return [];
    return [
      prisma.kelulusan.upsert({
        where: { siswaId: sid },
        update: { status, sekolahId },
        create: { sekolahId, siswaId: sid, status },
      }),
    ];
  });
  if (ops.length) await prisma.$transaction(ops);

  if (ops.length) await auditLog({ aksi: "update", entitas: "kelulusan", entitasId: rombelId, detail: `Set status kelulusan ${ops.length} siswa (rombel #${rombelId})` });
  revalidatePath("/kelulusan");
  redirect(`/kelulusan?rombelId=${rombelId}`);
}

export async function saveSettingKelulusan(formData: FormData) {
  const sekolahId = await requireStaff();
  const aktif = formData.get("aktif") === "on";
  const pengumuman = String(formData.get("pengumuman") ?? "").trim() || null;
  const tglRaw = String(formData.get("tanggalRilis") ?? "").trim();
  const tanggalRilis = tglRaw ? new Date(tglRaw) : null;

  const existing = await prisma.settingKelulusan.findFirst({ where: { sekolahId }, select: { id: true } });
  if (existing) {
    await prisma.settingKelulusan.update({ where: { id: existing.id }, data: { aktif, pengumuman, tanggalRilis } });
  } else {
    await prisma.settingKelulusan.create({ data: { sekolahId, aktif, pengumuman, tanggalRilis } });
  }
  await auditLog({ aksi: "update", entitas: "kelulusan", detail: `Ubah setting kelulusan (aktif: ${aktif})` });
  revalidatePath("/kelulusan");
}
