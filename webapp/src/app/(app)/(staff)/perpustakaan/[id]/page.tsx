import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import BukuForm from "../_components/BukuForm";

export default async function EditBukuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireStaff();
  const { id } = await params;
  const buku = await prisma.bukuPerpustakaan.findFirst({
    where: { id: Number(id), sekolahId },
  });
  if (!buku) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Buku</h1>
      <BukuForm
        initial={{
          id: buku.id,
          judul: buku.judul,
          pengarang: buku.pengarang,
          penerbit: buku.penerbit,
          tahunTerbit: buku.tahunTerbit,
          isbn: buku.isbn,
          jumlahBuku: buku.jumlahBuku,
          jumlahEksemplar: buku.jumlahEksemplar,
        }}
      />
    </div>
  );
}
