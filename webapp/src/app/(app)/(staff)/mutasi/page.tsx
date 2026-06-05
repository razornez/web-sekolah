import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";
import { PageGuide } from "@/components/PageGuide";
import { saveMutasi, deleteMutasi } from "../prestasi/actions";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const inCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const PER = 30;

export default async function MutasiPage({ searchParams }: { searchParams: Promise<{ q?: string; jenis?: string; asal?: string; tujuan?: string; page?: string }> }) {
  const sekolahId = await requireModule("siswa");
  const t = await getTranslations("mutasi");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const jenis = sp.jenis ?? "";
  const asal = (sp.asal ?? "").trim();
  const tujuan = (sp.tujuan ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.MutasiSiswaWhereInput = {
    sekolahId,
    ...(jenis ? { jenis } : {}),
    ...(q ? { siswa: { namaLengkap: { contains: q, mode: "insensitive" } } } : {}),
    ...(asal ? { asalSekolah: { contains: asal, mode: "insensitive" } } : {}),
    ...(tujuan ? { tujuanSekolah: { contains: tujuan, mode: "insensitive" } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.mutasiSiswa.count({ where }),
    prisma.mutasiSiswa.findMany({
      where, orderBy: { tanggal: "desc" }, skip: (page - 1) * PER, take: PER,
      include: {
        siswa: { select: { id: true, namaLengkap: true, nisn: true, foto: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, include: { rombel: { select: { nama: true } } } } } },
        createdBy: { select: { namaLengkap: true, role: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) => `/mutasi?${new URLSearchParams({ q, jenis, asal, tujuan, page: String(p) }).toString()}`;

  return (
    <div className="space-y-5">
      <PageGuide
        icon="🔄"
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
          <p className="text-sm text-gray-500">{t("recordCount", { n: total.toLocaleString("id-ID") })}</p>
        </div>
      </div>

      {/* Form Catat Mutasi */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">{t("formTitle")}</h2>
        <form action={saveMutasi} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600">{t("fieldSiswa")}</label>
            <SiswaAutocomplete
              mode="select"
              name="siswaName"
              idName="siswaId"
              placeholder={t("siswaPlaceholder")}
              className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">{t("fieldJenis")}</label>
            <select name="jenis" defaultValue="keluar" className={`${inCls} w-full`}>
              <option value="masuk">{t("jenisMasukLong")}</option>
              <option value="keluar">{t("jenisKeluarLong")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">{t("fieldAsal")}</label>
            <input name="asalSekolah" placeholder={t("asalPlaceholder")} className={`${inCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">{t("fieldTujuan")}</label>
            <input name="tujuanSekolah" placeholder={t("tujuanPlaceholder")} className={`${inCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">{t("fieldTanggal")}</label>
            <input type="date" name="tanggal" defaultValue={new Date().toISOString().slice(0, 10)} className={`${inCls} w-full`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600">{t("fieldAlasan")}</label>
            <input name="alasan" placeholder={t("alasanPlaceholder")} className={`${inCls} w-full`} />
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("saveButton")}</button>
          </div>
        </form>
      </div>

      {/* Filter & Search */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">{t("jenisLabel")}</span>
          {[["", t("all")], ["masuk", t("jenisMasuk")], ["keluar", t("jenisKeluar")]].map(([val, lbl]) => (
            <Link key={val} href={`/mutasi?${new URLSearchParams({ q, jenis: val, asal, tujuan, page: "1" }).toString()}`} className={`rounded-full border px-2.5 py-0.5 text-xs ${jenis === val ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>{lbl}</Link>
          ))}
        </div>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input type="hidden" name="jenis" value={jenis} />
          <input type="hidden" name="page" value="1" />
          {/* Autocomplete nama siswa */}
          <div className="sm:col-span-2">
            <SiswaAutocomplete name="q" defaultValue={q} placeholder={t("searchSiswaPlaceholder")} />
          </div>
          <input name="asal" defaultValue={asal} placeholder={t("asalFilterPlaceholder")} className={inCls} />
          <input name="tujuan" defaultValue={tujuan} placeholder={t("tujuanFilterPlaceholder")} className={inCls} />
          <div className="flex gap-2 sm:col-span-4">
            <button className="rounded-md border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100">{t("applyFilter")}</button>
            {(q || jenis || asal || tujuan) && <Link href="/mutasi" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">{t("reset")}</Link>}
          </div>
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colSiswa")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colJenis")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colSekolah")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colAlasan")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colTanggal")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colDiinput")}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colAksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">{t("empty")}</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {m.siswa ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <SiswaAvatar namaLengkap={m.siswa.namaLengkap} foto={m.siswa.foto} size="sm" />
                        <Link href={`/siswa/${m.siswa.id}`} className="font-medium text-gray-900 hover:text-indigo-700 hover:underline">{m.siswa.namaLengkap}</Link>
                      </div>
                      <div className="text-xs text-gray-400">{m.siswa.nisn ?? "—"}{m.siswa.anggotaRombel[0] ? ` · ${m.siswa.anggotaRombel[0].rombel.nama}` : ""}</div>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${m.jenis === "masuk" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {m.jenis === "masuk" ? t("badgeMasuk") : t("badgeKeluar")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {m.jenis === "masuk" ? (
                    <span>{t("fromLabel", { sekolah: m.asalSekolah ?? "—" })}</span>
                  ) : (
                    <span>{t("toLabel", { sekolah: m.tujuanSekolah ?? "—" })}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{m.alasan ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmt(m.tanggal)}</td>
                <td className="px-4 py-3">
                  {m.createdBy ? (
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">{m.createdBy.namaLengkap}</span>
                      <span className="ml-1 text-gray-400">({m.createdBy.role})</span>
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDelete action={deleteMutasi} id={m.id} message={t("deleteConfirm")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{t("pageInfo", { page, total: totalPages })}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hp(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">{t("prev")}</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">{t("next")}</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
