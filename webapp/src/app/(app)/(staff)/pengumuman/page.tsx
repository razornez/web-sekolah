import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deletePengumuman } from "./actions";

const PER = 50;

const KATEGORI_CONFIG: Record<string, { icon: string; label: string; bg: string; badge: string }> = {
  umum:      { icon: "📢", label: "Umum",      bg: "bg-gray-50 border-gray-200",       badge: "bg-gray-100 text-gray-700" },
  akademik:  { icon: "📚", label: "Akademik",  bg: "bg-blue-50 border-blue-200",        badge: "bg-blue-100 text-blue-700" },
  keuangan:  { icon: "💰", label: "Keuangan",  bg: "bg-green-50 border-green-200",      badge: "bg-green-100 text-green-700" },
  kegiatan:  { icon: "🎉", label: "Kegiatan",  bg: "bg-purple-50 border-purple-200",    badge: "bg-purple-100 text-purple-700" },
  penting:   { icon: "🚨", label: "Penting",   bg: "bg-red-50 border-red-200",          badge: "bg-red-100 text-red-700" },
};
const TARGET_BADGE: Record<string, string> = {
  semua: "bg-slate-100 text-slate-700", staf: "bg-orange-100 text-orange-700",
  siswa: "bg-cyan-100 text-cyan-700", ortu: "bg-pink-100 text-pink-700",
};

const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const strip = (html: string, n = 120) => {
  const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
};

