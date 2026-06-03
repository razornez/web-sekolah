"use server";

import { TipeSoal, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { recomputeSkor } from "@/lib/ujian";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
};

export async function createUjian(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return;
  const rombelId = Number(formData.get("rombelId")) || null;
  if (rombelId) {
    const r = await prisma.rombel.findFirst({ where: { id: rombelId, sekolahId }, select: { id: true } });
    if (!r) return;
  }
  const u = await prisma.ujian.create({
    data: {
      sekolahId,
      judul,
      mapel: str(formData.get("mapel")),
      rombelId,
      durasiMenit: Number(formData.get("durasiMenit")) || null,
      deskripsi: str(formData.get("deskripsi")),
    },
  });
  redirect(`/ujian/${u.id}`);
}

export async function updateUjian(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const id = Number(formData.get("id"));
  if (!id) return;
  const rombelId = Number(formData.get("rombelId")) || null;
  await prisma.ujian.updateMany({
    where: { id, sekolahId },
    data: {
      judul: String(formData.get("judul") ?? "").trim() || "Ujian",
      mapel: str(formData.get("mapel")),
      rombelId,
      durasiMenit: Number(formData.get("durasiMenit")) || null,
      deskripsi: str(formData.get("deskripsi")),
      acakSoal: formData.get("acakSoal") === "on",
      aktif: formData.get("aktif") === "on",
      mulai: dt(formData.get("mulai")),
      selesai: dt(formData.get("selesai")),
    },
  });
  revalidatePath(`/ujian/${id}`);
}

export async function deleteUjian(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.ujian.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/ujian");
}

export async function addSoal(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const ujianId = Number(formData.get("ujianId"));
  const pertanyaan = String(formData.get("pertanyaan") ?? "").trim();
  if (!ujianId || !pertanyaan) return;
  const ujian = await prisma.ujian.findFirst({ where: { id: ujianId, sekolahId }, select: { id: true } });
  if (!ujian) return;

  const tipe = formData.get("tipe") === "esai" ? TipeSoal.esai : TipeSoal.pilihan_ganda;
  let opsi: Prisma.InputJsonValue | undefined;
  let kunci: string | null = null;
  if (tipe === TipeSoal.pilihan_ganda) {
    const labels = ["A", "B", "C", "D", "E"];
    const arr = labels
      .map((label) => ({ label, teks: str(formData.get(`opsi${label}`)) }))
      .filter((o) => o.teks)
      .map((o) => ({ label: o.label, teks: o.teks as string }));
    opsi = arr;
    kunci = str(formData.get("kunci"));
  }
  const count = await prisma.soal.count({ where: { ujianId } });
  await prisma.soal.create({
    data: {
      ujianId,
      nomor: count + 1,
      pertanyaan,
      tipe,
      opsi,
      kunci,
      bobot: Number(formData.get("bobot")) || 1,
    },
  });
  revalidatePath(`/ujian/${ujianId}`);
}

export async function deleteSoal(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const id = Number(formData.get("id"));
  const ujianId = Number(formData.get("ujianId"));
  if (!id) return;
  await prisma.soal.deleteMany({ where: { id, ujian: { sekolahId } } });
  revalidatePath(`/ujian/${ujianId}`);
}

export async function nilaiEsai(formData: FormData) {
  const sekolahId = await requireModule("ujian");
  const jawabanId = Number(formData.get("jawabanId"));
  const hasilId = Number(formData.get("hasilId"));
  if (!jawabanId || !hasilId) return;
  const nilai = Number(formData.get("nilai"));
  // pastikan jawaban milik ujian di sekolah ini
  const jwb = await prisma.jawabanUjian.findFirst({
    where: { id: jawabanId, hasil: { ujian: { sekolahId } } },
    select: { id: true },
  });
  if (!jwb) return;
  await prisma.jawabanUjian.update({
    where: { id: jawabanId },
    data: { nilai: Number.isNaN(nilai) ? null : nilai },
  });
  await recomputeSkor(hasilId);
  revalidatePath(`/ujian`);
}
