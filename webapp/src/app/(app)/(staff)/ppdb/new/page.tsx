import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { PendaftarForm } from "../_components/PendaftarForm";

export default async function TambahPendaftarPage() {
  const sekolahId = await requireModule("ppdb");

  const jalurList = await prisma.jalurPpdb.findMany({
    where: { sekolahId },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/ppdb" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          ← Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pendaftar Baru</h1>
          <p className="text-sm text-gray-500">Input data calon peserta didik baru secara manual oleh staf.</p>
        </div>
      </div>
      <PendaftarForm jalurList={jalurList} />
    </div>
  );
}
