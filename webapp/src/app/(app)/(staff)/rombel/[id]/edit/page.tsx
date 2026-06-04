import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import RombelForm from "../../_components/RombelForm";
import { loadRombelOptions } from "../../options";

export default async function EditRombelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireModule("rombel");
  const { id } = await params;
  const [rombel, opts] = await Promise.all([
    prisma.rombel.findFirst({ where: { id: Number(id), sekolahId } }),
    loadRombelOptions(sekolahId),
  ]);
  if (!rombel) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Rombel</h1>
      <RombelForm
        {...opts}
        initial={{
          id: rombel.id,
          nama: rombel.nama,
          kodeKelas: rombel.kodeKelas,
          tahunAjaranId: rombel.tahunAjaranId,
          tingkatId: rombel.tingkatId,
          waliGuruId: rombel.waliGuruId,
        }}
      />
    </div>
  );
}
