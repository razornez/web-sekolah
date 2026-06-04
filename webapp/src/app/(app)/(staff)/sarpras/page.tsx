import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createSarpras, deleteSarpras } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

const KONDISI_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "Baik":         { label: "Baik",         color: "text-emerald-700", bg: "bg-emerald-100" },
  "Cukup":        { label: "Cukup",        color: "text-amber-700",   bg: "bg-amber-100" },
  "Rusak Ringan": { label: "Rusak Ringan", color: "text-orange-700",  bg: "bg-orange-100" },
  "Rusak Berat":  { label: "Rusak Berat",  color: "text-red-700",     bg: "bg-red-100" },
  "Tidak Layak":  { label: "Tidak Layak",  color: "text-gray-600",    bg: "bg-gray-200" },
};
const KONDISI_LIST = Object.keys(KONDISI_CONFIG);

export default async function SarprasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kondisi?: string; kategori?: string }>;
}) {
  const sekolahId = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kondisiFilter = sp.kondisi ?? "";
  const kategoriFilter = Number(sp.kategori) || 0;

  const where: Prisma.SarprasWhereInput = {
    sekolahId,
    ...(q ? { nama: { contains: q, mode: "insensitive" } } : {}),
    ...(kondisiFilter ? { kondisi: kondisiFilter } : {}),
    ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}),
  };

  const [rows, kategori] = await Promise.all([
    prisma.sarpras.findMany({
      where,
      orderBy: [{ kondisi: "asc" }, { nama: "asc" }],
      include: { kategori: { select: { nama: true } } },
    }),
    prisma.kategoriSarpras.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
  ]);

  // Group by kondisi
  const grouped = new Map<string, typeof rows>();
  for (const s of rows) {
    const k = s.kondisi || "Tidak Diketahui";
    (grouped.get(k) ?? grouped.set(k, []).get(k))!.push(s);
  }
  // Sort groups: Baik first, Rusak Berat last
  const kondisiOrder = [...KONDISI_LIST, "Tidak Diketahui", "Lainnya"];
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    return (kondisiOrder.indexOf(a) ?? 99) - (kondisiOrder.indexOf(b) ?? 99);
  });

  const makeFilter = (extra: Record<string, string>) =>
    `/sarpras?${new URLSearchParams({ q, kondisi: kondisiFilter, kategori: kategoriFilter ? String(kategoriFilter) : "", ...extra }).toString()}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sarana &amp; Prasarana</h1>
          <p className="text-sm text-gray-500">{rows.length} dari {await prisma.sarpras.count({ where: { sekolahId } })} item</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sarpras/kategori" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Kelola Kategori</Link>
        </div>
      </div>

      {/* Form tambah */}
      <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 select-none">
          <span className="text-sm font-semibold text-gray-800">+ Tambah Item Baru</span>
          <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 group-open:hidden">Buka</span>
          <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hidden group-open:inline">Tutup</span>
        </summary>
        <form action={createSarpras} className="border-t border-gray-100 px-5 py-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama *</label>
            <input name="nama" required placeholder="Proyektor" className={`${inCls} min-w-[160px]`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
            <select name="kategoriId" defaultValue="" className={inCls}>
              <option value="">— pilih —</option>
              {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              <option value="__lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah</label>
            <input name="jumlah" type="number" min={0} defaultValue={1} className={`${inCls} w-20`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kondisi</label>
            <select name="kondisi" defaultValue="Baik" className={inCls}>
              <option value="">— kondisi —</option>
              {KONDISI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Pengadaan</label>
            <input name="tahunPengadaan" type="number" min={1990} max={2099}
              placeholder={String(new Date().getFullYear())} className={`${inCls} w-28`} />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Keterangan</label>
            <input name="keterangan" className={`${inCls} w-full`} />
          </div>
          <button className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">Simpan</button>
        </form>
      </details>

      {/* Search & Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cari nama</label>
            <input name="q" defaultValue={q} placeholder="Proyektor, meja, kursi…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kondisi</label>
            <select name="kondisi" defaultValue={kondisiFilter} className={inCls}>
              <option value="">Semua</option>
              {KONDISI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
            <select name="kategori" defaultValue={kategoriFilter || ""} className={inCls}>
              <option value="">Semua Kategori</option>
              {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Terapkan</button>
            {(q || kondisiFilter || kategoriFilter > 0) && (
              <Link href="/sarpras" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>
            )}
          </div>
        </form>
      </div>

      {/* Kondisi filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link href={makeFilter({ kondisi: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!kondisiFilter ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
          Semua ({rows.length})
        </Link>
        {sortedGroups.map(([k, items]) => {
          const cfg = KONDISI_CONFIG[k];
          return (
            <Link key={k} href={makeFilter({ kondisi: k })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${kondisiFilter === k ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
              {cfg ? `${k} (${items.length})` : `${k} (${items.length})`}
            </Link>
          );
        })}
      </div>

      {/* Grouped list */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          Tidak ada item sarpras.
        </div>
      ) : (
        <div className="space-y-5">
          {sortedGroups.map(([kondisi, items]) => {
            const cfg = KONDISI_CONFIG[kondisi];
            return (
              <div key={kondisi} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Group header */}
                <div className={`flex items-center gap-3 border-b border-gray-100 px-5 py-3 ${cfg ? cfg.bg : "bg-gray-100"}`}>
                  <span className={`text-sm font-bold ${cfg ? cfg.color : "text-gray-600"}`}>{kondisi}</span>
                  <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {items.length} item · {items.reduce((s, i) => s + i.jumlah, 0)} unit
                  </span>
                </div>
                {/* Items */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Nama</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Kategori</th>
                      <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide">Jumlah</th>
                      <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide">Thn Pengadaan</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Keterangan</th>
                      <th className="px-4 py-2 text-right font-semibold uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{s.nama}</td>
                        <td className="px-4 py-2.5">
                          {s.kategori
                            ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s.kategori.nama}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold text-gray-700">{s.jumlah}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500">{s.tahunPengadaan ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{s.keterangan ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <ConfirmDelete action={deleteSarpras} id={s.id} message={`Hapus "${s.nama}"?`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
