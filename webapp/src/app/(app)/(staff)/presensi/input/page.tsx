import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { SiswaAvatar } from "@/components/SiswaAvatar";
import { savePresensi } from "../actions";

const STATUS: { key: string; bg: string; ring: string }[] = [
  { key: "hadir", bg: "peer-checked:bg-emerald-500", ring: "peer-checked:ring-emerald-300" },
  { key: "terlambat", bg: "peer-checked:bg-amber-400", ring: "peer-checked:ring-amber-200" },
  { key: "izin", bg: "peer-checked:bg-sky-400", ring: "peer-checked:ring-sky-200" },
  { key: "sakit", bg: "peer-checked:bg-violet-400", ring: "peer-checked:ring-violet-200" },
  { key: "alpa", bg: "peer-checked:bg-red-500", ring: "peer-checked:ring-red-300" },
];

export default async function InputPresensiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; tanggal?: string }>;
}) {
  const sekolahId = await requireModule("presensi");
  const t = await getTranslations("presensi");
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const today = new Date();
  const tanggal = sp.tanggal || today.toISOString().slice(0, 10);

  const anggota = rombelId
    ? await prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true, foto: true } } },
      })
    : [];

  // Status existing pada tanggal tsb
  const existing = rombelId
    ? await prisma.kehadiranSiswa.findMany({
        where: { sekolahId, tanggal: new Date(tanggal), siswaId: { in: anggota.map((a) => a.siswaId) } },
        select: { siswaId: true, status: true },
      })
    : [];
  const statusMap = new Map(existing.map((e) => [e.siswaId, e.status]));

  const statusLabel = (k: string) => {
    try { return t(`status${k.charAt(0).toUpperCase()}${k.slice(1)}`); } catch { return k; }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("inputTitle")}</h1>
          <p className="text-sm text-gray-500">{t("inputSubtitle")}</p>
        </div>
        <Link href="/presensi" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">{t("inputCalendarLink")}</Link>
      </div>

      {/* Filter */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("filterKelas")}</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className="rounded-md border border-gray-300 px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Tanggal</label>
          <input type="date" name="tanggal" defaultValue={tanggal} max={today.toISOString().slice(0, 10)} className="rounded-md border border-gray-300 px-2 py-2 text-sm" />
        </div>
        <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">{t("inputTampilkan")}</button>
      </form>

      {!rombelId && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          <div className="text-4xl">📝</div>
          <p className="mt-2 text-sm">{t("inputPilihKelas")}</p>
        </div>
      )}

      {rombelId > 0 && (
        <form action={savePresensi} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <input type="hidden" name="tanggal" value={tanggal} />

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {STATUS.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-full ${s.bg.replace("peer-checked:", "")}`} />{statusLabel(s.key)}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12">{t("inputKolomNo")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inputKolomNama")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inputKolomStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">{t("inputKosong")}</td></tr>}
                {anggota.map((a, i) => {
                  const cur = statusMap.get(a.siswaId) ?? "hadir";
                  return (
                    <tr key={a.siswaId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400">{a.nomorAbsen ?? i + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <SiswaAvatar namaLengkap={a.siswa.namaLengkap} foto={a.siswa.foto} size="sm" />
                          <span className="font-medium text-gray-900">{a.siswa.namaLengkap}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS.map((s) => (
                            <label key={s.key} className="cursor-pointer">
                              <input type="radio" name={`status_${a.siswaId}`} value={s.key} defaultChecked={cur === s.key} className="peer sr-only" />
                              <span className={`inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors peer-checked:text-white peer-checked:border-transparent ${s.bg}`}>
                                {statusLabel(s.key)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {anggota.length > 0 && (
            <div className="flex justify-end">
              <button className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">{t("inputSimpan")}</button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
