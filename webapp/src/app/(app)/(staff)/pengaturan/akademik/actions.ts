"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

// ── Tahun Ajaran ────────────────────────────────────────────────────────────

export async function saveTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const tahun = (formData.get("tahun") as string ?? "").trim();
  if (!tahun) return;

  if (id) {
    await prisma.tahunAjaran.updateMany({ where: { id, sekolahId }, data: { tahun } });
  } else {
    await prisma.tahunAjaran.create({ data: { sekolahId, tahun } });
  }
  revalidatePath("/pengaturan/akademik");
}

export async function setTahunAjaranAktif(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.$transaction([
    prisma.tahunAjaran.updateMany({ where: { sekolahId }, data: { aktif: false } }),
    prisma.tahunAjaran.updateMany({ where: { id, sekolahId }, data: { aktif: true } }),
  ]);
  revalidatePath("/pengaturan/akademik");
}

export async function deleteTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  // Cek apakah ada rombel yang pakai TA ini
  const count = await prisma.rombel.count({ where: { tahunAjaranId: id, sekolahId } });
  if (count > 0) return; // jangan hapus kalau sudah dipakai
  await prisma.tahunAjaran.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/pengaturan/akademik");
}

// ── Periode ─────────────────────────────────────────────────────────────────

export async function savePeriode(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  const nama = (formData.get("nama") as string ?? "").trim();
  const urutan = Number(formData.get("urutan")) || 1;
  const tanggalMulaiStr = (formData.get("tanggalMulai") as string ?? "").trim();
  const tanggalSelesaiStr = (formData.get("tanggalSelesai") as string ?? "").trim();

  if (!tahunAjaranId || !nama) return;

  // Verify ownership
  const ta = await prisma.tahunAjaran.findFirst({ where: { id: tahunAjaranId, sekolahId }, select: { id: true } });
  if (!ta) return;

  const data = {
    nama,
    urutan,
    tanggalMulai: tanggalMulaiStr ? new Date(tanggalMulaiStr) : null,
    tanggalSelesai: tanggalSelesaiStr ? new Date(tanggalSelesaiStr) : null,
  };

  if (id) {
    await prisma.periode.updateMany({ where: { id, tahunAjaranId }, data });
  } else {
    await prisma.periode.create({ data: { ...data, tahunAjaranId, jenis: "semester" } });
  }
  revalidatePath("/pengaturan/akademik");
}

export async function setPeriodeAktif(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  if (!id || !tahunAjaranId) return;

  // Verify ownership
  const ta = await prisma.tahunAjaran.findFirst({ where: { id: tahunAjaranId, sekolahId }, select: { id: true } });
  if (!ta) return;

  await prisma.$transaction([
    // Non-aktifkan semua periode di sekolah ini
    prisma.periode.updateMany({
      where: { tahunAjaran: { sekolahId } },
      data: { aktif: false },
    }),
    // Aktifkan yang dipilih
    prisma.periode.updateMany({ where: { id, tahunAjaranId }, data: { aktif: true } }),
    // Aktifkan juga TA-nya
    prisma.tahunAjaran.updateMany({ where: { sekolahId }, data: { aktif: false } }),
    prisma.tahunAjaran.updateMany({ where: { id: tahunAjaranId, sekolahId }, data: { aktif: true } }),
  ]);
  revalidatePath("/pengaturan/akademik");
}

export async function deletePeriode(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  const count = await prisma.nilaiRapor.count({ where: { periodeId: id } });
  if (count > 0) return;
  await prisma.periode.deleteMany({ where: { id, tahunAjaran: { sekolahId } } });
  revalidatePath("/pengaturan/akademik");
}
