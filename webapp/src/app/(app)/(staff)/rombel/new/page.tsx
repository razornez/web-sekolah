import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import RombelForm from "../_components/RombelForm";
import { loadRombelOptions } from "../options";

export default async function NewRombelPage() {
  const sekolahId = await requireModule("rombel");
  const t = await getTranslations("rombel");
  const opts = await loadRombelOptions(sekolahId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/rombel" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          {t("kembali")}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("newTitle")}</h1>
          <p className="text-sm text-gray-500">{t("newSubtitle")}</p>
        </div>
      </div>
      <RombelForm {...opts} />
    </div>
  );
}
