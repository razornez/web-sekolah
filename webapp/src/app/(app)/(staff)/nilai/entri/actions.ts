"use server";

import { TipeNilai } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { auditLog } from "@/lib/audit";

export async function saveEntriNilai(formData: FormData) {
  const sekolahId = await requireModule("nilai");
  const user = await getCurrentUser();
  const rombelId = Number(formData.get("rombelId")) || null;
  const periodeId = Number(formData.get("periodeId"));
  const mapelId = Number(formData.get("mapelId"));
  const tipeRaw = String(formData.get("tipe") ?? "harian") as TipeNilai;
  const tanggalRaw = String(formData.get("tanggal") ?? "");
  const tanggal = tanggalRaw ? new Date(tanggalRaw) : new Date();
  if (!periodeId || !mapelId) return;

  // Get guru ID dari user
  const guru = user ? await prisma.guru.findFirst({ where: { userId: user.id, sekolahId }, select: { id: true } }) : null;

  // Get anggota rombel to iterate
  const anggota = rombelId ? await prisma.anggotaRombel.findMany({
    where: { rombelId, rombel: { sekolahId } },
    select: { siswaId: true },
  }) : [];

  let saved = 0;
  for (const a of anggota) {
    const nilaiRaw = String(formData.get(`nilai_${a.siswaId}`) ?? "").trim();
    if (!nilaiRaw) continue;
    const nilai = parseFloat(nilaiRaw);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) continue;
    const keterangan = String(formData.get(`ket_${a.siswaId}`) ?? "").trim() || null;
    await prisma.entriNilai.create({
      data: {
        sekolahId,
        siswaId: a.siswaId,
        mapelId,
        periodeId,
        rombelId,
        guruId: guru?.id ?? null,
        tipe: tipeRaw,
        nilai,
        keterangan,
        tanggal,
      },
    });
    saved++;
  }
  if (saved > 0) await auditLog({ aksi: "create", entitas: "nilai", detail: `Entri ${saved} nilai (mapel #${mapelId}, periode #${periodeId})` });
  revalidatePath("/nilai/entri");
}
