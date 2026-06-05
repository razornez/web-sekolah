"use server";

import { PengumumanTarget } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { auditLog } from "@/lib/audit";

const TARGETS: PengumumanTarget[] = ["semua", "staf", "siswa", "ortu"];
const KATEGORIS = ["umum", "akademik", "keuangan", "kegiatan", "penting"];

export type PengumumanFormState = { ok: boolean; message?: string };

export async function createPengumuman(
  _prev: PengumumanFormState,
  formData: FormData,
): Promise<PengumumanFormState> {
  const sekolahId = await requireModule("pengumuman");
  const user = await getCurrentUser();
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul wajib diisi." };
  if (!isi || isi === "<p></p>") return { ok: false, message: "Isi pengumuman wajib diisi." };

  const targetRaw = String(formData.get("target") ?? "semua") as PengumumanTarget;
  const target = TARGETS.includes(targetRaw) ? targetRaw : "semua";
  const kategoriRaw = String(formData.get("kategori") ?? "umum");
  const kategori = KATEGORIS.includes(kategoriRaw) ? kategoriRaw : "umum";
  const pinned = formData.get("pinned") === "on";

  const p = await prisma.pengumuman.create({
    data: { sekolahId, judul, isi, target, kategori, pinned, createdById: user.id },
  });
  await auditLog({ aksi: "create", entitas: "pengumuman", entitasId: p.id, detail: `Tambah pengumuman: ${judul}` });
  revalidatePath("/pengumuman");
  redirect("/pengumuman");
}

export async function updatePengumuman(
  _prev: PengumumanFormState,
  formData: FormData,
): Promise<PengumumanFormState> {
  const sekolahId = await requireModule("pengumuman");
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, message: "ID tidak valid." };
  const existing = await prisma.pengumuman.findFirst({ where: { id, sekolahId }, select: { id: true } });
  if (!existing) return { ok: false, message: "Pengumuman tidak ditemukan." };

  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul wajib diisi." };
  if (!isi || isi === "<p></p>") return { ok: false, message: "Isi wajib diisi." };

  const targetRaw = String(formData.get("target") ?? "semua") as PengumumanTarget;
  const target = TARGETS.includes(targetRaw) ? targetRaw : "semua";
  const kategoriRaw = String(formData.get("kategori") ?? "umum");
  const kategori = KATEGORIS.includes(kategoriRaw) ? kategoriRaw : "umum";
  const pinned = formData.get("pinned") === "on";

  await prisma.pengumuman.update({ where: { id }, data: { judul, isi, target, kategori, pinned } });
  await auditLog({ aksi: "update", entitas: "pengumuman", entitasId: id, detail: `Update pengumuman: ${judul}` });
  revalidatePath("/pengumuman");
  revalidatePath(`/pengumuman/${id}`);
  redirect(`/pengumuman/${id}`);
}

export async function deletePengumuman(formData: FormData) {
  const sekolahId = await requireModule("pengumuman");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pengumuman.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "pengumuman", entitasId: id, detail: `Hapus pengumuman #${id}` });
  revalidatePath("/pengumuman");
}

/** Increment view count — dipanggil client-side dari detail page */
export async function incrementView(id: number) {
  try {
    await prisma.pengumuman.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  } catch { /* best-effort */ }
}
