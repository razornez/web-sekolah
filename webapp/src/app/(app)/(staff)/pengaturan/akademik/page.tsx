import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ConfirmForm } from "@/components/ConfirmForm";
import {
  saveTahunAjaran, setTahunAjaranAktif, deleteTahunAjaran,
  savePeriode, setPeriodeAktif, deletePeriode,
  updatePeriodeTanggal, autoIsiKalender,
} from "./actions";

const inCls = "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function weeksBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (7 * 86400000));
}

/** Hitung hari sekolah (Senin–Jumat) dalam rentang [from, to] */
function countSchoolDays(from: Date | null, to: Date | null): number {
  if (!from || !to) return 0;
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Pertemuan per jadwal berdasarkan frekuensi */
function meetingCount(schoolDays: number, freqPerWeek: number): number {
  return Math.round((schoolDays / 5) * freqPerWeek);
}

export default async function AkademikPage() {
  const sekolahId = await requireModule("pengaturan");
  const t = await getTranslations("pengaturan");

  const tahunList = await prisma.tahunAjaran.findMany({
    where: { sekolahId },
    orderBy: { tahun: "desc" },
    include: {
      periode: {
        orderBy: { urutan: "asc" },
        include: {
          _count: { select: { nilaiRapor: true, raporCatatan: true } },
        },
      },
      _count: { select: { rombel: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("akademikTitle")}</h1>
        <p className="text-sm text-gray-500">{t("akademikSubtitle")}</p>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
        <p className="font-semibold mb-1">{t("infoTitle")}</p>
        <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
          <li><strong>{t("infoPresensiLabel")}</strong> — {t("infoPresensiDesc")} <code>tanggalMulai</code> {t("infoPresensiUntil")} <code>tanggalSelesai</code> {t("infoPresensiSuffix")}</li>
          <li><strong>{t("infoRaporLabel")}</strong> — {t("infoRaporDesc")}</li>
          <li><strong>{t("infoEfektifLabel")}</strong> — {t("infoEfektifDesc")}</li>
        </ul>
      </div>

      {/* Tambah Tahun Ajaran */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">{t("tambahTaTitle")}</h2>
        <form action={saveTahunAjaran} className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldFormatTahun")}</label>
            <input name="tahun" required placeholder="2025/2026" pattern="\d{4}/\d{4}"
              className={`${inCls} w-36 font-mono`} />
          </div>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            {t("tambah")}
          </button>
        </form>
      </div>

      {/* Daftar Tahun Ajaran */}
      {tahunList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          {t("emptyTa")}
        </div>
      ) : (
        <div className="space-y-4">
          {tahunList.map((ta) => (
            <div key={ta.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${ta.aktif ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"}`}>

              {/* TA header */}
              <div className={`flex items-center justify-between px-5 py-3.5 ${ta.aktif ? "bg-indigo-600" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black font-mono ${ta.aktif ? "text-white" : "text-gray-900"}`}>
                    {ta.tahun}
                  </span>
                  {ta.aktif
                    ? <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">{t("taAktif")}</span>
                    : <span className="text-xs text-gray-400">{t("taStats", { rombel: ta._count.rombel, periode: ta.periode.length })}</span>
                  }
                </div>
                <div className="flex gap-2 items-center">
                  {/* Auto-isi kalender */}
                  <form action={autoIsiKalender}>
                    <input type="hidden" name="tahunAjaranId" value={ta.id} />
                    <button
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      title={t("autoIsiKalenderTitle")}
                    >
                      {t("autoIsiKalender")}
                    </button>
                  </form>
                  {!ta.aktif && (
                    <ConfirmForm
                      action={setTahunAjaranAktif}
                      message={t("confirmAktifkanTa", { tahun: ta.tahun })}
                    >
                      <input type="hidden" name="id" value={ta.id} />
                      <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        {t("aktifkanTa")}
                      </button>
                    </ConfirmForm>
                  )}
                  {ta._count.rombel === 0 && ta.periode.every(p => p._count.nilaiRapor === 0 && p._count.raporCatatan === 0) ? (
                    <ConfirmDelete action={deleteTahunAjaran} id={ta.id} message={t("confirmHapusTa", { tahun: ta.tahun })} />
                  ) : !ta.aktif && (
                    <span className="rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs text-gray-400" title={t("taTidakBisaDihapusTitle")}>
                      {t("taTidakBisaDihapus")}
                    </span>
                  )}
                </div>
              </div>

              {/* Periode list */}
              <div className="divide-y divide-gray-100">
                {ta.periode.length === 0 && (
                  <div className="px-5 py-4 text-sm text-gray-400">{t("emptyPeriode")}</div>
                )}
                {ta.periode.map((p) => {
                  const weeks = weeksBetween(p.tanggalMulai, p.tanggalSelesai);
                  const schoolDays = countSchoolDays(p.tanggalMulai, p.tanggalSelesai);
                  const meet1x = meetingCount(schoolDays, 1);
                  const meet2x = meetingCount(schoolDays, 2);
                  const hasDates = p.tanggalMulai && p.tanggalSelesai;
                  const dataCount = p._count.nilaiRapor + p._count.raporCatatan;
                  const bisa_hapus = dataCount === 0;

                  return (
                    <div key={p.id} className={`px-5 py-4 ${p.aktif ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}>
                      {/* Row 1: Nama + status + aksi */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-gray-900">{p.nama}</span>
                          {p.aktif
                            ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">{t("periodeAktif")}</span>
                            : null
                          }
                          <span className="text-xs text-gray-400">{t("urutan", { n: p.urutan })}</span>
                        </div>

                        {/* Aksi — dipisah jelas dari info */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!p.aktif && (
                            <ConfirmForm
                              action={setPeriodeAktif}
                              message={t("confirmAktifkanPeriode", { nama: p.nama, tahun: ta.tahun })}
                            >
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="tahunAjaranId" value={ta.id} />
                              <button className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                                {t("aktifkan")}
                              </button>
                            </ConfirmForm>
                          )}
                          {bisa_hapus ? (
                            <ConfirmDelete action={deletePeriode} id={p.id} message={t("confirmHapusPeriode", { nama: p.nama })} />
                          ) : (
                            <span className="rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs text-gray-400"
                              title={t("periodeDataCountTitle", { n: dataCount })}>
                              {t("periodeDataCount", { n: dataCount })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Edit tanggal inline */}
                      <form action={updatePeriodeTanggal} className="flex flex-wrap items-center gap-2 mt-1">
                        <input type="hidden" name="id" value={p.id} />
                        <span className="text-xs text-gray-400 shrink-0">📅</span>
                        <input
                          type="date" name="tanggalMulai"
                          defaultValue={p.tanggalMulai ? p.tanggalMulai.toISOString().slice(0, 10) : ""}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-indigo-400 w-36"
                        />
                        <span className="text-xs text-gray-400">—</span>
                        <input
                          type="date" name="tanggalSelesai"
                          defaultValue={p.tanggalSelesai ? p.tanggalSelesai.toISOString().slice(0, 10) : ""}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-indigo-400 w-36"
                        />
                        <button className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs hover:bg-gray-50">
                          {t("simpan")}
                        </button>
                        {weeks !== null && (
                          <span className={`text-xs font-semibold ${weeks <= 18 && weeks >= 14 ? "text-green-600" : "text-amber-600"}`}>
                            {t("weeks", { n: weeks })}
                          </span>
                        )}

                        {/* Pertemuan info */}
                        {hasDates && (
                          <div className="flex gap-1.5 ml-auto">
                            <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-center min-w-[64px]">
                              <div className="text-sm font-black text-gray-900 leading-none">{schoolDays}</div>
                              <div className="text-[10px] text-gray-400">{t("hariSekolah")}</div>
                            </div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-center min-w-[64px]" title={t("pertemuanTitle")}>
                              <div className="text-sm font-black text-blue-700 leading-none">{meet1x}</div>
                              <div className="text-[10px] text-blue-500">{t("pertemuan")}</div>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  );
                })}
              </div>

              {/* Tambah Periode */}
              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 select-none">
                    <span className="group-open:hidden">{t("tambahPeriode")}</span>
                    <span className="hidden group-open:inline">{t("tutupPeriode")}</span>
                  </summary>
                  <form action={savePeriode} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="tahunAjaranId" value={ta.id} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldNamaPeriode")}</label>
                      <input name="nama" required placeholder={t("placeholderNamaPeriode")} className={`${inCls} min-w-[180px]`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldUrutan")}</label>
                      <input name="urutan" type="number" min={1} defaultValue={ta.periode.length + 1} className={`${inCls} w-16`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldTanggalMulai")}</label>
                      <input name="tanggalMulai" type="date" className={inCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldTanggalSelesai")}</label>
                      <input name="tanggalSelesai" type="date" className={inCls} />
                    </div>
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                      {t("simpanPeriode")}
                    </button>
                  </form>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
