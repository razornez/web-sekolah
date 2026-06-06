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
      nama: true, npsn: true, jenjang: true, kurikulumDefault: true, slug: true,
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
      {/* Kode sekolah (slug) — dipakai saat login. Read-only. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <span className="text-sm text-indigo-900">{t("schoolSlug")}:</span>
        <code className="rounded-md bg-white px-2.5 py-1 text-sm font-bold text-indigo-700">{s.slug}</code>
      </div>
      <SekolahForm initial={{ nama: s.nama, npsn: s.npsn, jenjang: s.jenjang, kurikulumDefault: s.kurikulumDefault, alamat: s.alamat, telepon: s.telepon, email: s.email, website: s.website, kepalaSekolah: s.kepalaSekolah, nipKepala: s.nipKepala, visi: s.visi, misi: s.misi }} />
    </div>
  );
}
