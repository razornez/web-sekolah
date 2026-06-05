import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ConfirmForm } from "@/components/ConfirmForm";
import { GuruSelect } from "@/components/filters/GuruSelect";
import { createEkstra, deleteEkstra, restoreEkstra } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

// Warna card per ekstra berdasarkan hash nama
const CARD_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
  "bg-purple-50 border-purple-200",
  "bg-amber-50 border-amber-200",
  "bg-rose-50 border-rose-200",
  "bg-cyan-50 border-cyan-200",
  "bg-orange-50 border-orange-200",
  "bg-teal-50 border-teal-200",
];
function cardColor(nama: string) {
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return CARD_COLORS[h % CARD_COLORS.length];
}

// Kategori ekskul sederhana dari nama (urutan spesifik → umum)
const KATEGORI_ICON: [RegExp, string][] = [
  [/pramuka|scout/i, "⛺"],
  [/basket/i, "🏀"],
  [/voli|volly|volley|bola voli/i, "🏐"],
  [/futsal|sepak.*bola|sepakbola/i, "⚽"],
  [/badminton|bulu.*tangkis/i, "🏸"],
  [/tenis.*meja|pingpong|ping.*pong/i, "🏓"],
  [/catur|chess/i, "♟️"],
  [/seni|tari|musik|band|paduan.*suara|drama|teater|vokal/i, "🎭"],
  [/pmr|kesehatan|medis/i, "🏥"],
  [/komputer|coding|robotik|tekno|it/i, "💻"],
  [/english|debat|speak|jurnali|bahasa/i, "📢"],
  [/paskibra|drumband/i, "🥁"],
  [/karate|silat|pencak|taekwondo|beladiri|tapak.*suci/i, "🥋"],
  [/renang|atletik|lari/i, "🏃"],
  [/rohis|rohani|keagamaan|tahfiz|qiro/i, "🕌"],
];
function getIcon(nama: string) {
  for (const [re, icon] of KATEGORI_ICON) if (re.test(nama)) return icon;
  return "🎯";
}

export default async function EkstrakurikulerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; arsip?: string }>;
}) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const t = await getTranslations("ekstrakurikuler");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const showArsip = sp.arsip === "1";

  const rows = await prisma.ekstrakurikuler.findMany({
    where: {
      sekolahId,
      deletedAt: showArsip ? { not: null } : null,
      ...(q ? { nama: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { nama: "asc" },
    include: {
      pembina: { select: { id: true, namaGuru: true } },
      _count: { select: { anggota: true } },
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-sm text-gray-500">{showArsip ? t("countArchived", { n: rows.length }) : t("countActive", { n: rows.length })}</p>
        </div>
        <div className="flex gap-2">
          <Link href={showArsip ? "/ekstrakurikuler" : "/ekstrakurikuler?arsip=1"}
            className={`rounded-lg border px-3 py-2 text-sm ${showArsip ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 hover:bg-gray-50"}`}>
            {showArsip ? t("backToActive") : t("archive")}
          </Link>
        </div>
      </div>

      {/* Tambah form */}
      {!showArsip && (
        <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 select-none">
            <span className="text-sm font-semibold text-gray-800">{t("addTitle")}</span>
            <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 group-open:hidden">{t("open")}</span>
            <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hidden group-open:inline">{t("close")}</span>
          </summary>
          <form action={createEkstra} className="border-t border-gray-100 px-5 py-4 flex flex-wrap items-end gap-2 sm:gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldNama")}</label>
              <input name="nama" required placeholder={t("placeholderNama")} className={`${inCls} w-full`} />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldPembina")}</label>
              <GuruSelect sekolahId={sekolahId} name="pembinaGuruId" emptyLabel={t("selectPembina")} className={inCls} />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("fieldDeskripsi")}</label>
              <input name="deskripsi" placeholder={t("placeholderDeskripsi")} className={`${inCls} w-full`} />
            </div>
            <button className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">{t("save")}</button>
          </form>
        </details>
      )}

      {/* Search */}
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="arsip" value={showArsip ? "1" : ""} />
        <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")}
          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 sm:max-w-xs" />
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">{t("search")}</button>
        {q && <Link href={`/ekstrakurikuler?arsip=${showArsip ? "1" : ""}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">✕</Link>}
      </form>

      {/* Grid cards */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl">{showArsip ? "🗄" : "🎯"}</div>
          <p className="mt-3 text-sm text-gray-500">{showArsip ? t("emptyArchive") : t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((e) => (
            <div key={e.id}
              className={`group rounded-2xl border ${cardColor(e.nama)} overflow-hidden transition-all hover:shadow-md ${e.deletedAt ? "opacity-60" : ""}`}>
              {/* Card header */}
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getIcon(e.nama)}</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/ekstrakurikuler/${e.id}`}
                      className="font-bold text-gray-900 hover:text-indigo-700 hover:underline leading-tight line-clamp-2 block">
                      {e.nama}
                    </Link>
                    {e.deskripsi && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{e.deskripsi}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5">
                    <span className="text-base font-black text-gray-900">{e._count.anggota}</span>
                    <span className="text-xs text-gray-500">{t("members")}</span>
                  </div>
                  {e.pembina && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="h-5 w-5 flex items-center justify-center rounded-full bg-white/60 text-[9px] font-bold text-gray-700 shrink-0">
                        {e.pembina.namaGuru.charAt(0)}
                      </div>
                      <Link href={`/guru/${e.pembina.id}`}
                        className="truncate text-xs text-gray-600 hover:underline hover:text-indigo-600">
                        {e.pembina.namaGuru.split(" ").slice(-2).join(" ")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t border-white/50 bg-white/40 px-4 py-2">
                {e.deletedAt ? (
                  <form action={restoreEkstra}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-xs text-green-700 hover:underline">{t("restore")}</button>
                  </form>
                ) : (
                  <Link href={`/ekstrakurikuler/${e.id}`} className="text-xs text-gray-600 hover:text-indigo-700 hover:underline font-medium">
                    {t("manageMembers")}
                  </Link>
                )}
                <ConfirmForm
                  action={deleteEkstra}
                  message={t("confirmArchive", { nama: e.nama })}
                >
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-red-500 hover:underline">
                    {e.deletedAt ? t("delete") : t("archiveAction")}
                  </button>
                </ConfirmForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
