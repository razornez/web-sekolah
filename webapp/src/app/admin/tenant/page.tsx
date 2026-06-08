import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TenantPage() {
  const user = await getCurrentUser();
  if (user.role !== "superadmin") redirect("/dashboard");

  const schools = await prisma.sekolah.findMany({
    orderBy: [{ isDemo: "asc" }, { nama: "asc" }],
    select: { id: true, nama: true, jenjang: true, slug: true, npsn: true, isDemo: true, demoExpiresAt: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tenant / Sekolah</h1>
        <p className="mt-1 text-sm text-gray-500">{schools.length} sekolah terdaftar</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Sekolah</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenjang</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kode / Key</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">NPSN</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipe</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Terdaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schools.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                <td className="px-4 py-3 text-gray-600">{s.jenjang}</td>
                <td className="px-4 py-3">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700">{s.slug}</code>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.npsn ?? <span className="italic text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  {s.isDemo ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Demo{s.demoExpiresAt && ` · exp ${new Date(s.demoExpiresAt).toLocaleDateString("id-ID")}`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Aktif</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Belum ada sekolah.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