export default async function PengumumanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; target?: string; page?: string }>;
}) {
  const sekolahId = await requireModule("pengumuman");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kategoriFilter = sp.kategori ?? "";
  const target = sp.target ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.PengumumanWhereInput = {
    sekolahId,
    ...(q ? { OR: [{ judul: { contains: q, mode: "insensitive" } }, { isi: { contains: q, mode: "insensitive" } }] } : {}),
    ...(kategoriFilter ? { kategori: kategoriFilter } : {}),
    ...(target ? { target: target as Prisma.EnumPengumumanTargetFilter["equals"] } : {}),
  };

  const [total, rows, counts] = await Promise.all([
    prisma.pengumuman.count({ where }),
    prisma.pengumuman.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER,
      take: PER,
      include: { author: { select: { namaLengkap: true } } },
    }),
    // Count per kategori untuk chip badges
    prisma.pengumuman.groupBy({
      by: ["kategori"],
      where: { sekolahId, ...(target ? { target: target as Prisma.EnumPengumumanTargetFilter["equals"] } : {}) },
      _count: { _all: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map(c => [c.kategori, c._count._all]));
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) => `/pengumuman?${new URLSearchParams({ q, kategori: kategoriFilter, target, page: String(p) }).toString()}`;

  // Group rows by kategori if not filtered
  type Row = typeof rows[number];
  const groups: { key: string; label: string; icon: string; bg: string; rows: Row[] }[] = [];

  if (!kategoriFilter && !q) {
    // Pinned dulu
    const pinned = rows.filter(r => r.pinned);
    if (pinned.length > 0) groups.push({ key: "__pinned", label: "Disematkan", icon: "📌", bg: "bg-amber-50 border-amber-200", rows: pinned });

    // Group sisanya by kategori
    const byKat = new Map<string, Row[]>();
    for (const r of rows.filter(r => !r.pinned)) {
      (byKat.get(r.kategori) ?? byKat.set(r.kategori, []).get(r.kategori))!.push(r);
    }
    for (const [kat, katRows] of byKat) {
      const cfg = KATEGORI_CONFIG[kat] ?? KATEGORI_CONFIG.umum;
      groups.push({ key: kat, label: cfg.label, icon: cfg.icon, bg: cfg.bg, rows: katRows });
    }
  } else {
    groups.push({ key: "all", label: "Hasil Pencarian", icon: "🔍", bg: "bg-white border-gray-200", rows });
  }

  const KATS = ["", "umum", "akademik", "keuangan", "kegiatan", "penting"];
  const TGTS = ["", "semua", "staf", "siswa", "ortu"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} pengumuman</p>
        </div>
        <Link href="/pengumuman/new" className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Buat Pengumuman
        </Link>
      </div>

      {/* Kategori chips dengan count */}
      <div className="flex flex-wrap gap-2">
        {KATS.map((k) => {
          const cfg = k ? KATEGORI_CONFIG[k] : null;
          const cnt = k ? (countMap[k] ?? 0) : total;
          const active = kategoriFilter === k;
          return (
            <Link key={k}
              href={`/pengumuman?${new URLSearchParams({ q, kategori: k, target, page: "1" }).toString()}`}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active ? "border-gray-900 bg-gray-900 text-white shadow-sm" : "border-gray-200 bg-white hover:border-gray-400"
              }`}>
              {cfg?.icon && <span>{cfg.icon}</span>}
              <span>{k === "" ? "Semua" : cfg?.label ?? k}</span>
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {cnt}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search + Target filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <form className="flex flex-1 gap-2">
            <input type="hidden" name="kategori" value={kategoriFilter} />
            <input type="hidden" name="target" value={target} />
            <input name="q" defaultValue={q} placeholder="Cari judul atau isi pengumuman…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
            {(q || kategoriFilter || target) && (
              <Link href="/pengumuman" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>
            )}
          </form>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Target:</span>
            {TGTS.map((t) => (
              <Link key={t}
                href={`/pengumuman?${new URLSearchParams({ q, kategori: kategoriFilter, target: t, page: "1" }).toString()}`}
                className={`rounded-full border px-2.5 py-1 text-xs ${target === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                {t === "" ? "Semua" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped list */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">Tidak ada pengumuman.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => g.rows.length === 0 ? null : (
            <div key={g.key} className="space-y-3">
              {/* Group header */}
              {(groups.length > 1 || g.key === "__pinned") && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${g.bg}`}>
                  <span className="text-lg">{g.icon}</span>
                  <span className="font-bold text-gray-800">{g.label}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-600 font-medium">{g.rows.length}</span>
                </div>
              )}

              {/* Cards */}
              <div className="space-y-2">
                {g.rows.map((p) => {
                  const cfg = KATEGORI_CONFIG[p.kategori] ?? KATEGORI_CONFIG.umum;
                  return (
                    <div key={p.id}
                      className={`group rounded-xl border bg-white p-4 transition-all hover:shadow-md ${p.pinned ? "border-amber-200" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          {/* Kategori icon */}
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${cfg.bg.replace("border-", "bg-").split(" ")[0]}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {p.pinned && <span className="text-amber-500 text-xs">📌 Disematkan</span>}
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>{cfg.label}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${TARGET_BADGE[p.target] ?? TARGET_BADGE.semua}`}>🎯 {p.target}</span>
                              <span className="text-xs text-gray-400">👁 {p.viewCount.toLocaleString("id-ID")}</span>
                            </div>
                            <Link href={`/pengumuman/${p.id}`}
                              className="block font-semibold text-gray-900 hover:text-indigo-700 hover:underline leading-snug">
                              {p.judul}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{strip(p.isi)}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                              <span>🕐 {fmt(p.createdAt)}</span>
                              {p.author && <span>✍️ {p.author.namaLengkap}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          <Link href={`/pengumuman/${p.id}`} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50">Detail</Link>
                          <Link href={`/pengumuman/${p.id}/edit`} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50">Edit</Link>
                          <a href={`https://wa.me/?text=${encodeURIComponent(`${cfg.icon} *${p.judul}*\n\n${strip(p.isi, 200)}\n\n_Info lebih lanjut di aplikasi sekolah_`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="rounded-lg border border-green-200 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50">
                            📱 WA
                          </a>
                          <ConfirmDelete action={deletePengumuman} id={p.id} message={`Hapus "${p.judul}"?`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages} ({total} pengumuman)</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hp(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
