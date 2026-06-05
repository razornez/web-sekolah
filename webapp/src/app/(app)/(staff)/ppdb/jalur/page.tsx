import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createJalur, updateJalur, deleteJalur } from "../actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function JalurPpdbPage() {
  const sekolahId = await requireStaff();
  const t = await getTranslations("ppdb");
  const rows = await prisma.jalurPpdb.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t("jalurTitle")}</h1>
        <Link href="/ppdb" className="text-sm text-gray-500 hover:text-gray-900">{t("jalurBackPendaftar")}</Link>
      </div>

      <form action={createJalur} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div><label className="block text-xs text-gray-500">{t("jalurNama")}</label><input name="nama" required placeholder={t("jalurPlaceholderNama")} className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">{t("jalurKuota")}</label><input name="kuota" type="number" min={0} className={`${inCls} w-24`} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("jalurKeterangan")}</label><input name="keterangan" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("jalurTambah")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-2 font-medium">{t("jalurColJalur")}</th><th className="px-4 py-2 font-medium text-right">{t("jalurColAksi")}</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">{t("jalurEmpty")}</td></tr>}
            {rows.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-2">
                  <form action={updateJalur} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={j.id} />
                    <input name="nama" defaultValue={j.nama} className={inCls} />
                    <input name="kuota" type="number" min={0} defaultValue={j.kuota ?? ""} placeholder={t("jalurPlaceholderKuota")} className={`${inCls} w-24`} />
                    <input name="keterangan" defaultValue={j.keterangan ?? ""} placeholder={t("jalurPlaceholderKeterangan")} className={`${inCls} flex-1`} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">{t("jalurSimpan")}</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteJalur} id={j.id} message={t("jalurConfirmDelete", { nama: j.nama })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
