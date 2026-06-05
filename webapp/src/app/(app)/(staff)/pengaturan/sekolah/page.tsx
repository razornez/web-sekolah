import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { SekolahForm } from "./SekolahForm";

export default async function SekolahSettingsPage() {
  const sekolahId = await requireModule("pengaturan");
  const t = await getTranslations("pengaturan");
  const s = await prisma.sekolah.findUnique({
    where: { id: sekolahId },
    select: {
      nama: true, npsn: true, jenjang: true, kurikulumDefault: true,
      alamat: true, telepon: true, email: true, website: true,
      kepalaSekolah: true, nipKepala: true, visi: true, misi: true,
    },
  });
  if (!s) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("schoolTitle")}</h1>
        <p className="text-sm text-gray-500">{t("schoolSubtitle")}</p>
      </div>
      <SekolahForm initial={{ ...s, jenjang: s.jenjang, kurikulumDefault: s.kurikulumDefault }} />
    </div>
  );
}
