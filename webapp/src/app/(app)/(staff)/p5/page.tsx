import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createProjek, deleteProjek } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function P5Page() {
  const sekolahId = await requireModule("p5");
  const t = await getTranslations("p5");
  const [projek, tahunAjaran] = await Promise.all([
    prisma.projekP5.findMany({
      where: { sekolahId },
      orderBy: { id: "desc" },
      include: { tahunAjaran: { select: { tahun: true } }, _count: { select: { target: true, penilaian: true } } },
    }),
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle", { n: projek.length })}</p>
      </div>

      <form action={createProjek} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">{t("fieldTahunAjaran")}</label>
          <select name="tahunAjaranId" required defaultValue="" className={inCls}>
            <option value="">{t("selectPlaceholder")}</option>
            {tahunAjaran.map((ta) => <option key={ta.id} value={ta.id}>{ta.tahun}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">{t("fieldTema")}</label><input name="tema" required placeholder={t("temaPlaceholder")} className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldJudul")}</label><input name="judul" required className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldDeskripsi")}</label><input name="deskripsi" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("add")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colJudul")}</th><th className="px-4 py-2 font-medium">{t("colTema")}</th><th className="px-4 py-2 font-medium">{t("colTahun")}</th><th className="px-4 py-2 font-medium">{t("colTargetNilai")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projek.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {projek.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/p5/${p.id}`} className="font-medium text-gray-900 hover:underline">{p.judul}</Link></td>
                <td className="px-4 py-2 text-gray-600">{p.tema}</td>
                <td className="px-4 py-2 text-gray-600">{p.tahunAjaran.tahun}</td>
                <td className="px-4 py-2 text-gray-600">{t("targetNilaiValue", { target: p._count.target, nilai: p._count.penilaian })}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/p5/${p.id}`} className="text-gray-600 hover:underline">{t("manage")}</Link>
                    <ConfirmDelete action={deleteProjek} id={p.id} message={t("deleteConfirm", { judul: p.judul })} />
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
