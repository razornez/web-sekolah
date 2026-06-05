import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPpdb } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmForm } from "@/components/ConfirmForm";
import { DokumenForm } from "../_components/DokumenForm";
import {
  updateStatusPendaftar,
  softDeletePendaftar,
  restorePendaftar,
  deleteDokumen,
} from "../actions";

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const STATUS_STEPS: { key: StatusPpdb; labelKey: string; color: string; icon: string }[] = [
  { key: "baru",       labelKey: "stepBaru",       color: "border-gray-300 text-gray-600",      icon: "📋" },
  { key: "verifikasi", labelKey: "stepVerifikasi",  color: "border-blue-400 text-blue-700",     icon: "🔍" },
  { key: "tes",        labelKey: "stepTes",         color: "border-purple-400 text-purple-700", icon: "📝" },
  { key: "wawancara",  labelKey: "stepWawancara",   color: "border-indigo-400 text-indigo-700", icon: "💬" },
  { key: "diterima",   labelKey: "stepDiterima",    color: "border-green-400 text-green-700",   icon: "✅" },
  { key: "cadangan",   labelKey: "stepCadangan",    color: "border-amber-400 text-amber-700",   icon: "🟡" },
  { key: "ditolak",    labelKey: "stepDitolak",     color: "border-red-400 text-red-700",       icon: "❌" },
];

const JENIS_DOKUMEN: { key: string; labelKey: string }[] = [
  { key: "ijazah",            labelKey: "dokIjazah" },
  { key: "rapor",             labelKey: "dokRapor" },
  { key: "prestasi",          labelKey: "dokPrestasi" },
  { key: "kwitansi",          labelKey: "dokKwitansi" },
  { key: "ktp_ortu",          labelKey: "dokKtpOrtu" },
  { key: "kartu_keluarga",    labelKey: "dokKartuKeluarga" },
  { key: "foto",              labelKey: "dokFoto" },
  { key: "surat_keterangan",  labelKey: "dokSuratKeterangan" },
  { key: "lainnya",           labelKey: "dokLainnya" },
];

