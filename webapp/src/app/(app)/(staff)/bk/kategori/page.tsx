import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createKategori, updateKategori, deleteKategori } from "../actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function KategoriKasusPage() {
  const sekolahId = await requireStaff();
  const t = await getTranslations("bk");
  const rows = await prisma.kategoriKasus.findMany({
    where: { sekolahId },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t("kategoriTitle")}</h1>
        <Link href="/bk" className="text-sm text-gray-500 hover:text-gray-900">{t("backToBk")}</Link>
      </div>

      <form action={createKategori} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">{t("fieldNamaPelanggaran")}</label>
          <input name="nama" required placeholder={t("placeholderTerlambat")} className={inCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">{t("fieldPoin")}</label>
          <input name="poin" type="number" min={0} defaultValue={0} className={`${inCls} w-24`} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addBtn")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">{t("kColNama")}</th>
              <th className="px-4 py-2 font-medium">{t("kColPoin")}</th>
              <th className="px-4 py-2 font-medium text-right">{t("kColAksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t("emptyKategori")}</td></tr>
            )}
            {rows.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-2" colSpan={2}>
                  <form action={updateKategori} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={k.id} />
                    <input name="nama" defaultValue={k.nama} className={`${inCls} flex-1`} />
                    <input name="poin" type="number" min={0} defaultValue={k.poin} className={`${inCls} w-24`} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">{t("simpan")}</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDelete action={deleteKategori} id={k.id} message={t("deleteConfirm", { nama: k.nama })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
