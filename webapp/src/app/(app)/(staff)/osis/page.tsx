import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createCalon, updateCalon, deleteCalon } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function OsisPage() {
  const sekolahId = await requireStaff();
  const t = await getTranslations("osis");
  const [calon, totalVotes] = await Promise.all([
    prisma.calonOsis.findMany({
      where: { sekolahId },
      orderBy: { noUrut: "asc" },
      include: { _count: { select: { vote: true } } },
    }),
    prisma.votePemilihan.count({ where: { sekolahId } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("summary", { candidates: calon.length, votes: totalVotes })}</p>
      </div>

      <form action={createCalon} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div><label className="block text-xs text-gray-500">{t("fieldNo")}</label><input name="noUrut" type="number" min={1} defaultValue={calon.length + 1} className={`${inCls} w-16`} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldKetua")}</label><input name="namaKetua" required className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldWakil")}</label><input name="namaWakil" className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldVisi")}</label><input name="visi" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("add")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colKandidat")}</th><th className="px-4 py-2 font-medium">{t("colSuara")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calon.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {calon.map((c) => {
              const pct = totalVotes ? Math.round((c._count.vote / totalVotes) * 100) : 0;
              return (
                <tr key={c.id}>
                  <td className="px-4 py-2">
                    <form action={updateCalon} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input name="noUrut" type="number" min={1} defaultValue={c.noUrut} className={`${inCls} w-16`} />
                      <input name="namaKetua" defaultValue={c.namaKetua} className={inCls} />
                      <input name="namaWakil" defaultValue={c.namaWakil ?? ""} placeholder={t("wakilPlaceholder")} className={inCls} />
                      <input name="visi" defaultValue={c.visi ?? ""} placeholder={t("visiPlaceholder")} className={`${inCls} flex-1`} />
                      <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">{t("save")}</button>
                    </form>
                  </td>
                  <td className="px-4 py-2 text-gray-700"><b>{c._count.vote}</b> <span className="text-xs text-gray-400">({pct}%)</span></td>
                  <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteCalon} id={c.id} message={t("deleteConfirm", { no: c.noUrut })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
