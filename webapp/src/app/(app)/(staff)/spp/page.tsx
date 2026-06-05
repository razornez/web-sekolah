import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { addTagihan, bayarTagihan, deleteTagihan } from "./actions";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function SppPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; siswaId?: string }>;
}) {
  const sekolahId = await requireModule("spp");
  const t = await getTranslations("spp");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const siswaId = Number(sp.siswaId) || 0;

  const kandidat = q
    ? await prisma.siswa.findMany({
        where: {
          sekolahId,
          OR: [
            { namaLengkap: { contains: q, mode: "insensitive" } },
            { nisn: { contains: q } },
          ],
        },
        take: 10,
        orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : [];

  const siswa = siswaId
    ? await prisma.siswa.findFirst({
        where: { id: siswaId, sekolahId },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : null;

  const [tagihan, jenisList] = siswa
    ? await Promise.all([
        prisma.tagihanSpp.findMany({
          where: { siswaId: siswa.id, sekolahId },
          orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
          include: {
            jenis: { select: { nama: true } },
            pembayaran: { orderBy: { id: "desc" }, take: 1, select: { id: true } },
          },
        }),
        prisma.jenisPembayaran.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
      ])
    : [[], []];

  const now = new Date();
  const tahunIni = now.getFullYear();
  const bulanIni = now.getMonth() + 1;
  // Hanya tagihan yang sudah jatuh tempo (periode <= bulan berjalan) — abaikan tagihan masa depan
  const dueFilter = {
    OR: [
      { tahun: { lt: tahunIni } },
      { tahun: tahunIni, bulan: { lte: bulanIni } },
    ],
  };

  // Ringkasan + tunggakan terbaru (hanya saat belum pilih siswa)
  const overview = !siswa
    ? await (async () => {
        const [paid, unpaid, outstandingAgg, recent] = await Promise.all([
          prisma.tagihanSpp.count({ where: { sekolahId, status: "lunas" } }),
          prisma.tagihanSpp.count({ where: { sekolahId, status: { not: "lunas" }, ...dueFilter } }),
          prisma.tagihanSpp.aggregate({ where: { sekolahId, status: { not: "lunas" }, ...dueFilter }, _sum: { nominal: true } }),
          prisma.tagihanSpp.findMany({
            where: { sekolahId, status: { not: "lunas" }, ...dueFilter },
            orderBy: [{ tahun: "asc" }, { bulan: "asc" }], // paling lama/menunggak dulu
            take: 15,
            include: { jenis: { select: { nama: true } }, siswa: { select: { id: true, namaLengkap: true, foto: true } } },
          }),
        ]);
        return { paid, unpaid, outstanding: outstandingAgg._sum.nominal ?? 0, recent };
      })()
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("title")}</h1>
        <Link href="/spp/jenis" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          {t("managePaymentType")}
        </Link>
      </div>

      {/* cari siswa */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs text-gray-500">{t("searchHint")}</p>
        <form className="flex flex-wrap gap-2">
          <SiswaAutocomplete name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="w-full max-w-sm rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">{t("search")}</button>
        </form>
      </div>

      {/* Dashboard ringkasan — saat belum pilih siswa & tidak sedang search */}
      {overview && !q && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-2xl font-black text-amber-700">{overview.unpaid.toLocaleString("id-ID")}</div>
              <div className="text-xs text-amber-600 mt-0.5">{t("summaryUnpaid")}</div>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="text-2xl font-black text-green-700">{overview.paid.toLocaleString("id-ID")}</div>
              <div className="text-xs text-green-600 mt-0.5">{t("summaryPaid")}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="text-2xl font-black text-red-700">{rupiah(overview.outstanding)}</div>
              <div className="text-xs text-red-600 mt-0.5">{t("summaryTotalOutstanding")}</div>
            </div>
          </div>

          {/* Tunggakan terbaru */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-700">{t("recentUnpaidTitle")}</span>
            </div>
            {overview.recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">{t("recentUnpaidEmpty")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t("colSiswa")}</th>
                    <th className="px-4 py-2 font-medium">{t("colJenis")}</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">{t("colPeriode")}</th>
                    <th className="px-4 py-2 font-medium">{t("colNominal")}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overview.recent.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <SiswaAvatar namaLengkap={row.siswa?.namaLengkap ?? "?"} foto={row.siswa?.foto} size="sm" />
                          <Link href={`/spp?siswaId=${row.siswa?.id}`} className="font-medium text-gray-900 hover:underline">{row.siswa?.namaLengkap ?? "—"}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{row.jenis.nama}</td>
                      <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">{BULAN[row.bulan]} {row.tahun}</td>
                      <td className="px-4 py-2 text-gray-700 font-medium">{rupiah(row.nominal)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link href={`/spp?siswaId=${row.siswa?.id}`} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100">{t("viewStudent")}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {q && !siswa && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {kandidat.length === 0 && <li className="px-4 py-3 text-sm text-gray-400">{t("noMatch")}</li>}
          {kandidat.map((s) => (
            <li key={s.id} className="px-4 py-2 text-sm">
              <Link href={`/spp?siswaId=${s.id}`} className="text-gray-900 hover:underline">
                {s.namaLengkap}
              </Link>
              <span className="ml-2 text-xs text-gray-400">{s.nisn ?? ""}</span>
            </li>
          ))}
        </ul>
      )}

      {siswa && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">{siswa.namaLengkap}</h2>
            <span className="text-xs text-gray-400">{siswa.nisn ?? ""}</span>
            <Link href="/spp" className="ml-auto text-sm text-gray-500 hover:text-gray-900">{t("changeStudent")}</Link>
          </div>

          {/* tambah tagihan */}
          <form action={addTagihan} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
            <input type="hidden" name="siswaId" value={siswa.id} />
            <div>
              <label className="block text-xs text-gray-500">{t("jenis")}</label>
              <select name="jenisId" required className={inCls}>
                <option value="">{t("selectPlaceholder")}</option>
                {jenisList.map((j) => (
                  <option key={j.id} value={j.id}>{t("jenisOption", { nama: j.nama, nominal: rupiah(j.nominal) })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t("bulan")}</label>
              <select name="bulan" defaultValue={new Date().getMonth() + 1} className={inCls}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                  <option key={b} value={b}>{BULAN[b]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t("tahun")}</label>
              <input name="tahun" type="number" defaultValue={tahunIni} className={`${inCls} w-24`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t("nominalOptional")}</label>
              <input name="nominal" type="number" min={0} defaultValue={0} className={`${inCls} w-32`} />
            </div>
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addTagihan")}</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("colJenis")}</th>
                  <th className="px-4 py-2 font-medium">{t("colPeriode")}</th>
                  <th className="px-4 py-2 font-medium">{t("colNominal")}</th>
                  <th className="px-4 py-2 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tagihan.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>
                )}
                {tagihan.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{row.jenis.nama}</td>
                    <td className="px-4 py-2 text-gray-600">{BULAN[row.bulan]} {row.tahun}</td>
                    <td className="px-4 py-2 text-gray-600">{rupiah(row.nominal)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${row.status === "lunas" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-3">
                        {row.status !== "lunas" && (
                          <form action={bayarTagihan}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="siswaId" value={siswa.id} />
                            <button className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">{t("pay")}</button>
                          </form>
                        )}
                        {row.status === "lunas" && row.pembayaran[0] && (
                          <Link href={`/cetak/kwitansi/${row.pembayaran[0].id}`} target="_blank" className="text-gray-600 hover:underline">
                            {t("receipt")}
                          </Link>
                        )}
                        <form action={deleteTagihan}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="siswaId" value={siswa.id} />
                          <button className="text-red-600 hover:underline">{t("delete")}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
