import { prisma } from "@/lib/prisma";

export type GuruOption = {
  id: number;
  namaGuru: string;
  jenisKelamin: string;
  jenisJabatan: string | null;
  statusGuru: string | null;
  pangkat: string | null;
  nip: string | null;
  mapelDiampu: { namaMapel: string }[];
  rombelWali: { id: number; nama: string; tahunAjaran: { tahun: string } }[];
  pendidikan: { jenjang: string; jurusan: string | null; tahunLulus: string | null }[];
  _count: { jadwalGuru: number };
};

/** Opsi dropdown untuk form rombel (tenant-scoped). */
export async function loadRombelOptions(sekolahId: number) {
  const [ta, tingkat, guru] = await Promise.all([
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
    prisma.tingkat.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" } }),
    prisma.guru.findMany({
      where: { sekolahId, deletedAt: null },
      orderBy: { namaGuru: "asc" },
      select: {
        id: true,
        namaGuru: true,
        jenisKelamin: true,
        jenisJabatan: true,
        statusGuru: true,
        pangkat: true,
        nip: true,
        mapelDiampu: { select: { namaMapel: true }, take: 6 },
        rombelWali: {
          select: { id: true, nama: true, tahunAjaran: { select: { tahun: true } } },
          orderBy: { tahunAjaranId: "desc" },
          take: 5,
        },
        pendidikan: {
          orderBy: { tahunLulus: "desc" },
          take: 1,
          select: { jenjang: true, jurusan: true, tahunLulus: true },
        },
        _count: { select: { jadwalGuru: true } },
      },
    }),
  ]);

  return {
    tahunAjaranOptions: ta.map((t) => ({
      id: t.id,
      label: t.tahun + (t.aktif ? " (aktif)" : ""),
      aktif: t.aktif,
    })),
    tingkatOptions: tingkat.map((t) => ({
      id: t.id,
      label: t.nama + (t.fase ? ` · Fase ${t.fase}` : ""),
    })),
    guruList: guru,
  };
}
