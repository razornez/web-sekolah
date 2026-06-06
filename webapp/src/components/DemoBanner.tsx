import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

/**
 * Banner mode demo — tampil hanya untuk tenant isDemo, menampilkan sisa waktu
 * sebelum data dihapus otomatis. Null untuk sekolah biasa.
 */
export async function DemoBanner({ sekolahId }: { sekolahId: number | null | undefined }) {
  if (sekolahId == null) return null;
  const sekolah = await prisma.sekolah.findUnique({
    where: { id: sekolahId },
    select: { isDemo: true, demoExpiresAt: true },
  });
  if (!sekolah?.isDemo) return null;

  const t = await getTranslations("common");
  const msLeft = sekolah.demoExpiresAt ? sekolah.demoExpiresAt.getTime() - Date.now() : 0;
  const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)));
  const expired = msLeft <= 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      <span>⏳ {expired ? t("demoBannerExpired") : t("demoBannerText", { h: hoursLeft })}</span>
      <Link href="/daftar-sekolah" className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30">
        {t("demoUpgrade")}
      </Link>
    </div>
  );
}
