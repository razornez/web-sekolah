import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import MapelForm from "../_components/MapelForm";
import type { ACOption } from "@/components/AutocompleteSelect";

export default async function NewMapelPage() {
  const sekolahId = await requireModule("mapel");
  const guru = await prisma.guru.findMany({
    where: { sekolahId, deletedAt: null },
    orderBy: { namaGuru: "asc" },
    select: { id: true, namaGuru: true, jenisJabatan: true },
  });
  const guruOptions: ACOption[] = guru.map((g) => ({
    key: g.id, value: g.id, label: g.namaGuru, sub: g.jenisJabatan ?? undefined,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Tambah Mapel</h1>
      <MapelForm guruOptions={guruOptions} />
    </div>
  );
}