export default async function PpdbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireModule("ppdb");
  const t = await getTranslations("ppdb");
  const { id } = await params;

  const p = await prisma.pendaftaranPpdb.findFirst({
    where: { id: Number(id), sekolahId },
    include: {
      jalur: { select: { id: true, nama: true } },
      riwayat: { orderBy: { createdAt: "asc" } },
      dokumen: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) notFound();

  const jalurList = await prisma.jalurPpdb.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } });

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === p.status);
  const isTerminal = p.status === "diterima" || p.status === "ditolak";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/ppdb" className="hover:text-gray-900">{t("ppdbBreadcrumb")}</Link>
        <span>/</span>
        <span className="text-gray-700">{p.namaLengkap}</span>
        {p.deletedAt && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t("archived")}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom kiri: Biodata + Tahapan + Dokumen */}
        <div className="space-y-5 lg:col-span-2">

          {/* Biodata card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-black text-indigo-700">
                {p.namaLengkap.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{p.namaLengkap}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {p.nisn && <span>{t("labelNisn", { nisn: p.nisn })}</span>}
                  <span>{p.jenisKelamin === "L" ? t("male") : t("female")}</span>
                  {p.jalur && <span>{t("labelJalurInline", { nama: p.jalur.nama })}</span>}
                  <span>{t("labelDaftar", { date: fmt(p.createdAt) })}</span>
                </div>
              </div>
              {/* Current status badge */}
              {(() => {
                const s = STATUS_STEPS.find((x) => x.key === p.status);
                return s ? (
                  <span className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${s.color}`}>
                    {s.icon} {t(s.labelKey)}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-gray-400">{t("fieldTempatLahir")}</p>
                <p className="text-gray-800">{p.tempatLahir ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">{t("fieldTanggalLahir")}</p>
                <p className="text-gray-800">{fmtDate(p.tanggalLahir)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">{t("fieldAsalSekolah")}</p>
                <p className="text-gray-800">{p.asalSekolah ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">{t("fieldNoHp")}</p>
                <p className="text-gray-800">{p.noHp ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">{t("fieldTahunAjaran")}</p>
                <p className="text-gray-800">{p.tahunAjaran ?? "—"}</p>
              </div>
              {p.alamat && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-400">{t("fieldAlamat")}</p>
                  <p className="text-gray-800">{p.alamat}</p>
                </div>
              )}
              {p.catatan && (
                <div className="sm:col-span-3">
                  <p className="text-xs font-medium text-gray-400">{t("fieldCatatanAlasan")}</p>
                  <p className={`rounded-lg px-3 py-2 text-sm mt-1 ${p.status === "diterima" ? "bg-green-50 text-green-800" : p.status === "ditolak" ? "bg-red-50 text-red-800" : "bg-gray-50 text-gray-700"}`}>
                    {p.catatan}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Tahapan */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-800">{t("sectionAlurTahapan")}</h2>
            </div>

            {/* Step indicator */}
            <div className="overflow-x-auto px-5 py-4">
              <div className="flex items-center gap-0 min-w-max">
                {STATUS_STEPS.filter(s => !["cadangan","ditolak"].includes(s.key)).map((s, i, arr) => {
                  const done = STATUS_STEPS.findIndex(x => x.key === p.status) > i ||
                    (p.status === s.key);
                  const active = p.status === s.key;
                  return (
                    <div key={s.key} className="flex items-center">
                      <div className={`flex flex-col items-center`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all
                          ${active ? "border-indigo-600 bg-indigo-600 text-white shadow-md" :
                          done ? "border-green-500 bg-green-50 text-green-700" :
                          "border-gray-200 bg-white text-gray-400"}`}>
                          {done && !active ? "✓" : s.icon}
                        </div>
                        <span className={`mt-1 text-center text-[10px] font-medium whitespace-nowrap ${active ? "text-indigo-700" : done ? "text-green-700" : "text-gray-400"}`}>
                          {t(s.labelKey)}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`h-0.5 w-12 mx-1 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
                {/* Terminal states */}
                {(p.status === "cadangan" || p.status === "ditolak") && (
                  <div className={`ml-4 flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 ${p.status === "ditolak" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
                    <span>{STATUS_STEPS.find(s => s.key === p.status)?.icon}</span>
                    <span className={`text-sm font-bold ${p.status === "ditolak" ? "text-red-700" : "text-amber-700"}`}>
                      {(() => { const s = STATUS_STEPS.find(s => s.key === p.status); return s ? t(s.labelKey) : null; })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Riwayat history list */}
            {p.riwayat.length > 0 && (
              <div className="border-t border-gray-100 px-5 pb-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t("riwayatPerubahan")}</p>
                <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
                  {p.riwayat.map((r) => {
                    const s = STATUS_STEPS.find((x) => x.key === r.status);
                    return (
                      <li key={r.id} className="ml-5">
                        <div className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${r.status === "diterima" ? "bg-green-500" : r.status === "ditolak" ? "bg-red-500" : "bg-gray-400"}`} />
                        <div className="flex flex-wrap items-start gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${s?.color}`}>
                            {s?.icon} {s ? t(s.labelKey) : null}
                          </span>
                          <span className="text-xs text-gray-400">{fmt(r.createdAt)}</span>
                          {r.oleh && <span className="text-xs text-gray-400">{t("byUser", { oleh: r.oleh })}</span>}
                        </div>
                        {r.catatan && (
                          <p className="mt-1 text-xs text-gray-600 italic">"{r.catatan}"</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          {/* Dokumen */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">{t("sectionDokumen", { n: p.dokumen.length })}</h2>
            </div>

            {/* Add dokumen form */}
            <DokumenForm pendaftaranId={p.id} />

            {/* Dokumen list */}
            <div className="divide-y divide-gray-100">
              {p.dokumen.length === 0 ? (
                <p className="px-5 py-6 text-sm text-center text-gray-400">{t("emptyDokumen")}</p>
              ) : p.dokumen.map((d) => {
                const jenis = JENIS_DOKUMEN.find((j) => j.key === d.jenis);
                return (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{d.nama}</span>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {jenis ? t(jenis.labelKey) : d.jenis}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {d.keterangan && <span className="text-xs text-gray-400">{d.keterangan}</span>}
                        <span className="text-xs text-gray-300">{fmt(d.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100">
                          {t("openDoc")}
                        </a>
                      )}
                      <form action={deleteDokumen}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="pendaftaranId" value={p.id} />
                        <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
                          {t("deleteDoc")}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom kanan: Update Status + Aksi */}
        <div className="space-y-5">
          {/* Update Status */}
          {!p.deletedAt && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-3">
                <h2 className="font-semibold text-gray-800">{t("sectionUpdateStatus")}</h2>
              </div>
              <form action={updateStatusPendaftar} className="space-y-4 p-5">
                <input type="hidden" name="id" value={p.id} />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">{t("tahapBaru")}</label>
                  <div className="space-y-2">
                    {STATUS_STEPS.map((s) => (
                      <label key={s.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-colors hover:border-gray-400 ${p.status === s.key ? s.color + " border-current" : "border-gray-200"}`}>
                        <input type="radio" name="status" value={s.key} defaultChecked={p.status === s.key} className="accent-gray-900" />
                        <span className="text-sm font-medium">{s.icon} {t(s.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {t("fieldCatatanAlasan")} <span className="font-normal text-gray-400">{t("catatanHint")}</span>
                  </label>
                  <textarea name="catatan" rows={3} defaultValue={p.catatan ?? ""}
                    placeholder={t("placeholderCatatan")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 resize-none" />
                </div>
                <button className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
                  {t("simpanPerubahan")}
                </button>
              </form>
            </div>
          )}

          {/* Aksi lainnya */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-800">{t("sectionAksi")}</h2>
            </div>
            <div className="space-y-2 p-5">
              {p.deletedAt ? (
                <>
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {t("archivedOn", { date: fmt(p.deletedAt) })}
                  </p>
                  <form action={restorePendaftar}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="w-full rounded-xl border border-green-300 bg-green-50 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
                      {t("pulihkanData")}
                    </button>
                  </form>
                </>
              ) : (
                <ConfirmForm action={softDeletePendaftar} message={t("confirmArchive")}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="w-full rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    {t("arsipkanSoftDelete")}
                  </button>
                </ConfirmForm>
              )}
            </div>
          </div>

          {/* Info jalur */}
          {p.jalur && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{t("jalurPendaftaran")}</p>
              <p className="font-bold text-indigo-900">{p.jalur.nama}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
