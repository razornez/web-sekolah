import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { PageGuide } from "@/components/PageGuide";
import { deleteBuku } from "./actions";

const PER = 18;

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

function BookCover({ judul, penerbit, w = 80 }: { judul: string; penerbit?: string | null; w?: number }) {
  const [bg, fg] = coverColor(judul);
  const abbr = judul.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 3);
  return (
    <div
      style={{ background: `linear-gradient(160deg, ${bg} 60%, color-mix(in srgb,${bg} 75%,white))`, width: w, minHeight: Math.round(w * 1.35) }}
      className="relative flex flex-col rounded-md shadow-md overflow-hidden shrink-0"
    >
      {/* Spine accent */}
      <div style={{ background: fg, width: 6 }} className="absolute left-0 top-0 bottom-0" />
      <div className="flex flex-1 flex-col items-center justify-center px-3 py-3 pl-5">
        <div style={{ color: fg }} className="text-2xl font-bold leading-none tracking-tight text-center">
          {abbr}
        </div>
        <div style={{ color: `${fg}cc` }} className="mt-2 text-center text-[9px] leading-tight font-medium line-clamp-3 break-words">
          {judul}
        </div>
        {penerbit && (
          <div style={{ color: `${fg}88` }} className="mt-1 text-[8px] text-center truncate w-full">
            {penerbit}
          </div>
        )}
      </div>
      {/* Bottom band */}
      <div style={{ background: fg, opacity: 0.15 }} className="h-4" />
    </div>
  );
}

