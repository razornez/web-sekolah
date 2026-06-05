import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiswaForm from "../_components/SiswaForm";

export default async function NewSiswaPage() {
  const t = await getTranslations("siswa");
  const provinsiOpts = await prisma.refProvinsi.findMany({ orderBy: { nama: "asc" }, select: { kode: true, nama: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("newTitle")}</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <SiswaForm provinsiOptions={provinsiOpts} />
      </div>
    </div>
  );
}
