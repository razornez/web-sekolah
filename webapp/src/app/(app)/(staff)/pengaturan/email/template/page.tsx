import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";

export default async function EmailTemplatePage() {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const t = await getTranslations("pengaturan");

  const CATEGORY_LABEL: Record<string, string> = {
    auth: t("emailCatAuth"), saas: t("emailCatSaas"), ppdb: t("emailCatPpdb"), spp: t("emailCatSpp"),
    presensi: t("emailCatPresensi"), nilai: t("emailCatNilai"), tugas: t("emailCatTugas"),
    bk: t("emailCatBk"), sistem: t("emailCatSistem"),
  };
  const CATEGORY_COLOR: Record<string, string> = {
    auth: "bg-purple-100 text-purple-700", saas: "bg-indigo-100 text-indigo-700",
    ppdb: "bg-blue-100 text-blue-700", spp: "bg-emerald-100 text-emerald-700",
    presensi: "bg-cyan-100 text-cyan-700", nilai: "bg-amber-100 text-amber-700",
    tugas: "bg-orange-100 text-orange-700", bk: "bg-rose-100 text-rose-700",
    sistem: "bg-gray-100 text-gray-700",
  };

  const [tenantTemplates, platformTemplates] = await Promise.all([
    prisma.emailTemplate.findMany({ where: { sekolahId }, select: { key: true } }),
    prisma.emailTemplate.findMany({
      where: { sekolahId: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const customizedKeys = new Set(tenantTemplates.map((t) => t.key));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("emailTplTitle")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("emailTplSubtitle", { count: platformTemplates.length, customCount: customizedKeys.size })}
          </p>
        </div>
        <Link href="/pengaturan/email" className="text-sm text-gray-500 hover:text-gray-800">{t("emailTplBack")}</Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailTplColName")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailTplColCategory")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailTplColVersion")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailTplColStatus")}</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {platformTemplates.map((tpl) => {
              const isCustom = customizedKeys.has(tpl.key);
              return (
                <tr key={tpl.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{tpl.name}</p>
                    <code className="text-xs text-gray-400">{tpl.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[tpl.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABEL[tpl.category] ?? tpl.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {t("emailTplCustomBadge")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{t("emailTplDefaultBadge")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tpl.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tpl.isEnabled ? "bg-green-500" : "bg-gray-400"}`} />
                      {tpl.isEnabled ? t("emailTplActive") : t("emailTplInactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/pengaturan/email/template/${tpl.key}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      {t("emailTplEdit")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
