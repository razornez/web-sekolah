"use server";

import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { StatusPpdb, JenisDokumenPpdb } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { jalurPpdbSchema, pendaftaranPpdbSchema } from "@/lib/validations";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg","image/png","image/webp","image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
export type PendaftarFormState = { ok: boolean; message?: string; errors?: Record<string, string[] | undefined> };

export async function createPendaftar(
  _prev: PendaftarFormState,
  formData: FormData,
): Promise<PendaftarFormState> {
  const sekolahId = await requireStaff();
  const parsed = pendaftaranPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const { tanggalLahir, ...rest } = parsed.data;
  const pendaftaran = await prisma.pendaftaranPpdb.create({
    data: {
      ...rest,
      sekolahId,
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
      status: "baru",
    },
  });

  // Catat status awal ke riwayat
  await prisma.riwayatStatusPpdb.create({
    data: { pendaftaranId: pendaftaran.id, status: "baru", catatan: "Pendaftar baru ditambahkan oleh staf" },
  });

  revalidatePath("/ppdb");
  return { ok: true, message: String(pendaftaran.id) };
}
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
  const keterangan = (formData.get("keterangan") as string | null)?.trim() || null;
  const urlManual = (formData.get("url") as string | null)?.trim() || null;
  const file = formData.get("file") as File | null;

  if (!pendaftaranId) return;
  if (!VALID_JENIS.includes(jenis)) return;

  const existing = await prisma.pendaftaranPpdb.findFirst({ where: { id: pendaftaranId, sekolahId }, select: { id: true } });
  if (!existing) return;

  let url = urlManual;
  let nama = (formData.get("nama") as string | null)?.trim() || "";

  // Handle file upload
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) return; // 10MB limit
    if (!ALLOWED_TYPES.includes(file.type)) return;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "ppdb", String(sekolahId), String(pendaftaranId));
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || "";
    const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await writeFile(path.join(uploadDir, slug), Buffer.from(await file.arrayBuffer()));

    url = `/uploads/ppdb/${sekolahId}/${pendaftaranId}/${slug}`;
    if (!nama) nama = file.name; // auto-fill nama dari filename
  }

  if (!nama) return;

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
