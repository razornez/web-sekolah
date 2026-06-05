import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createTugas, deleteTugas } from "./actions";
import { RombelSelect } from "@/components/filters/RombelSelect";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) => (d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default async function TugasPage() {
  const sekolahId = await requireModule("tugas");
  const t = await getTranslations("tugas");
  const [rows, rombel, totalAktif] = await Promise.all([
    prisma.tugas.findMany({
      where: { sekolahId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { pengumpulan: true } } },
    }),
    prisma.rombel.findMany({
      where: { sekolahId },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, _count: { select: { anggota: true } } },
    }),
    prisma.siswa.count({ where: { sekolahId, deletedAt: null, status: "aktif" } }),
  ]);
  const rombelMap = new Map(rombel.map((r) => [r.id, r.nama]));
  const rombelSize = new Map(rombel.map((r) => [r.id, r._count.anggota]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>

      <form action={createTugas} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldJudul")}</label><input name="judul" required className={`${inCls} w-full`} /></div>
        <div><label className="block text-xs text-gray-500">{t("fieldMapel")}</label><input name="mapel" className={inCls} /></div>
        <div>
          <label className="block text-xs text-gray-500">{t("fieldRombel")}</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue="" emptyLabel={t("rombelEmptyLabel")} className={inCls} />
        </div>
        <div><label className="block text-xs text-gray-500">{t("fieldDeadline")}</label><input type="date" name="deadline" className={inCls} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("add")}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colJudul")}</th><th className="px-4 py-2 font-medium">{t("colMapel")}</th><th className="px-4 py-2 font-medium">{t("colRombel")}</th><th className="px-4 py-2 font-medium">{t("colDeadline")}</th><th className="px-4 py-2 font-medium">{t("colTerkumpul")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {rows.map((tg) => (
              <tr key={tg.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/tugas/${tg.id}`} className="font-medium text-gray-900 hover:underline">{tg.judul}</Link></td>
                <td className="px-4 py-2 text-gray-600">{tg.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{tg.rombelId ? rombelMap.get(tg.rombelId) ?? "-" : t("rombelSemua")}</td>
                <td className="px-4 py-2 text-gray-600">{fmt(tg.deadline)}</td>
                <td className="px-4 py-2">
                  {(() => {
                    const total = tg.rombelId ? (rombelSize.get(tg.rombelId) ?? 0) : totalAktif;
                    const done = tg._count.pengumpulan;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${done >= total && total > 0 ? "bg-green-100 text-green-700" : done > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                        {done} / {total} {total > 0 ? `(${pct}%)` : ""}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/tugas/${tg.id}`} className="text-gray-600 hover:underline">{t("check")}</Link>
                    <ConfirmDelete action={deleteTugas} id={tg.id} message={t("deleteConfirm", { judul: tg.judul })} />
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
