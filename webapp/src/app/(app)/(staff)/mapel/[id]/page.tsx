import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import MapelForm from "../_components/MapelForm";

export default async function EditMapelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await getSekolahId();
  const { id } = await params;
  const [mapel, guru] = await Promise.all([
    prisma.mapel.findFirst({ where: { id: Number(id), sekolahId } }),
    prisma.guru.findMany({
      where: { sekolahId },
      orderBy: { namaGuru: "asc" },
      select: { id: true, namaGuru: true },
    }),
  ]);
  if (!mapel) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Mapel</h1>
      <MapelForm
        guruOptions={guru.map((g) => ({ id: g.id, label: g.namaGuru }))}
        initial={{
          id: mapel.id,
          namaMapel: mapel.namaMapel,
          kodeMapel: mapel.kodeMapel,
          kelompok: mapel.kelompok,
          fase: mapel.fase,
          kkm: mapel.kkm,
          noUrut: mapel.noUrut,
          guruId: mapel.guruId,
        }}
      />
    </div>
  );
}
