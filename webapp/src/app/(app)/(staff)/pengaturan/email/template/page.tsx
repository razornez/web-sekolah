import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";

const CATEGORY_LABEL: Record<string, string> = {
  auth: "Auth", saas: "SaaS", ppdb: "PPDB", spp: "SPP",
  presensi: "Presensi", nilai: "Nilai", tugas: "Tugas", bk: "BK", sistem: "Sistem",
};
const CATEGORY_COLOR: Record<string, string> = {
  auth: "bg-purple-100 text-purple-700", saas: "bg-indigo-100 text-indigo-700",
  ppdb: "bg-blue-100 text-blue-700", spp: "bg-emerald-100 text-emerald-700",
  presensi: "bg-cyan-100 text-cyan-700", nilai: "bg-amber-100 text-amber-700",
  tugas: "bg-orange-100 text-orange-700", bk: "bg-rose-100 text-rose-700",
  sistem: "bg-gray-100 text-gray-700",
};

export default async function EmailTemplatePage() {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();

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
          <h1 className="text-xl font-bold text-gray-900">Template Email</h1>
          <p className="mt-1 text-sm text-gray-500">
            {platformTemplates.length} template · {customizedKeys.size} dikustomisasi sekolah ini
          </p>
        </div>
        <Link href="/pengaturan/email" className="text-sm text-gray-500 hover:text-gray-800">← Kembali</Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Template</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Versi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {platformTemplates.map((t) => {
              const isCustom = customizedKeys.has(t.key);
              return (
                <tr key={t.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <code className="text-xs text-gray-400">{t.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[t.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABEL[t.category] ?? t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        Kustom sekolah
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Default platform</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${t.isEnabled ? "bg-green-500" : "bg-gray-400"}`} />
                      {t.isEnabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/pengaturan/email/template/${t.key}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Edit
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
