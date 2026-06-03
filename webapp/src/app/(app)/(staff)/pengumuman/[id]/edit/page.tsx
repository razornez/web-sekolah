import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import PengumumanForm from "../../_components/PengumumanForm";

export default async function EditPengumumanPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("pengumuman");
  const { id } = await params;
  const p = await prisma.pengumuman.findFirst({ where: { id: Number(id), sekolahId } });
  if (!p) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Pengumuman</h1>
        <Link href={`/pengumuman/${p.id}`} className="text-sm text-gray-500 hover:text-gray-900">← Detail</Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <PengumumanForm
          initial={{
            id: p.id,
            judul: p.judul,
            isi: p.isi,
            kategori: p.kategori,
            target: p.target,
            pinned: p.pinned,
          }}
        />
      </div>
    </div>
  );
}
