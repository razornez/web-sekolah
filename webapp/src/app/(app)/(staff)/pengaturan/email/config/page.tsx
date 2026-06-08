import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { getEmailConfigDecrypted } from "./actions";
import { ConfigForm } from "./ConfigForm";

export default async function EmailConfigPage() {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const t = await getTranslations("pengaturan");
  const config = await getEmailConfigDecrypted(sekolahId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/pengaturan/email" className="text-sm text-gray-500 hover:text-gray-800">{t("emailConfigBack")}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{t("emailConfigTitle")}</h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t("emailConfigInfo")}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <ConfigForm initial={config} />
      </div>
    </div>
  );
}