export default async function PerpustakaanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const sekolahId = await requireModule("perpustakaan");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const filter = sp.filter ?? "semua"; // semua | tersedia | dipinjam

  const where: Prisma.BukuPerpustakaanWhereInput = {
    sekolahId,
    ...(q ? { OR: [{ judul: { contains: q, mode: "insensitive" } }, { pengarang: { contains: q, mode: "insensitive" } }, { isbn: { contains: q } }] } : {}),
    ...(filter === "dipinjam" ? { pinjaman: { some: { tanggalKembali: null } } } : {}),
    ...(filter === "tersedia" ? { pinjaman: { none: { tanggalKembali: null } } } : {}),
  };

  const [total, rows, stats] = await Promise.all([
    prisma.bukuPerpustakaan.count({ where }),
    prisma.bukuPerpustakaan.findMany({
      where,
      orderBy: { judul: "asc" },
      skip: (page - 1) * PER,
      take: PER,
      include: {
        pinjaman: {
          where: { tanggalKembali: null },
          include: { siswa: { select: { id: true, namaLengkap: true, nisn: true } } },
          orderBy: { tanggalPinjam: "asc" },
          take: 3,
        },
        _count: { select: { pinjaman: { where: { tanggalKembali: null } } } },
      },
    }),
    prisma.bukuPerpustakaan.aggregate({ where: { sekolahId }, _sum: { jumlahEksemplar: true, jumlahBuku: true } }),
  ]);

  const overdueCount = await prisma.pinjamanBuku.count({
    where: { sekolahId, tanggalKembali: null, tanggalPinjam: { lt: new Date(Date.now() - 7 * 86400000) } },
  });

  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) => `/perpustakaan?${new URLSearchParams({ q, page: String(p), filter }).toString()}`;
  const today = new Date();
  const dayDiff = (d: Date) => Math.floor((today.getTime() - d.getTime()) / 86400000);

  return (
    <div className="space-y-5">
      <PageGuide
        icon="📚"
        title="Perpustakaan"
        description="Kelola koleksi buku, peminjaman, dan pengembalian. Setiap buku ditampilkan dengan cover berwarna, status stok, dan daftar peminjam aktif."
        tips={[
          "Filter 'Dipinjam' untuk melihat buku yang sedang keluar.",
          "Filter 'Tersedia' untuk buku yang semua eksemplarnya ada.",
          "Buku merah = overdue (dipinjam > 7 hari, belum dikembalikan).",
          "Klik + Pinjam → halaman peminjaman per siswa.",
        ]}
      />

      {/* Header & Stats */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Perpustakaan</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} judul · {(stats._sum.jumlahEksemplar ?? 0).toLocaleString("id-ID")} eksemplar</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Stat chips */}
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
              <span className="text-lg">⚠️</span>
              <div><div className="text-lg font-bold text-red-700 leading-none">{overdueCount}</div><div className="text-xs text-red-500">Overdue</div></div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <span className="text-lg">📖</span>
            <div>
              <div className="text-lg font-bold text-amber-700 leading-none">
                {rows.reduce((s, r) => s + r._count.pinjaman, 0)}
              </div>
              <div className="text-xs text-amber-500">Dipinjam</div>
            </div>
          </div>
          <Link href="/perpustakaan/pinjam" className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Pinjam Buku
          </Link>
          <Link href="/perpustakaan/new" className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            + Tambah Buku
          </Link>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="flex flex-1 gap-2">
          <input type="hidden" name="filter" value={filter} />
          <input name="q" defaultValue={q} placeholder="Cari judul, pengarang, ISBN…" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
          {q && <Link href={`/perpustakaan?filter=${filter}`} className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">✕</Link>}
        </form>
        <div className="flex gap-1">
          {[["semua","Semua"],["tersedia","Tersedia"],["dipinjam","Dipinjam"]].map(([val, lbl]) => (
            <Link key={val} href={`/perpustakaan?${new URLSearchParams({ q, filter: val, page:"1" }).toString()}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filter === val ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
              {lbl}
            </Link>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl">📚</div>
          <p className="mt-3 text-sm text-gray-500">Tidak ada buku ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b) => {
            const dipinjam = b._count.pinjaman;
            const stokTersedia = b.jumlahEksemplar - dipinjam;
            const stokBuruk = stokTersedia <= 0;
            const hasOverdue = b.pinjaman.some(p => dayDiff(p.tanggalPinjam) > 7);

            return (
              <div key={b.id} className={`group rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden ${hasOverdue ? "border-red-200" : stokBuruk ? "border-amber-200" : "border-gray-200"}`}>
                <div className="flex gap-4 p-4">
                  {/* Book Cover */}
                  <BookCover judul={b.judul} penerbit={b.penerbit} w={72} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/perpustakaan/${b.id}`} className="block font-semibold text-gray-900 hover:underline leading-tight line-clamp-2 group-hover:text-indigo-700">
                      {b.judul}
                    </Link>
                    {b.pengarang && <p className="mt-0.5 text-xs text-gray-500 truncate">{b.pengarang}</p>}
                    {b.penerbit && <p className="text-xs text-gray-400 truncate">{b.penerbit}{b.tahunTerbit ? ` · ${b.tahunTerbit}` : ""}</p>}

                    {/* Stok badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stokTersedia > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        📦 {stokTersedia}/{b.jumlahEksemplar} tersedia
                      </span>
                      {dipinjam > 0 && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${hasOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {hasOverdue ? "⚠️" : "📖"} {dipinjam} dipinjam
                        </span>
                      )}
                    </div>

                    {/* Peminjam aktif */}
                    {b.pinjaman.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {b.pinjaman.slice(0, 2).map((p) => {
                          const days = dayDiff(p.tanggalPinjam);
                          const overdue = days > (p.durasiHari ?? 7);
                          return (
                            <div key={p.id} className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${overdue ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"}`}>
                              <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-[9px] shrink-0">
                                {p.siswa?.namaLengkap?.charAt(0) ?? "?"}
                              </div>
                              <span className="truncate font-medium">
                                <Link href={`/siswa/${p.siswa?.id}`} className="hover:underline">{p.siswa?.namaLengkap ?? "?"}</Link>
                              </span>
                              <span className={`ml-auto shrink-0 ${overdue ? "font-semibold" : ""}`}>
                                {overdue ? `⚠ ${days}h` : `${days}h`}
                              </span>
                            </div>
                          );
                        })}
                        {b.pinjaman.length > 2 && (
                          <p className="text-xs text-gray-400 text-center">+{b.pinjaman.length - 2} lainnya</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-2">
                  <div className="flex gap-3 text-xs text-gray-500">
                    {b.isbn && <span>ISBN: {b.isbn}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/perpustakaan/pinjam`} className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800">
                      + Pinjam
                    </Link>
                    <Link href={`/perpustakaan/${b.id}`} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-white">
                      Edit
                    </Link>
                    <ConfirmDelete action={deleteBuku} id={b.id} message={`Hapus "${b.judul}"?`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages} ({total.toLocaleString("id-ID")} judul)</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hp(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
