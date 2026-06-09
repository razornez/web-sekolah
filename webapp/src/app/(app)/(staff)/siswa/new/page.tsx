import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FormWizard } from "../_revamp/FormWizard";

export default async function NewSiswaPage() {
  const sekolahId = await requireModule("siswa");
  const [rombelRows, sekolah] = await Promise.all([
    prisma.rombel.findMany({
      where: { sekolahId },
      select: { id: true, nama: true, tahunAjaran: { select: { tahun: true, aktif: true } }, tingkat: { select: { urutan: true } } },
      orderBy: [{ tahunAjaran: { aktif: "desc" } }, { tingkat: { urutan: "asc" } }, { nama: "asc" }],
    }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true } }),
  ]);
  const rombels = rombelRows.map((r) => ({ id: r.id, nama: r.nama, tahun: r.tahunAjaran?.tahun ?? "" }));
  return <FormWizard rombels={rombels} sekolah={sekolah?.nama ?? "Sekolah"} />;
}
