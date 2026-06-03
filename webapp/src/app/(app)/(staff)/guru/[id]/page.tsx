import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { AccountPanel } from "@/components/AccountPanel";
import GuruForm from "../_components/GuruForm";

export default async function EditGuruPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await getSekolahId();
  const { id } = await params;
  const guru = await prisma.guru.findFirst({
    where: { id: Number(id), sekolahId },
    include: { user: { select: { id: true, username: true, isActive: true } } },
  });
  if (!guru) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Guru</h1>
      <GuruForm
        initial={{
          id: guru.id,
          namaGuru: guru.namaGuru,
          nip: guru.nip,
          npk: guru.npk,
          nuptk: guru.nuptk,
          nik: guru.nik,
          jenisKelamin: guru.jenisKelamin,
          tempatLahir: guru.tempatLahir,
          tanggalLahir: guru.tanggalLahir
            ? guru.tanggalLahir.toISOString().slice(0, 10)
            : null,
          alamat: guru.alamat,
          email: guru.email,
          noTelp: guru.noTelp,
          pangkat: guru.pangkat,
          golongan: guru.golongan,
          jenisJabatan: guru.jenisJabatan,
          statusGuru: guru.statusGuru,
        }}
      />
      <AccountPanel
        kind="guru"
        ownerId={guru.id}
        account={
          guru.user
            ? { userId: guru.user.id, username: guru.user.username, isActive: guru.user.isActive }
            : null
        }
      />
    </div>
  );
}
