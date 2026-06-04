"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim(); return s === "" ? null : s;
};

// ── PRESTASI MASTER ────────────────────────────────────────────────────────
export async function createPrestasiMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const nama = String(formData.get("nama") ?? "").trim();
  if (!nama) return;
  await prisma.prestasiMaster.create({
    data: {
      sekolahId, nama,
      tingkat: str(formData.get("tingkat")) ?? "Sekolah",
      kategori: str(formData.get("kategori")) ?? "Akademik",
      penyelenggara: str(formData.get("penyelenggara")),
      tahun: str(formData.get("tahun")),
      keterangan: str(formData.get("keterangan")),
    },
  });
  revalidatePath("/prestasi");
}

export async function updatePrestasiMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.prestasiMaster.updateMany({
    where: { id, sekolahId },
    data: {
      nama: String(formData.get("nama") ?? "").trim() || "Prestasi",
      tingkat: str(formData.get("tingkat")) ?? "Sekolah",
      kategori: str(formData.get("kategori")) ?? "Akademik",
      penyelenggara: str(formData.get("penyelenggara")),
      tahun: str(formData.get("tahun")),
      keterangan: str(formData.get("keterangan")),
    },
  });
  revalidatePath("/prestasi");
  revalidatePath(`/prestasi/${id}`);
}

export async function deletePrestasiMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  await prisma.prestasiMaster.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/prestasi");
}

// ── PENERIMA PRESTASI ──────────────────────────────────────────────────────
export async function addPenerimaPrestasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const prestasiId = Number(formData.get("prestasiId"));
  const siswaId = Number(formData.get("siswaId"));
  if (!prestasiId || !siswaId) return;
  const [prest, siswa] = await Promise.all([
    prisma.prestasiMaster.findFirst({ where: { id: prestasiId, sekolahId }, select: { id: true } }),
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
  ]);
  if (!prest || !siswa) return;
  try {
    await prisma.penerimaPrestasi.create({
      data: { prestasiId, siswaId, tahun: str(formData.get("tahun")), keterangan: str(formData.get("keterangan")) },
    });
  } catch { /* duplikat — abaikan */ }
  revalidatePath(`/prestasi/${prestasiId}`);
}

export async function removePenerimaPrestasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  const prestasiId = Number(formData.get("prestasiId"));
  if (!id) return;
  await prisma.penerimaPrestasi.deleteMany({ where: { id, prestasi: { sekolahId } } });
  revalidatePath(`/prestasi/${prestasiId}`);
}

// ── BEASISWA MASTER ────────────────────────────────────────────────────────
export async function createBeasiswaMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const nama = String(formData.get("nama") ?? "").trim();
  if (!nama) return;
  await prisma.beasiswaMaster.create({
    data: {
      sekolahId, nama,
      penyelenggara: str(formData.get("penyelenggara")),
      kategori: str(formData.get("kategori")) ?? "Pemerintah",
      nominal: Number(formData.get("nominal")) || null,
      keterangan: str(formData.get("keterangan")),
    },
  });
  revalidatePath("/prestasi?tab=beasiswa");
}

export async function updateBeasiswaMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.beasiswaMaster.updateMany({
    where: { id, sekolahId },
    data: {
      nama: String(formData.get("nama") ?? "").trim() || "Beasiswa",
      penyelenggara: str(formData.get("penyelenggara")),
      kategori: str(formData.get("kategori")) ?? "Pemerintah",
      nominal: Number(formData.get("nominal")) || null,
      keterangan: str(formData.get("keterangan")),
    },
  });
  revalidatePath("/prestasi?tab=beasiswa");
  revalidatePath(`/prestasi/beasiswa/${id}`);
}

export async function deleteBeasiswaMaster(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  await prisma.beasiswaMaster.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/prestasi?tab=beasiswa");
}

// ── MUTASI SISWA (dipakai dari /mutasi) ────────────────────────────────────
export async function saveMutasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const user = await getCurrentUser();
  const siswaId = Number(formData.get("siswaId")) || null;
  if (siswaId) {
    const exists = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } });
    if (!exists) return;
  }
  const tanggalRaw = str(formData.get("tanggal"));
  await prisma.mutasiSiswa.create({
    data: {
      sekolahId,
      siswaId,
      jenis: String(formData.get("jenis") ?? "keluar"),
      asalSekolah: str(formData.get("asalSekolah")),
      tujuanSekolah: str(formData.get("tujuanSekolah")),
      alasan: str(formData.get("alasan")),
      tanggal: tanggalRaw ? new Date(tanggalRaw) : new Date(),
      createdById: user.id,
    },
  });
  revalidatePath("/mutasi");
}

export async function deleteMutasi(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.mutasiSiswa.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/mutasi");
}

export async function addPenerimaBeasiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const beasiswaId = Number(formData.get("beasiswaId"));
  const siswaId = Number(formData.get("siswaId"));
  if (!beasiswaId || !siswaId) return;
  const [bsw, siswa] = await Promise.all([
    prisma.beasiswaMaster.findFirst({ where: { id: beasiswaId, sekolahId }, select: { id: true } }),
    prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true } }),
  ]);
  if (!bsw || !siswa) return;
  try {
    await prisma.penerimaBeasiswa.create({
      data: { beasiswaId, siswaId, tahun: str(formData.get("tahun")), nominal: Number(formData.get("nominal")) || null },
    });
  } catch { /* duplikat */ }
  revalidatePath(`/prestasi/beasiswa/${beasiswaId}`);
}

export async function removePenerimaBeasiswa(formData: FormData) {
  const sekolahId = await requireModule("siswa");
  const id = Number(formData.get("id"));
  const beasiswaId = Number(formData.get("beasiswaId"));
  if (!id) return;
  await prisma.penerimaBeasiswa.deleteMany({ where: { id, beasiswa: { sekolahId } } });
  revalidatePath(`/prestasi/beasiswa/${beasiswaId}`);
}
