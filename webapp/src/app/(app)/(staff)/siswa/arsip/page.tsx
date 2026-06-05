import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { restoreSiswa } from "../actions";

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function ArsipSiswaPage() {
  const sekolahId = await requireModule("siswa");
  const t = await getTranslations("siswa");
  const rows = await prisma.siswa.findMany({
    where: { sekolahId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: {
      anggotaRombel: {
        include: { rombel: { select: { nama: true } } },
        take: 1,
        orderBy: { id: "desc" },
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/siswa" className="text-sm text-gray-500 hover:text-gray-900">{t("arsipBackList")}</Link>
          <h1 className="text-2xl font-semibold text-gray-900">{t("arsipTitle")}</h1>
          <p className="text-sm text-gray-500">{t("arsipSubtitle", { n: rows.length })}</p>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
          <div className="text-4xl">🗑</div>
          <p className="mt-2 text-sm text-gray-500">{t("arsipEmptyTitle")}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("arsipColNama")}</th>
                <th className="px-4 py-2 font-medium">{t("arsipColNisn")}</th>
                <th className="px-4 py-2 font-medium">{t("arsipColKelasTerakhir")}</th>
                <th className="px-4 py-2 font-medium">{t("arsipColDiarsipkan")}</th>
                <th className="px-4 py-2 font-medium text-right">{t("arsipColAksi")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((s) => (
                <tr key={s.id} className="bg-gray-50 hover:bg-white">
                  <td className="px-4 py-2 text-gray-700">{s.namaLengkap}</td>
                  <td className="px-4 py-2 text-gray-500">{s.nisn ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{s.anggotaRombel[0]?.rombel.nama ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{fmt(s.deletedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={restoreSiswa} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50">
                        {t("arsipPulihkan")}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {t("arsipFooter")}
      </p>
    </div>
  );
}
