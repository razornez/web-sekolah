"use server";

import { StatusPpdb, JenisDokumenPpdb } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { jalurPpdbSchema } from "@/lib/validations";

// ---- Jalur PPDB ----------------------------------------------------------
export async function createJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const parsed = jalurPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.jalurPpdb.create({ data: { ...parsed.data, sekolahId } });
  revalidatePath("/ppdb/jalur");
}

export async function updateJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const parsed = jalurPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.jalurPpdb.updateMany({ where: { id, sekolahId }, data: parsed.data });
  revalidatePath("/ppdb/jalur");
}

export async function deleteJalur(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jalurPpdb.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/ppdb/jalur");
}

// ---- Pendaftar -----------------------------------------------------------
const VALID: StatusPpdb[] = [
  StatusPpdb.baru,
  StatusPpdb.verifikasi,
  StatusPpdb.tes,
  StatusPpdb.wawancara,
  StatusPpdb.diterima,
  StatusPpdb.cadangan,
  StatusPpdb.ditolak,
];

export async function updateStatusPendaftar(formData: FormData) {
  const sekolahId = await requireStaff();
  const user = await getCurrentUser();
  const id = Number(formData.get("id"));
  const raw = String(formData.get("status") ?? "") as StatusPpdb;
  const catatan = (formData.get("catatan") as string | null)?.trim() ?? null;
  if (!id || !VALID.includes(raw)) return;

  const existing = await prisma.pendaftaranPpdb.findFirst({ where: { id, sekolahId }, select: { status: true } });
  if (!existing) return;

  await prisma.$transaction([
    prisma.pendaftaranPpdb.updateMany({ where: { id, sekolahId }, data: { status: raw, catatan: catatan ?? undefined } }),
    prisma.riwayatStatusPpdb.create({
      data: { pendaftaranId: id, status: raw, catatan, oleh: user?.email ?? null },
    }),
  ]);
  revalidatePath("/ppdb");
  revalidatePath(`/ppdb/${id}`);
}

export async function softDeletePendaftar(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pendaftaranPpdb.updateMany({ where: { id, sekolahId }, data: { deletedAt: new Date() } });
  revalidatePath("/ppdb");
}

export async function restorePendaftar(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pendaftaranPpdb.updateMany({ where: { id, sekolahId }, data: { deletedAt: null } });
  revalidatePath("/ppdb");
  revalidatePath(`/ppdb/${id}`);
}

// ---- Dokumen PPDB --------------------------------------------------------
const VALID_JENIS: JenisDokumenPpdb[] = [
  "ijazah","rapor","prestasi","kwitansi","ktp_ortu","kartu_keluarga","foto","surat_keterangan","lainnya"
];

export async function addDokumen(formData: FormData) {
  const sekolahId = await requireStaff();
  const pendaftaranId = Number(formData.get("pendaftaranId"));
  const jenis = (formData.get("jenis") as JenisDokumenPpdb | null) ?? "lainnya";
  const nama = (formData.get("nama") as string | null)?.trim() ?? "";
  const url = (formData.get("url") as string | null)?.trim() || null;
  const keterangan = (formData.get("keterangan") as string | null)?.trim() || null;

  if (!pendaftaranId || !nama) return;
  if (!VALID_JENIS.includes(jenis)) return;

  const existing = await prisma.pendaftaranPpdb.findFirst({ where: { id: pendaftaranId, sekolahId }, select: { id: true } });
  if (!existing) return;

  await prisma.dokumenPpdb.create({ data: { sekolahId, pendaftaranId, jenis, nama, url, keterangan } });
  revalidatePath(`/ppdb/${pendaftaranId}`);
}

export async function deleteDokumen(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const pendaftaranId = Number(formData.get("pendaftaranId"));
  if (!id) return;
  await prisma.dokumenPpdb.deleteMany({ where: { id, sekolahId } });
  revalidatePath(`/ppdb/${pendaftaranId}`);
}
