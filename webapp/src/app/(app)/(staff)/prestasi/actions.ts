"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim(); return s === "" ? null : s;
};

export async function savePrestasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id")) || null;
  const siswaId = Number(formData.get("siswaId")) || null;
  if (!siswaId) return;
  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
  if (!siswa) return;
  const data = {
    siswaId,
    namaPrestasi: String(formData.get("namaPrestasi") ?? "").trim() || "Prestasi",
    tingkat: str(formData.get("tingkat")),
    tahun: str(formData.get("tahun")),
    keterangan: str(formData.get("keterangan")),
    tanggal: str(formData.get("tanggal")) ? new Date(String(formData.get("tanggal"))) : null,
  };
  if (id) await prisma.prestasiSiswa.update({ where: { id }, data });
  else await prisma.prestasiSiswa.create({ data });
  revalidatePath("/prestasi");
}

export async function deletePrestasi(formData: FormData) {
  await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.prestasiSiswa.delete({ where: { id } });
  revalidatePath("/prestasi");
}

export async function saveBeasiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id")) || null;
  const siswaId = Number(formData.get("siswaId")) || null;
  if (!siswaId) return;
  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
  if (!siswa) return;
  const data = {
    siswaId,
    nama: String(formData.get("nama") ?? "").trim() || "Beasiswa",
    tahun: str(formData.get("tahun")),
    nominal: Number(formData.get("nominal")) || null,
  };
  if (id) await prisma.beasiswaSiswa.update({ where: { id }, data });
  else await prisma.beasiswaSiswa.create({ data });
  revalidatePath("/prestasi");
}

export async function deleteBeasiswa(formData: FormData) {
  await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.beasiswaSiswa.delete({ where: { id } });
  revalidatePath("/prestasi");
}

export async function saveMutasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id")) || null;
  const siswaId = Number(formData.get("siswaId")) || null;
  if (!siswaId) return;
  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
  if (!siswa) return;
  const data = {
    sekolahId,
    siswaId,
    jenis: String(formData.get("jenis") ?? "keluar"),
    asalTujuan: str(formData.get("asalTujuan")),
    alasan: str(formData.get("alasan")),
    tanggal: str(formData.get("tanggal")) ? new Date(String(formData.get("tanggal"))) : new Date(),
  };
  if (id) await prisma.mutasiSiswa.update({ where: { id }, data: { jenis: data.jenis, asalTujuan: data.asalTujuan, alasan: data.alasan, tanggal: data.tanggal } });
  else await prisma.mutasiSiswa.create({ data });
  revalidatePath("/mutasi");
}

export async function deleteMutasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.mutasiSiswa.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/mutasi");
}
