import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { GuruSelect } from "@/components/filters/GuruSelect";
import { MapelSelect } from "@/components/filters/MapelSelect";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { createJurnal, updateJurnal, deleteJurnal } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function JurnalPage() {
  const sekolahId = await requireModule("jurnal");
  const t = await getTranslations("jurnal");
  const rows = await prisma.jurnalGuru.findMany({
    where: { sekolahId },
    orderBy: { tanggal: "desc" },
    take: 100,
    include: { guru: { select: { id: true, namaGuru: true } } },
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>

      <form action={createJurnal} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">{t("fieldGuru")}</label>
          <GuruSelect sekolahId={sekolahId} name="guruId" required emptyLabel={t("guruEmpty")} className={inCls} />
        </div>
        <div><label className="block text-xs text-gray-500">{t("fieldTanggal")}</label><input type="date" name="tanggal" defaultValue={today} className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldKelas")}</label><input name="kelas" className={`${inCls} w-24`} /></div>
        <div>
          <label className="block text-xs text-gray-500">{t("fieldMapel")}</label>
          <MapelSelect sekolahId={sekolahId} name="mapel" defaultValue="" emptyLabel={t("mapelEmpty")} className={inCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">{t("fieldKelas")}</label>
          <RombelSelect sekolahId={sekolahId} name="kelas" defaultValue="" className={inCls} />
        </div>
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldMateri")}</label><input name="materi" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addButton")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colTanggal")}</th><th className="px-4 py-2 font-medium">{t("colGuru")}</th><th className="px-4 py-2 font-medium">{t("colKelas")}</th><th className="px-4 py-2 font-medium">{t("colMapel")}</th><th className="px-4 py-2 font-medium">{t("colMateri")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {rows.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{fmt(j.tanggal)}</td>
                <td className="px-4 py-2">
                  <Link href={`/guru/${j.guru.id}`} className="font-medium text-gray-900 hover:underline hover:text-indigo-700">
                    {j.guru.namaGuru}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{j.kelas ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{j.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{j.materi ?? "-"}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">{t("edit")}</summary>
                      <form action={updateJurnal} className="absolute right-0 z-20 mt-1 flex w-64 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                        <input type="hidden" name="id" value={j.id} />
                        <input type="date" name="tanggal" defaultValue={iso(j.tanggal)} className={inCls} />
                        <input name="kelas" defaultValue={j.kelas ?? ""} placeholder={t("colKelas")} className={inCls} />
                        <input name="mapel" defaultValue={j.mapel ?? ""} placeholder={t("colMapel")} className={inCls} />
                        <input name="materi" defaultValue={j.materi ?? ""} placeholder={t("colMateri")} className={inCls} />
                        <button className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800">{t("saveEdit")}</button>
                      </form>
                    </details>
                    <ConfirmDelete action={deleteJurnal} id={j.id} message={t("deleteConfirm")} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
