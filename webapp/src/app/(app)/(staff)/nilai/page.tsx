import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { saveNilai } from "./actions";
import { PageGuide } from "@/components/PageGuide";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { MapelSelect } from "@/components/filters/MapelSelect";
import { PeriodeSelect } from "@/components/filters/PeriodeSelect";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const selCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const inCls = "w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function NilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; periodeId?: string; mapelId?: string; kurikulum?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const t = await getTranslations("nilai");
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;
  const mapelId = Number(sp.mapelId) || 0;

  const sekolah = await prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { kurikulumDefault: true } });
  const kurikulum =
    sp.kurikulum === "K13" || sp.kurikulum === "MERDEKA"
      ? sp.kurikulum
      : (sekolah?.kurikulumDefault ?? "MERDEKA");

  const ready = rombelId > 0 && periodeId > 0 && mapelId > 0;

  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { id: number; namaLengkap: string; foto: string | null };
    nilai?: { nilaiPengetahuan: number | null; nilaiKeterampilan: number | null; nilaiAkhir: number | null; deskripsiCapaian: string | null };
  }[] = [];

  if (ready) {
    const [rows, nilaiRows] = await Promise.all([
      prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { id: true, namaLengkap: true, foto: true } } },
      }),
      prisma.nilaiRapor.findMany({
        where: { mapelId, periodeId, siswa: { sekolahId } },
        select: { siswaId: true, nilaiPengetahuan: true, nilaiKeterampilan: true, nilaiAkhir: true, deskripsiCapaian: true },
      }),
    ]);
    const byId = new Map(nilaiRows.map((n) => [n.siswaId, n]));
    anggota = rows.map((r) => ({ ...r, nilai: byId.get(r.siswaId) }));
  }

  return (
    <div className="space-y-5">
      <PageGuide
        icon="📊"
        title={t("guideTitle")}
        description={t("guideDescription")}
        tips={[
          t("tip1"),
          t("tip2"),
          t("tip3"),
          t("tip4"),
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="flex gap-2">
          <Link href="/nilai/entri" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            {t("linkEntri")}
          </Link>
          <Link href="/nilai/rapor" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            {t("linkRapor")}
          </Link>
        </div>
      </div>

      {/* Filter — pakai reusable server components */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldRombel")}</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className={selCls} emptyLabel={t("pickRombel")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldPeriode")}</label>
          <PeriodeSelect sekolahId={sekolahId} name="periodeId" defaultValue={periodeId || ""} className={selCls} emptyLabel={t("pickPeriode")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldMapel")}</label>
          <MapelSelect sekolahId={sekolahId} name="mapelId" defaultValue={mapelId || ""} className={selCls} emptyLabel={t("pickMapel")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldKurikulum")}</label>
          <select name="kurikulum" defaultValue={kurikulum} className={selCls}>
            <option value="MERDEKA">{t("kurikulumMerdeka")}</option>
            <option value="K13">{t("kurikulumK13")}</option>
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          {t("show")}
        </button>
      </form>

      {!ready && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 py-12 text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-2 text-sm text-gray-500">{t("emptyFilter")}</p>
        </div>
      )}

      {ready && (
        <form action={saveNilai} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <input type="hidden" name="periodeId" value={periodeId} />
          <input type="hidden" name="mapelId" value={mapelId} />
          <input type="hidden" name="kurikulum" value={kurikulum} />

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colNo")}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colNamaSiswa")}</th>
                  {kurikulum === "K13" ? (
                    <>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colPengetahuan")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colKeterampilan")}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colNilaiAkhir")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{t("colDeskripsiCapaian")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggota.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("emptyRombel")}</td></tr>
                )}
                {anggota.map((a, i) => {
                  const nilaiVal = a.nilai?.nilaiAkhir ?? a.nilai?.nilaiPengetahuan;
                  return (
                    <tr key={a.siswaId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400">{a.nomorAbsen ?? i + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <SiswaAvatar namaLengkap={a.siswa.namaLengkap} foto={a.siswa.foto} size="sm" />
                          <Link href={`/siswa/${a.siswa.id}`} className="font-medium text-gray-900 hover:text-indigo-600 hover:underline">
                            {a.siswa.namaLengkap}
                          </Link>
                        </div>
                        {nilaiVal != null && (
                          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${nilaiVal >= 90 ? "bg-green-100 text-green-700" : nilaiVal >= 80 ? "bg-blue-100 text-blue-700" : nilaiVal >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {nilaiVal}
                          </span>
                        )}
                      </td>
                      {kurikulum === "K13" ? (
                        <>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`peng_${a.siswaId}`} defaultValue={a.nilai?.nilaiPengetahuan ?? ""} className={inCls} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`ket_${a.siswaId}`} defaultValue={a.nilai?.nilaiKeterampilan ?? ""} className={inCls} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`akhir_${a.siswaId}`} defaultValue={a.nilai?.nilaiAkhir ?? ""} className={inCls} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" name={`desk_${a.siswaId}`} defaultValue={a.nilai?.deskripsiCapaian ?? ""} placeholder={t("deskripsiPlaceholder")} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {anggota.length > 0 && (
            <div className="flex items-center gap-3">
              <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                {t("saveNilai")}
              </button>
              <p className="text-xs text-gray-400">{t("saveHint", { n: anggota.length })}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
