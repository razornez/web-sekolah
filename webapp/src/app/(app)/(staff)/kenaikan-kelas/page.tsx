import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { naikanKelas } from "./actions";
import { PageGuide } from "@/components/PageGuide";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const selCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 hover:border-gray-400 appearance-none";

export default async function KenaikanKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ berhasil?: string; rombel?: string }>;
}) {
  const sekolahId = await requireModule("rombel");
  const t = await getTranslations("kenaikanKelas");
  const sp = await searchParams;

  const [rombelList, tahunList, tingkatList] = await Promise.all([
    prisma.rombel.findMany({
      where: { sekolahId },
      orderBy: { id: "desc" }, // terbaru di atas
      include: {
        tahunAjaran: { select: { tahun: true, aktif: true } },
        tingkat: { select: { nama: true } },
        _count: { select: { anggota: true } },
        anggota: {
          include: { siswa: { select: { id: true, namaLengkap: true, nisn: true, foto: true } } },
          orderBy: { nomorAbsen: "asc" },
          take: 50,
        },
      },
    }),
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
    prisma.tingkat.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageGuide
        icon="🎓"
        title={t("title")}
        description={t("guideDescription")}
        tips={[
          t("tip1"),
          t("tip2"),
          t("tip3"),
          t("tip4"),
        ]}
      />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("headerDescription")}</p>
      </div>

      {/* Sukses */}
      {sp.berhasil && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <span className="text-lg">✅</span>
          <span>{t.rich("successMessage", { count: sp.berhasil, rombel: decodeURIComponent(sp.rombel ?? ""), b: (chunks) => <b>{chunks}</b> })}</span>
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">{t("formTitle")}</h2>
        <p className="mb-5 text-sm text-gray-500">{t("formDescription")}</p>

        <form action={naikanKelas} className="space-y-5">
          {/* Step 1 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">1</span>
              {t("step1Label")} <span className="text-red-500">*</span>
            </label>
            <RombelSelect
              sekolahId={sekolahId}
              name="rombelLamaId"
              defaultValue=""
              emptyLabel={t("step1Empty")}
              className={selCls}
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">2</span>
              {t("step2Label")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select name="tahunAjaranBaruId" required defaultValue="" className={selCls}>
                <option value="">{t("step2Empty")}</option>
                {tahunList.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    {ta.tahun}{ta.aktif ? t("tahunAktif") : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Step 3 — Tingkat & Nama side by side tapi lebar */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">3</span>
              {t("step3Label")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <div className="relative w-48 shrink-0">
                <select name="tingkatBaruId" required defaultValue="" className={selCls}>
                  <option value="">{t("tingkatEmpty")}</option>
                  {tingkatList.map((tk) => (
                    <option key={tk.id} value={tk.id}>
                      {tk.nama}{tk.fase ? t("faseSuffix", { fase: tk.fase }) : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <input
                name="namaRombelBaru"
                required
                placeholder={t("namaRombelPlaceholder")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 hover:border-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 pl-8">{t("namaRombelHint")}</p>
          </div>

          {/* Info */}
          <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 text-base">⚠️</span>
            <div>
              <div className="font-medium">{t("warningTitle")}</div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                <li>{t.rich("warning1", { b: (chunks) => <b>{chunks}</b> })}</li>
                <li>{t("warning2")}</li>
                <li>{t("warning3")}</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 active:bg-black"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {t("submitButton")}
          </button>
        </form>
      </div>

      {/* Tabel Rombel */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">{t("tableTitle", { count: rombelList.length })}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 text-left">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("colNama")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("colTahun")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("colTingkat")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("colAnggota")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("colAksi")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rombelList.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{t("empty")}</td></tr>
              )}
              {rombelList.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.nama}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {r.tahunAjaran.tahun}
                    {r.tahunAjaran.aktif && <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">{t("aktifBadge")}</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{r.tingkat.nama}</td>
                  <td className="px-5 py-3">
                    {/* Popup anggota dengan details/summary */}
                    <details className="group relative">
                      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 list-none">
                        {t("anggotaCount", { count: r._count.anggota })}
                        <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </summary>
                      <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                        <div className="mb-2 font-semibold text-xs text-gray-700 uppercase tracking-wide">{t("popupTitle", { nama: r.nama, count: r._count.anggota })}</div>
                        {r.anggota.length === 0 && <p className="text-xs text-gray-400">{t("popupEmpty")}</p>}
                        <ul className="max-h-48 overflow-y-auto space-y-0.5">
                          {r.anggota.map((a, i) => (
                            <li key={a.siswa.id} className="flex items-center gap-2 rounded py-0.5 text-xs">
                              <span className="w-5 shrink-0 text-gray-400">{i + 1}.</span>
                              <SiswaAvatar namaLengkap={a.siswa.namaLengkap} foto={a.siswa.foto} size="sm" />
                              <span className="text-gray-800">{a.siswa.namaLengkap}</span>
                              {a.siswa.nisn && <span className="ml-auto text-gray-400">{a.siswa.nisn}</span>}
                            </li>
                          ))}
                        </ul>
                        {r._count.anggota > 50 && <p className="mt-1 text-xs text-gray-400">{t("popupMore", { count: r._count.anggota - 50 })}</p>}
                      </div>
                    </details>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/rombel/${r.id}`} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">
                      {t("kelola")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
