import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { AccountPanel } from "@/components/AccountPanel";
import { FotoUpload } from "@/components/FotoUpload";
import SiswaForm from "../../_components/SiswaForm";

export default async function EditSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const t = await getTranslations("siswa");
  const provinsiOpts = await prisma.refProvinsi.findMany({ orderBy: { nama: "asc" }, select: { kode: true, nama: true } });
  const { id } = await params;
  const siswa = await prisma.siswa.findFirst({
    where: { id: Number(id), sekolahId, deletedAt: null },
    include: { user: { select: { id: true, username: true, isActive: true } } },
  });
  if (!siswa) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/siswa/${siswa.id}`} className="text-sm text-gray-500 hover:text-gray-900">{t("editBackProfil")}</Link>
          <h1 className="text-2xl font-semibold text-gray-900">{siswa.namaLengkap}</h1>
        </div>
        <div className="flex gap-2">
          <a href={`/cetak/rapor/${siswa.id}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
            {t("editCetakRapor")}
          </a>
          <a href={`/siswa/${siswa.id}/export`} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100" title={t("exportDataHint")}>
            {t("exportData")}
          </a>
          <Link href={`/siswa/${siswa.id}/delete`} className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
            {t("editHapus")}
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <SiswaForm
          provinsiOptions={provinsiOpts}
          initial={{
            id: siswa.id,
            namaLengkap: siswa.namaLengkap,
            nisn: siswa.nisn,
            nis: siswa.nis,
            nik: siswa.nik,
            noInduk: siswa.noInduk,
            jenisKelamin: siswa.jenisKelamin,
            tempatLahir: siswa.tempatLahir,
            tanggalLahir: siswa.tanggalLahir ? siswa.tanggalLahir.toISOString().slice(0, 10) : null,
            agama: siswa.agama,
            hobi: siswa.hobi,
            citaCita: siswa.citaCita,
            anakKe: siswa.anakKe,
            tahunMasuk: siswa.tahunMasuk,
            status: siswa.status,
            asalSekolah: siswa.asalSekolah,
            alamat: siswa.alamat,
            desaKel: siswa.desaKel,
            kecamatan: siswa.kecamatan,
            kabupaten: siswa.kabupaten,
            kodePos: siswa.kodePos,
            noHp: siswa.noHp,
            tinggalDengan: siswa.tinggalDengan,
            transportasi: siswa.transportasi,
            tinggiBadan: siswa.tinggiBadan,
            beratBadan: siswa.beratBadan,
            golonganDarah: siswa.golonganDarah,
            kebutuhanKhusus: siswa.kebutuhanKhusus,
          }}
        />
      </div>

      <FotoUpload kind="siswa" ownerId={siswa.id} current={siswa.foto} />

      <AccountPanel
        kind="siswa"
        ownerId={siswa.id}
        account={siswa.user ? { userId: siswa.user.id, username: siswa.user.username, isActive: siswa.user.isActive } : null}
      />
    </div>
  );
}
