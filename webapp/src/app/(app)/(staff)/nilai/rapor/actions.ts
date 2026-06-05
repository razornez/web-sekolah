"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function saveRaporCatatan(formData: FormData) {
  const sekolahId = await requireModule("nilai");
  const siswaId = Number(formData.get("siswaId"));
  const periodeId = Number(formData.get("periodeId"));
  if (!siswaId || !periodeId) return;

  const [siswa, periode] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
    prisma.periode.findFirst({ where: { id: periodeId, tahunAjaran: { sekolahId } }, select: { id: true } }),
  ]);
  if (!siswa || !periode) return;

  const data = { catatan: str(formData.get("catatan")), sikap: str(formData.get("sikap")) };
  await prisma.raporCatatan.upsert({
    where: { siswaId_periodeId: { siswaId, periodeId } },
    update: data,
    create: { sekolahId, siswaId, periodeId, ...data },
  });
  await auditLog({ aksi: "update", entitas: "nilai", entitasId: siswaId, detail: `Catatan rapor siswa #${siswaId} periode #${periodeId}` });
  revalidatePath(`/nilai/rapor/${siswaId}`);
}

export async function addEkstra(formData: FormData) {
  const sekolahId = await requireModule("nilai");
  const siswaId = Number(formData.get("siswaId"));
  const periodeId = Number(formData.get("periodeId"));
  const namaEkstra = String(formData.get("namaEkstra") ?? "").trim();
  if (!siswaId || !periodeId || !namaEkstra) return;

  const [siswa, periode] = await Promise.all([
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
    prisma.periode.findFirst({ where: { id: periodeId, tahunAjaran: { sekolahId } }, select: { id: true } }),
  ]);
  if (!siswa || !periode) return;

  await prisma.nilaiRaporEkstra.create({
    data: {
      siswaId,
      periodeId,
      namaEkstra,
      nilai: str(formData.get("predikat")), // predikat: Sangat Baik/Baik/Cukup/Kurang
      deskripsi: str(formData.get("deskripsi")),
    },
  });
  await auditLog({ aksi: "create", entitas: "nilai", entitasId: siswaId, detail: `Tambah ekstra rapor: ${namaEkstra} (siswa #${siswaId})` });
  revalidatePath(`/nilai/rapor/${siswaId}`);
}

export async function deleteEkstra(formData: FormData) {
  const sekolahId = await requireModule("nilai");
  const id = Number(formData.get("id"));
  const siswaId = Number(formData.get("siswaId"));
  if (!id) return;
  await prisma.nilaiRaporEkstra.deleteMany({ where: { id, siswa: { sekolahId } } });
  await auditLog({ aksi: "delete", entitas: "nilai", entitasId: id, detail: `Hapus ekstra rapor #${id} (siswa #${siswaId})` });
  revalidatePath(`/nilai/rapor/${siswaId}`);
}
