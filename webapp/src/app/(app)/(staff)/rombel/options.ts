import { prisma } from "@/lib/prisma";

/** Opsi dropdown untuk form rombel (tenant-scoped). */
export async function loadRombelOptions(sekolahId: number) {
  const [ta, tingkat, guru] = await Promise.all([
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
    prisma.tingkat.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" } }),
    prisma.guru.findMany({
      where: { sekolahId },
      orderBy: { namaGuru: "asc" },
      select: { id: true, namaGuru: true },
    }),
  ]);
  return {
    tahunAjaranOptions: ta.map((t) => ({
      id: t.id,
      label: t.tahun + (t.aktif ? " (aktif)" : ""),
    })),
    tingkatOptions: tingkat.map((t) => ({
      id: t.id,
      label: t.nama + (t.fase ? ` · Fase ${t.fase}` : ""),
    })),
    guruOptions: guru.map((g) => ({ id: g.id, label: g.namaGuru })),
  };
}
