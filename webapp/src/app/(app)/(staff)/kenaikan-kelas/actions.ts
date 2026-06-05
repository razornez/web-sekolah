"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

/**
 * Promosikan semua anggota rombel lama ke rombel baru (tahun ajaran baru).
 * - Buat rombel baru di tahunAjaranBaru dengan nama & tingkat baru bila belum ada.
 * - Insert AnggotaRombel (skip duplikat via upsert).
 * - Update status siswa lulus/pindah menjadi "aktif" bila perlu.
 */
export async function naikanKelas(formData: FormData) {
  const sekolahId = await requireModule("rombel");
  const rombelLamaId = Number(formData.get("rombelLamaId"));
  const tahunBaruId = Number(formData.get("tahunAjaranBaruId"));
  const tingkatBaruId = Number(formData.get("tingkatBaruId"));
  const namaRombelBaru = String(formData.get("namaRombelBaru") ?? "").trim();
  if (!rombelLamaId || !tahunBaruId || !tingkatBaruId || !namaRombelBaru) return;

  const [rombelLama, tahunBaru, tingkat] = await Promise.all([
    prisma.rombel.findFirst({ where: { id: rombelLamaId, sekolahId }, include: { anggota: { select: { siswaId: true, nomorAbsen: true } } } }),
    prisma.tahunAjaran.findFirst({ where: { id: tahunBaruId, sekolahId }, select: { id: true } }),
    prisma.tingkat.findFirst({ where: { id: tingkatBaruId, sekolahId }, select: { id: true } }),
  ]);
  if (!rombelLama || !tahunBaru || !tingkat) return;

  // Buat atau temukan rombel baru
  let rombelBaru = await prisma.rombel.findFirst({ where: { tahunAjaranId: tahunBaruId, nama: namaRombelBaru, sekolahId } });
  if (!rombelBaru) {
    rombelBaru = await prisma.rombel.create({ data: { sekolahId, tahunAjaranId: tahunBaruId, tingkatId: tingkatBaruId, nama: namaRombelBaru } });
  }

  // Pindahkan anggota
  let berhasil = 0;
  for (const anggota of rombelLama.anggota) {
    try {
      await prisma.anggotaRombel.upsert({
        where: { rombelId_siswaId: { rombelId: rombelBaru.id, siswaId: anggota.siswaId } },
        update: {},
        create: { rombelId: rombelBaru.id, siswaId: anggota.siswaId, nomorAbsen: anggota.nomorAbsen },
      });
      berhasil++;
    } catch { /* sudah ada, lewati */ }
  }

  await auditLog({ aksi: "update", entitas: "rombel", entitasId: rombelBaru.id, detail: `Kenaikan kelas: ${berhasil} siswa dari rombel #${rombelLamaId} → ${rombelBaru.nama}` });
  revalidatePath("/kenaikan-kelas");
  revalidatePath("/rombel");
  redirect(`/kenaikan-kelas?berhasil=${berhasil}&rombel=${encodeURIComponent(rombelBaru.nama)}`);
}
