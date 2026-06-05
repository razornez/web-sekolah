import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { PageGuide } from "@/components/PageGuide";
import { toggleMapelAktif } from "./actions";

const KELOMPOK_COLOR: Record<string, string> = {
  A: "bg-blue-50 border-blue-200",
  B: "bg-green-50 border-green-200",
  C: "bg-purple-50 border-purple-200",
  lintasminat: "bg-amber-50 border-amber-200",
  muatanlokal: "bg-pink-50 border-pink-200",
};

export default async function MapelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tampil?: string }>;
}) {
  const sekolahId = await requireModule("mapel");
  const t = await getTranslations("mapel");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tampil = sp.tampil ?? "aktif";

  const rows = await prisma.mapel.findMany({
    where: {
      sekolahId,
      aktif: tampil === "nonaktif" ? false : true,
      ...(q ? { OR: [{ namaMapel: { contains: q, mode: "insensitive" } }, { kodeMapel: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }],
    include: {
      guru: { select: { namaGuru: true } },
      _count: { select: { nilaiRapor: true, guruHistory: true } },
    },
  });

  const nonaktifCount = await prisma.mapel.count({ where: { sekolahId, aktif: false } });

  // Group by kelompok
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, m) => {
    (acc[m.kelompok] ??= []).push(m);
    return acc;
  }, {});
  const KELOMPOK_ORDER = ["A", "B", "C", "lintasminat", "muatanlokal"];
  const KELOMPOK_LABEL: Record<string, string> = {
    A: t("kelompokA"),
    B: t("kelompokB"),
    C: t("kelompokC"),
    lintasminat: t("kelompokLintasMinat"),
    muatanlokal: t("kelompokMuatanLokal"),
  };

  return (
    <div className="space-y-5">
      <PageGuide
        icon="📚"
        title={t("title")}
        description={t("guideDescription")}
        tips={[
          t("tip1"),
          t("tip2"),
          t("tip3"),
          t("tip4"),
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{tampil === "nonaktif" ? t("countInactive", { n: rows.length }) : t("countActive", { n: rows.length })}</p>
        </div>
        <Link href="/mapel/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addMapel")}</Link>
      </div>

      {/* Tab + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-gray-300">
          <Link href={`/mapel?q=${q}`} className={`px-3 py-1.5 text-xs font-medium ${tampil === "aktif" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{t("tabAktif")}</Link>
          <Link href={`/mapel?tampil=nonaktif&q=${q}`} className={`border-l px-3 py-1.5 text-xs font-medium ${tampil === "nonaktif" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{t("tabNonaktif", { n: nonaktifCount })}</Link>
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="tampil" value={tampil} />
          <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">{t("search")}</button>
        </form>
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {rows.length === 0 && <p className="py-8 text-center text-sm text-gray-400">{t("noData")}</p>}
        {KELOMPOK_ORDER.map((kel) => {
          const mapels = grouped[kel];
          if (!mapels?.length) return null;
          return (
            <div key={kel} className={`rounded-xl border p-4 ${KELOMPOK_COLOR[kel] ?? "bg-gray-50 border-gray-200"}`}>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">{KELOMPOK_LABEL[kel] ?? kel}</h2>
              <div className="overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">{t("colNo")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colKode")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colNama")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colFase")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colKkm")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colGuru")}</th>
                      <th className="px-4 py-2 font-semibold">{t("colHistory")}</th>
                      <th className="px-4 py-2 text-right font-semibold">{t("colAksi")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mapels.map((m, i) => (
                      <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${!m.aktif ? "opacity-50" : ""}`}>
                        <td className="px-4 py-2 text-gray-400">{m.noUrut ?? i + 1}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{m.kodeMapel}</td>
                        <td className="px-4 py-2">
                          <Link href={`/mapel/${m.id}`} className="font-medium text-gray-900 hover:underline">{m.namaMapel}</Link>
                        </td>
                        <td className="px-4 py-2 text-gray-500">{m.fase ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{m.kkm}</td>
                        <td className="px-4 py-2 text-gray-600">{m.guru?.namaGuru ?? <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2 text-gray-500">{t("historyCount", { n: m._count.guruHistory })}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/mapel/${m.id}`} className="text-xs text-gray-600 hover:underline">{t("edit")}</Link>
                            <form action={toggleMapelAktif} className="inline">
                              <input type="hidden" name="id" value={m.id} />
                              <button className={`rounded border px-2 py-0.5 text-xs ${m.aktif ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                                {m.aktif ? t("nonaktifkan") : t("aktifkan")}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
