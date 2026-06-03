import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deletePengumuman } from "./actions";

const PER = 10;
const KATEGORI_BADGE: Record<string, string> = { umum: "bg-gray-100 text-gray-700", akademik: "bg-blue-100 text-blue-700", keuangan: "bg-green-100 text-green-700", kegiatan: "bg-purple-100 text-purple-700", penting: "bg-red-100 text-red-700" };
const TARGET_BADGE: Record<string, string> = { semua: "bg-slate-100 text-slate-700", staf: "bg-orange-100 text-orange-700", siswa: "bg-cyan-100 text-cyan-700", ortu: "bg-pink-100 text-pink-700" };
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const strip = (html: string, n = 120) => { const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; };

export default async function PengumumanPage({ searchParams }: { searchParams: Promise<{ q?: string; kategori?: string; target?: string; page?: string }> }) {
  const sekolahId = await requireModule("pengumuman");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim(); const kategori = sp.kategori ?? ""; const target = sp.target ?? ""; const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.PengumumanWhereInput = { sekolahId, ...(q ? { OR: [{ judul: { contains: q, mode: "insensitive" } }, { isi: { contains: q, mode: "insensitive" } }] } : {}), ...(kategori ? { kategori } : {}), ...(target ? { target: target as Prisma.EnumPengumumanTargetFilter["equals"] } : {}) };
  const [total, rows] = await Promise.all([prisma.pengumuman.count({ where }), prisma.pengumuman.findMany({ where, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], skip: (page - 1) * PER, take: PER, include: { author: { select: { namaLengkap: true } } } })]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) => `/pengumuman?${new URLSearchParams({ q, kategori, target, page: String(p) }).toString()}`;
  const KATS = ["", "umum", "akademik", "keuangan", "kegiatan", "penting"];
  const TGTS = ["", "semua", "staf", "siswa", "ortu"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-900">Pengumuman</h1><p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} pengumuman</p></div>
        <Link href="/pengumuman/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Buat Pengumuman</Link>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <form className="flex gap-2">
          <input type="hidden" name="kategori" value={kategori} /><input type="hidden" name="target" value={target} />
          <input name="q" defaultValue={q} placeholder="Cari judul atau isi…" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
          {(q || kategori || target) && <Link href="/pengumuman" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Reset</Link>}
        </form>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap items-center gap-1"><span className="mr-1 text-xs text-gray-500">Kategori:</span>{KATS.map((k) => { const p = new URLSearchParams({ q, kategori: k, target, page: "1" }); return <Link key={k} href={`/pengumuman?${p.toString()}`} className={`rounded-full border px-2.5 py-0.5 text-xs ${kategori === k ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>{k === "" ? "Semua" : k.charAt(0).toUpperCase() + k.slice(1)}</Link>; })}</div>
          <div className="flex flex-wrap items-center gap-1"><span className="mr-1 text-xs text-gray-500">Target:</span>{TGTS.map((t) => { const p = new URLSearchParams({ q, kategori, target: t, page: "1" }); return <Link key={t} href={`/pengumuman?${p.toString()}`} className={`rounded-full border px-2.5 py-0.5 text-xs ${target === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>{t === "" ? "Semua" : t.charAt(0).toUpperCase() + t.slice(1)}</Link>; })}</div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {rows.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Tidak ada pengumuman.</p>}
        {rows.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {p.pinned && <span className="text-amber-500">📌</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${KATEGORI_BADGE[p.kategori] ?? KATEGORI_BADGE.umum}`}>{p.kategori.charAt(0).toUpperCase() + p.kategori.slice(1)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${TARGET_BADGE[p.target] ?? TARGET_BADGE.semua}`}>🎯 {p.target}</span>
                  <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">👁 {p.viewCount.toLocaleString("id-ID")}</span>
                </div>
                <Link href={`/pengumuman/${p.id}`} className="block text-base font-semibold text-gray-900 hover:underline">{p.judul}</Link>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{strip(p.isi)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>🕐 {fmt(p.createdAt)}</span>
                  {p.author && <span>✍️ {p.author.namaLengkap}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Link href={`/pengumuman/${p.id}`} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50">Detail</Link>
                <Link href={`/pengumuman/${p.id}/edit`} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50">Edit</Link>
                <a href={`https://wa.me/?text=${encodeURIComponent(`📢 *${p.judul}*\n\n${strip(p.isi, 200)}\n\n_Info lebih lanjut di aplikasi sekolah_`)}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-green-200 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50" title="Share ke WhatsApp">📱 WA</a>
                <ConfirmDelete action={deletePengumuman} id={p.id} message={`Hapus "${p.judul}"?`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && <div className="flex items-center justify-between text-sm text-gray-600"><span>Halaman {page} dari {totalPages}</span><div className="flex gap-2">{page > 1 && <Link href={hp(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}{page < totalPages && <Link href={hp(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}</div></div>}
    </div>
  );
}
