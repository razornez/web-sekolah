import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const CATEGORY_LABEL: Record<string, string> = {
  auth: "Auth", saas: "SaaS", ppdb: "PPDB", spp: "SPP",
  presensi: "Presensi", nilai: "Nilai", tugas: "Tugas", bk: "BK", sistem: "Sistem",
};

const CATEGORY_COLOR: Record<string, string> = {
  auth: "bg-purple-100 text-purple-700",
  saas: "bg-indigo-100 text-indigo-700",
  ppdb: "bg-blue-100 text-blue-700",
  spp: "bg-emerald-100 text-emerald-700",
  presensi: "bg-cyan-100 text-cyan-700",
  nilai: "bg-amber-100 text-amber-700",
  tugas: "bg-orange-100 text-orange-700",
  bk: "bg-rose-100 text-rose-700",
  sistem: "bg-gray-100 text-gray-700",
};

export default async function EmailTemplatePage() {
  const user = await getCurrentUser();
  if (user.role !== "superadmin") redirect("/dashboard");

  const templates = await prisma.emailTemplate.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Template Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          {templates.length} template tersedia. Klik untuk mengedit subject, body, dan variabel.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Template</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Terakhir Diubah</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map((t) => (
              <tr key={t.key} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{t.key}</p>
                  {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[t.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${t.isEnabled ? "bg-green-500" : "bg-gray-400"}`} />
                    {t.isEnabled ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/email/template/${t.key}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  Belum ada template. Jalankan seed terlebih dahulu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
