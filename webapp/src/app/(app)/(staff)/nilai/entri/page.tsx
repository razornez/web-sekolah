import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { MapelSelect } from "@/components/filters/MapelSelect";
import { PeriodeSelect } from "@/components/filters/PeriodeSelect";
import { saveEntriNilai } from "./actions";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const TIPE_COLOR: Record<string, string> = {
  harian:         "bg-blue-100 text-blue-700",
  tugas:          "bg-green-100 text-green-700",
  ulangan:        "bg-cyan-100 text-cyan-700",
  uts:            "bg-amber-100 text-amber-700",
  uas:            "bg-orange-100 text-orange-700",
  sumatif_harian: "bg-purple-100 text-purple-700",
  sumatif_akhir:  "bg-pink-100 text-pink-700",
  formatif:       "bg-gray-100 text-gray-600",
  praktik:        "bg-teal-100 text-teal-700",
};

const TIPE_KEYS: Record<string, string> = {
  harian:         "tipeHarian",
  tugas:          "tipeTugas",
  ulangan:        "tipeUlangan",
  uts:            "tipeUts",
  uas:            "tipeUas",
  sumatif_harian: "tipeSumatifHarian",
  sumatif_akhir:  "tipeSumatifAkhir",
  formatif:       "tipeFormatif",
  praktik:        "tipePraktik",
};

export default async function EntriNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; periodeId?: string; mapelId?: string; tipe?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const t = await getTranslations("nilai");
  const tipeLabel = (k: string): string => (TIPE_KEYS[k] ? t(TIPE_KEYS[k]) : k);
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;
  const mapelId = Number(sp.mapelId) || 0;
  const tipe = sp.tipe ?? "harian";

  const ready = rombelId > 0 && periodeId > 0 && mapelId > 0;

  // Load existing entri for this combination
  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { id: number; namaLengkap: string; foto: string | null };
  }[] = [];
  let existingEntri: Record<number, { id: bigint; nilai: number; keterangan: string | null }[]> = {};

  if (ready) {
    const [rows, entriRows] = await Promise.all([
      prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { id: true, namaLengkap: true, foto: true } } },
      }),
      prisma.entriNilai.findMany({
        where: { mapelId, periodeId, rombelId, sekolahId, tipe: tipe as never },
        orderBy: { tanggal: "desc" },
        select: { id: true, siswaId: true, nilai: true, keterangan: true },
      }),
    ]);
    anggota = rows;
    for (const e of entriRows) {
      const n = Number(e.nilai);
      (existingEntri[e.siswaId] ??= []).push({ ...e, nilai: n });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/nilai" className="text-sm text-gray-500 hover:text-gray-900">{t("entriBack")}</Link>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">{t("entriTitle")}</h1>
          <p className="text-sm text-gray-500">{t("entriDescription")}</p>
        </div>
      </div>

      {/* Filter */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div><label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldRombel")}</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId} emptyLabel={t("pickRombel")} className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldPeriode")}</label>
          <PeriodeSelect sekolahId={sekolahId} name="periodeId" defaultValue={periodeId||""} emptyLabel={t("pickPeriode")} className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldMapel")}</label>
          <MapelSelect sekolahId={sekolahId} name="mapelId" defaultValue={mapelId||""} emptyLabel={t("pickMapel")} className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("fieldTipe")}</label>
          <select name="tipe" defaultValue={tipe} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
            {Object.keys(TIPE_COLOR).map((k) => (
              <option key={k} value={k}>{tipeLabel(k)}</option>
            ))}
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">{t("show")}</button>
      </form>

      {!ready && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          <div className="text-4xl">📝</div>
          <p className="mt-2 text-sm">{t("entriEmptyFilter")}</p>
        </div>
      )}

      {ready && (
        <>
          {/* Existing entries */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-700">
                  {tipeLabel(tipe)}
                </span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${TIPE_COLOR[tipe] ?? "bg-gray-100"}`}>
                  {tipe.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-gray-400">{t("siswaCount", { n: anggota.length })}</p>
            </div>
            <form action={saveEntriNilai} className="p-0">
              <input type="hidden" name="rombelId" value={rombelId} />
              <input type="hidden" name="periodeId" value={periodeId} />
              <input type="hidden" name="mapelId" value={mapelId} />
              <input type="hidden" name="tipe" value={tipe} />
              <input type="hidden" name="tanggal" value={new Date().toISOString().slice(0, 10)} />
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">{t("colNo")}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t("colNamaSiswa")}</th>
                    <th className="px-4 py-2 font-semibold">{t("colNilaiBaru")}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t("colKeterangan")}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t("colRiwayat")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anggota.map((a, i) => {
                    const riwayat = existingEntri[a.siswaId] ?? [];
                    const avg = riwayat.length ? Math.round(riwayat.reduce((s, e) => s + e.nilai, 0) / riwayat.length) : null;
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
                          {avg != null && (
                            <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${avg >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {t("avgBadge", { n: avg })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input type="number" min={0} max={100} name={`nilai_${a.siswaId}`} placeholder="—" className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <input name={`ket_${a.siswaId}`} placeholder={t("ketPlaceholder")} className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {riwayat.slice(0, 4).map((e) => (
                              <span key={String(e.id)} className={`rounded px-1.5 py-0.5 text-xs ${e.nilai >= 75 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                {e.nilai}
                              </span>
                            ))}
                            {riwayat.length > 4 && <span className="text-xs text-gray-400">+{riwayat.length - 4}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {anggota.length > 0 && (
                <div className="border-t border-gray-100 p-4 flex items-center gap-3">
                  <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">{t("saveEntri")}</button>
                  <p className="text-xs text-gray-400">{t("entriSaveHint")}</p>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
