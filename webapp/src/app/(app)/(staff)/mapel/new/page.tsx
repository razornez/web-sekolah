import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import MapelForm from "../_components/MapelForm";

export default async function NewMapelPage() {
  const sekolahId = await getSekolahId();
  const guru = await prisma.guru.findMany({
    where: { sekolahId },
    orderBy: { namaGuru: "asc" },
    select: { id: true, namaGuru: true },
  });
  const guruOptions = guru.map((g) => ({ id: g.id, label: g.namaGuru }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Tambah Mapel</h1>
      <MapelForm guruOptions={guruOptions} />
    </div>
  );
}
