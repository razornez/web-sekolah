import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import SuratForm from "../_components/SuratForm";

export default async function EditSuratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireStaff();
  const t = await getTranslations("surat");
  const { id } = await params;
  const surat = await prisma.surat.findFirst({ where: { id: Number(id), sekolahId } });
  if (!surat) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("editTitle")}</h1>
      <SuratForm
        initial={{
          id: surat.id,
          perihal: surat.perihal,
          nomor: surat.nomor,
          jenis: surat.jenis,
          isi: surat.isi,
          tanggal: surat.tanggal.toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
