import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { InlineEdit } from "@/components/InlineEdit";
import { GuruSelect } from "@/components/filters/GuruSelect";
import { createElearning, updateElearning, deleteElearning } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function ElearningPage() {
  const sekolahId = await requireModule("elearning");
  const t = await getTranslations("elearning");
  const rows = await prisma.elearning.findMany({ where: { sekolahId }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>

      <form action={createElearning} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div><label className="block text-xs text-gray-500">{t("fieldJudul")}</label><input name="judul" required className={inCls} /></div>
        <div>
          <label className="block text-xs text-gray-500">{t("fieldGuru")}</label>
          <GuruSelect sekolahId={sekolahId} name="guruId" emptyLabel={t("guruEmpty")} className={inCls} />
        </div>
        <div><label className="block text-xs text-gray-500">{t("fieldKelas")}</label><input name="kelas" className={`${inCls} w-24`} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldMapel")}</label><input name="mapel" className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldLink")}</label><input name="link" placeholder="https://…" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addButton")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colJudul")}</th><th className="px-4 py-2 font-medium">{t("colKelas")}</th><th className="px-4 py-2 font-medium">{t("colMapel")}</th><th className="px-4 py-2 font-medium">{t("colTautan")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{e.judul}</td>
                <td className="px-4 py-2 text-gray-600">{e.kelas ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{e.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">{t("open")}</a> : "-"}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <InlineEdit action={updateElearning} saveLabel={t("save")}>
                      <input type="hidden" name="id" value={e.id} />
                      <input name="judul" defaultValue={e.judul} required placeholder={t("fieldJudul")} className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-gray-900" />
                      <input name="mapel" defaultValue={e.mapel ?? ""} placeholder={t("fieldMapel")} className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                      <input name="kelas" defaultValue={e.kelas ?? ""} placeholder={t("fieldKelas")} className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                      <input name="link" defaultValue={e.link ?? ""} placeholder={t("fieldLink")} className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                    </InlineEdit>
                    <ConfirmDelete action={deleteElearning} id={e.id} message={t("deleteConfirm", { judul: e.judul })} />
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
