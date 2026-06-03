import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { AccountPanel } from "@/components/AccountPanel";
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
      <h1 className="text-2xl font-semibold text-gray-900">Edit Siswa</h1>
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
