import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { AccountPanel } from "@/components/AccountPanel";
import { FotoUpload } from "@/components/FotoUpload";
import SiswaForm from "../_components/SiswaForm";

export default async function EditSiswaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await getSekolahId();
  const { id } = await params;
  const siswa = await prisma.siswa.findFirst({
    where: { id: Number(id), sekolahId },
    include: { user: { select: { id: true, username: true, isActive: true } } },
  });
  if (!siswa) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Siswa</h1>
        <a href={`/cetak/rapor/${siswa.id}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Cetak Rapor
        </a>
      </div>
      <SiswaForm
        initial={{
          id: siswa.id,
          namaLengkap: siswa.namaLengkap,
          nisn: siswa.nisn,
          nis: siswa.nis,
          nik: siswa.nik,
          jenisKelamin: siswa.jenisKelamin,
          tempatLahir: siswa.tempatLahir,
          tanggalLahir: siswa.tanggalLahir
            ? siswa.tanggalLahir.toISOString().slice(0, 10)
            : null,
          agama: siswa.agama,
          alamat: siswa.alamat,
          noHp: siswa.noHp,
          status: siswa.status,
        }}
      />
      <FotoUpload kind="siswa" ownerId={siswa.id} current={siswa.foto} />
      <AccountPanel
        kind="siswa"
        ownerId={siswa.id}
        account={
          siswa.user
            ? { userId: siswa.user.id, username: siswa.user.username, isActive: siswa.user.isActive }
            : null
        }
      />
    </div>
  );
}
