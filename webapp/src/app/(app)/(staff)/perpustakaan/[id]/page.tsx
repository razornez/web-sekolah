import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { kembalikanBuku } from "../actions";
import BukuForm from "../_components/BukuForm";

const COVER_COLORS: [string, string][] = [
  ["#1a2e4a","#c9a84c"],
  ["#1d4d3e","#a8d5a2"],
  ["#6b21a8","#e9d5ff"],
  ["#7f1d1d","#fca5a5"],
  ["#1e3a5f","#93c5fd"],
  ["#92400e","#fde68a"],
  ["#065f46","#6ee7b7"],
  ["#1f2937","#9ca3af"],
];
function coverColor(str: string): [string, string] {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return COVER_COLORS[h % COVER_COLORS.length];
}

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function DetailBukuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const sekolahId = await requireModule("perpustakaan");
  const t = await getTranslations("perpustakaan");
  const { id } = await params;
  const tab = (await searchParams).tab ?? "detail";

  const buku = await prisma.bukuPerpustakaan.findFirst({
    where: { id: Number(id), sekolahId },
    include: {
      pinjaman: {
        orderBy: { tanggalPinjam: "desc" },
        include: { siswa: { select: { id: true, namaLengkap: true, nisn: true } } },
      },
    },
  });
  if (!buku) notFound();

  const aktif = buku.pinjaman.filter((p) => !p.tanggalKembali);
  const selesai = buku.pinjaman.filter((p) => p.tanggalKembali);
  const today = new Date();
  const dayDiff = (d: Date) => Math.floor((today.getTime() - d.getTime()) / 86400000);
  const dueDate = (p: { tanggalPinjam: Date; durasiHari: number | null }) => {
    const ms = p.tanggalPinjam.getTime() + (p.durasiHari ?? 7) * 86400000;
    return new Date(ms);
  };

  const [bg, fg] = coverColor(buku.judul);
  const abbr = buku.judul.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  const stokTersedia = buku.jumlahEksemplar - aktif.length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/perpustakaan" className="hover:text-gray-900">{t("detailBreadcrumb")}</Link>
        <span>/</span>
        <span className="text-gray-700 line-clamp-1">{buku.judul}</span>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        <div style={{ background: `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb,${bg} 80%,black))` }} className="px-8 py-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Big cover */}
            <div style={{ background: `linear-gradient(160deg, color-mix(in srgb,${bg} 70%,white) 0%, ${bg} 100%)`, minHeight: 168 }} className="relative flex w-28 shrink-0 flex-col items-center justify-center rounded-xl shadow-2xl overflow-hidden">
              <div style={{ background: fg, width: 8 }} className="absolute left-0 top-0 bottom-0" />
              <div style={{ color: fg }} className="px-3 py-4 text-center pl-5">
                <div className="text-4xl font-black leading-none tracking-tight">{abbr}</div>
                <div style={{ color: `${fg}bb` }} className="mt-2 text-[9px] leading-tight break-words line-clamp-4 font-medium">
                  {buku.judul}
                </div>
              </div>
              <div style={{ background: fg, opacity: 0.2 }} className="h-5 w-full" />
            </div>

            {/* Title & meta */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white leading-snug">{buku.judul}</h1>
              {buku.pengarang && <p style={{ color: `${fg}dd` }} className="mt-1 text-sm">{buku.pengarang}</p>}
              {buku.penerbit && <p style={{ color: `${fg}99` }} className="text-xs">{buku.penerbit}{buku.tahunTerbit ? ` · ${buku.tahunTerbit}` : ""}</p>}
              {buku.isbn && <p style={{ color: `${fg}77` }} className="mt-1 text-xs">ISBN: {buku.isbn}</p>}

              {/* Stok gauge */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-2">
                  <div className="text-xs font-medium text-white/60">{t("statEksemplar")}</div>
                  <div className="text-2xl font-bold text-white leading-none">{buku.jumlahEksemplar}</div>
                </div>
                <div className={`rounded-xl px-4 py-2 ${stokTersedia > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <div className="text-xs font-medium text-white/60">{t("statTersedia")}</div>
                  <div className={`text-2xl font-bold leading-none ${stokTersedia > 0 ? "text-green-300" : "text-red-300"}`}>{stokTersedia}</div>
                </div>
                <div className="rounded-xl bg-amber-400/20 px-4 py-2">
                  <div className="text-xs font-medium text-white/60">{t("statDipinjam")}</div>
                  <div className="text-2xl font-bold text-amber-300 leading-none">{aktif.length}</div>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2">
                  <div className="text-xs font-medium text-white/60">{t("statTotalTransaksi")}</div>
                  <div className="text-2xl font-bold text-white leading-none">{buku.pinjaman.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4">
          {[["detail",t("tabDetail")],["pinjaman",t("tabPeminjamAktif")],["riwayat",t("tabRiwayat")]].map(([key, l]) => (
            <Link key={key} href={`/perpustakaan/${buku.id}?tab=${key}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {l}
              {key === "pinjaman" && aktif.length > 0 && (
                <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${aktif.some(p => dayDiff(p.tanggalPinjam) > (p.durasiHari ?? 7)) ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  {aktif.length}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="p-6">
          {/* --- TAB: Detail & Edit --- */}
          {tab === "detail" && (
            <BukuForm
              initial={{
                id: buku.id,
                judul: buku.judul,
                pengarang: buku.pengarang,
                penerbit: buku.penerbit,
                tahunTerbit: buku.tahunTerbit,
                isbn: buku.isbn,
                jumlahBuku: buku.jumlahBuku,
                jumlahEksemplar: buku.jumlahEksemplar,
              }}
            />
          )}

          {/* --- TAB: Peminjam Aktif --- */}
          {tab === "pinjaman" && (
            <div className="space-y-4">
              {aktif.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                  <div className="text-4xl">📚</div>
                  <p className="mt-2 text-sm text-gray-500">{t("allCopiesAvailable")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aktif.map((p) => {
                    const due = dueDate(p);
                    const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);
                    const overdue = daysLeft < 0;
                    const borrowed = dayDiff(p.tanggalPinjam);
                    return (
                      <div key={p.id} className={`flex items-center gap-4 rounded-xl border p-4 ${overdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
                        {/* Avatar */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${overdue ? "bg-red-200 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                          {p.siswa?.namaLengkap?.charAt(0) ?? "?"}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {p.siswa ? (
                            <Link href={`/siswa/${p.siswa.id}`} className="font-semibold text-gray-900 hover:underline">
                              {p.siswa.namaLengkap}
                            </Link>
                          ) : <span className="text-gray-500">—</span>}
                          <div className="flex flex-wrap gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">{t("labelPinjam", { tanggal: fmt(p.tanggalPinjam) })}</span>
                            <span className="text-xs text-gray-500">{t("labelJatuhTempo", { tanggal: fmt(due) })}</span>
                          </div>
                        </div>
                        {/* Status */}
                        <div className="shrink-0 text-right">
                          {overdue ? (
                            <div>
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                {t("daysLate", { n: Math.abs(daysLeft) })}
                              </span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${daysLeft <= 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                              {daysLeft === 0 ? t("today") : t("daysLeftLong", { n: daysLeft })}
                            </span>
                          )}
                          <div className="mt-1 text-xs text-gray-400">{t("daysBorrowedLong", { n: borrowed })}</div>
                        </div>
                        {/* Return action */}
                        <form action={kembalikanBuku}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="siswaId" value={p.siswaId ?? ""} />
                          <input type="hidden" name="redirect" value={`/perpustakaan/${buku.id}?tab=pinjaman`} />
                          <button className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${overdue ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                            {t("kembalikan")}
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <Link href={`/perpustakaan/pinjam`} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                  {t("lendThisBook")}
                </Link>
              </div>
            </div>
          )}

          {/* --- TAB: Riwayat --- */}
          {tab === "riwayat" && (
            <div className="space-y-3">
              {selesai.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <p className="text-sm text-gray-400">{t("noReturnHistory")}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colPeminjam")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colTglPinjam")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colTglKembali")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("colDurasiAktual")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selesai.map((p) => {
                        const days = p.tanggalKembali
                          ? Math.max(0, Math.floor((p.tanggalKembali.getTime() - p.tanggalPinjam.getTime()) / 86400000))
                          : null;
                        const late = days !== null && p.durasiHari && days > p.durasiHari;
                        return (
                          <tr key={p.id} className={`hover:bg-gray-50 ${late ? "bg-red-50/40" : ""}`}>
                            <td className="px-4 py-3">
                              {p.siswa ? (
                                <Link href={`/siswa/${p.siswa.id}`} className="font-medium text-gray-900 hover:underline">
                                  {p.siswa.namaLengkap}
                                </Link>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{fmt(p.tanggalPinjam)}</td>
                            <td className="px-4 py-3 text-gray-600">{fmt(p.tanggalKembali ?? null)}</td>
                            <td className="px-4 py-3">
                              {days !== null ? (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${late ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                                  {late ? t("durationDaysLate", { n: days }) : t("durationDays", { n: days })}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
