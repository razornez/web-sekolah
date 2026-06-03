"use server";

import { Kurikulum } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";

const num = (v: FormDataEntryValue | null): number | null => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? null : n;
};
const str = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

/** Simpan nilai satu rombel × periode × mapel sekaligus (batch). */
export async function saveNilai(formData: FormData) {
  const sekolahId = await getSekolahId();
  const rombelId = Number(formData.get("rombelId"));
  const periodeId = Number(formData.get("periodeId"));
  const mapelId = Number(formData.get("mapelId"));
  const kurikulum: Kurikulum =
    formData.get("kurikulum") === "K13" ? Kurikulum.K13 : Kurikulum.MERDEKA;
  if (!rombelId || !periodeId || !mapelId) return;

  // Validasi kepemilikan tenant + ambil anggota dari DB (jangan percaya input klien).
  const [rombel, periode, mapel] = await Promise.all([
    prisma.rombel.findFirst({
      where: { id: rombelId, sekolahId },
      include: { anggota: { select: { siswaId: true } } },
    }),
    prisma.periode.findFirst({
      where: { id: periodeId, tahunAjaran: { sekolahId } },
      select: { id: true },
    }),
    prisma.mapel.findFirst({
      where: { id: mapelId, sekolahId },
      select: { id: true, kkm: true },
    }),
  ]);
  if (!rombel || !periode || !mapel) return;

  await prisma.$transaction(
    rombel.anggota.map((a) => {
      const sid = a.siswaId;
      const fields =
        kurikulum === Kurikulum.K13
          ? {
              nilaiPengetahuan: num(formData.get(`peng_${sid}`)),
              nilaiKeterampilan: num(formData.get(`ket_${sid}`)),
              nilaiAkhir: null,
              deskripsiCapaian: null,
            }
          : {
              nilaiAkhir: num(formData.get(`akhir_${sid}`)),
              deskripsiCapaian: str(formData.get(`desk_${sid}`)),
              nilaiPengetahuan: null,
              nilaiKeterampilan: null,
            };
      return prisma.nilaiRapor.upsert({
        where: {
          siswaId_mapelId_periodeId: { siswaId: sid, mapelId, periodeId },
        },
        update: { kurikulum, kkm: mapel.kkm, ...fields },
        create: {
          sekolahId,
          siswaId: sid,
          mapelId,
          periodeId,
          rombelId,
          kurikulum,
          kkm: mapel.kkm,
          ...fields,
        },
      });
    }),
  );

  revalidatePath("/nilai");
  redirect(
    `/nilai?rombelId=${rombelId}&periodeId=${periodeId}&mapelId=${mapelId}&kurikulum=${kurikulum}`,
  );
}
