"use server";

import { Prisma, JenisKelamin } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export type SiswaFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const num = (v: FormDataEntryValue | null) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? null : n;
};

export async function saveSiswa(
  _prev: SiswaFormState,
  formData: FormData,
): Promise<SiswaFormState> {
  const sekolahId = await requireStaff();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const namaLengkap = String(formData.get("namaLengkap") ?? "").trim();
  if (!namaLengkap) return { ok: false, errors: { namaLengkap: ["Nama lengkap wajib diisi"] } };

  const jkRaw = str(formData.get("jenisKelamin"));
  const jenisKelamin = jkRaw === "L" ? JenisKelamin.L : jkRaw === "P" ? JenisKelamin.P : null;

  const data = {
    namaLengkap,
    nisn: str(formData.get("nisn")),
    nis: str(formData.get("nis")),
    nik: str(formData.get("nik")),
    noInduk: str(formData.get("noInduk")),
    jenisKelamin,
    tempatLahir: str(formData.get("tempatLahir")),
    tanggalLahir: str(formData.get("tanggalLahir")) ? new Date(String(formData.get("tanggalLahir"))) : null,
    agama: str(formData.get("agama")),
    hobi: str(formData.get("hobi")),
    citaCita: str(formData.get("citaCita")),
    anakKe: num(formData.get("anakKe")),
    tahunMasuk: num(formData.get("tahunMasuk")),
    status: (str(formData.get("status")) ?? "aktif") as "aktif" | "lulus" | "pindah" | "keluar" | "alumni",
    asalSekolah: str(formData.get("asalSekolah")),
    // Alamat
    alamat: str(formData.get("alamat")),
    desaKel: str(formData.get("desaKel")),
    kecamatan: str(formData.get("kecamatan")),
    kabupaten: str(formData.get("kabupaten")),
    kodePos: str(formData.get("kodePos")),
    noHp: str(formData.get("noHp")),
    tinggalDengan: str(formData.get("tinggalDengan")),
    transportasi: str(formData.get("transportasi")),
    // Kesehatan
    tinggiBadan: str(formData.get("tinggiBadan")),
    beratBadan: str(formData.get("beratBadan")),
    golonganDarah: str(formData.get("golonganDarah")),
    kebutuhanKhusus: str(formData.get("kebutuhanKhusus")),
  };

  try {
    if (id) {
      const existing = await prisma.siswa.findFirst({ where: { id, sekolahId, deletedAt: null }, select: { id: true } });
      if (!existing) return { ok: false, message: "Data siswa tidak ditemukan." };
      await prisma.siswa.update({ where: { id }, data });
      await auditLog({ aksi: "update", entitas: "siswa", entitasId: id, detail: `Update siswa: ${namaLengkap}` });
    } else {
      const s = await prisma.siswa.create({ data: { ...data, sekolahId } });
      await auditLog({ aksi: "create", entitas: "siswa", entitasId: s.id, detail: `Buat siswa: ${namaLengkap}` });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "NISN sudah dipakai siswa lain." };
    }
    throw e;
  }

  revalidatePath("/siswa");
  redirect("/siswa");
}

/** Soft delete: set deletedAt = now(). Data relasi tetap terjaga. */
export async function softDeleteSiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.siswa.updateMany({ where: { id, sekolahId, deletedAt: null }, data: { deletedAt: new Date() } });
  await auditLog({ aksi: "delete", entitas: "siswa", entitasId: id, detail: `Arsipkan (soft delete) siswa id: ${id}` });
  revalidatePath("/siswa");
  redirect("/siswa");
}

/** Hard delete: hanya admin. Hapus permanen beserta semua relasi (cascade). */
export async function hardDeleteSiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  const confirm = String(formData.get("confirm") ?? "");
  if (!id || confirm !== "HAPUS") return;
  await prisma.siswa.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "siswa", entitasId: id, detail: `Hapus PERMANEN siswa id: ${id}` });
  revalidatePath("/siswa");
  redirect("/siswa");
}

/** Restore soft-deleted student */
export async function restoreSiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.siswa.updateMany({ where: { id, sekolahId }, data: { deletedAt: null } });
  await auditLog({ aksi: "update", entitas: "siswa", entitasId: id, detail: `Restore siswa id: ${id}` });
  revalidatePath("/siswa/arsip");
  revalidatePath("/siswa");
}
