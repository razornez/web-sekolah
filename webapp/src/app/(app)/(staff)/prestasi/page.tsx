import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { savePrestasi, deletePrestasi, saveBeasiswa, deleteBeasiswa } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) => d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const rupiah = (n: number | null) => n ? "Rp " + n.toLocaleString("id-ID") : "-";
const PER = 30;

export default async function PrestasiPage({ searchParams }: { searchParams: Promise<{ q?: string; tab?: string; page?: string }> }) {
  const sekolahId = await requireModule("siswa");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tab = sp.tab === "beasiswa" ? "beasiswa" : "prestasi";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.SiswaWhereInput = { sekolahId, ...(q ? { namaLengkap: { contains: q, mode: "insensitive" } } : {}) };

  const [totalSiswa, siswaList] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({
      where,
      orderBy: { namaLengkap: "asc" },
      skip: (page - 1) * PER,
      take: PER,
      include: {
        prestasi: { orderBy: { tanggal: "desc" } },
        beasiswa: { orderBy: { id: "desc" } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalSiswa / PER));
  const hrefPage = (p: number) => `/prestasi?q=${q}&tab=${tab}&page=${p}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Prestasi &amp; Beasiswa</h1>
        <div className="flex gap-2">
          <Link href={`/prestasi?tab=prestasi${q ? `&q=${q}` : ""}`} className={`rounded-md border px-3 py-1.5 text-sm ${tab === "prestasi" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>Prestasi</Link>
          <Link href={`/prestasi?tab=beasiswa${q ? `&q=${q}` : ""}`} className={`rounded-md border px-3 py-1.5 text-sm ${tab === "beasiswa" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>Beasiswa</Link>
        </div>
      </div>

      <form className="flex gap-2">
        <input type="hidden" name="tab" value={tab} />
        <input name="q" defaultValue={q} placeholder="Cari nama siswa…" className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        {q && <Link href={`/prestasi?tab=${tab}`} className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </form>

      <div className="space-y-4">
        {siswaList.map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <Link href={`/siswa/${s.id}`} className="font-medium text-gray-900 hover:underline">{s.namaLengkap}</Link>
              <span className="text-xs text-gray-400">{s.nisn ?? "-"}</span>
            </div>
            <div className="p-4">
              {tab === "prestasi" ? (
                <div className="space-y-3">
                  <form action={savePrestasi} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="siswaId" value={s.id} />
                    <div className="flex-1"><label className="block text-xs text-gray-500">Prestasi</label><input name="namaPrestasi" required placeholder="Juara 1 OSN…" className={`${inCls} w-full`} /></div>
                    <div><label className="block text-xs text-gray-500">Tingkat</label><input name="tingkat" placeholder="Kabupaten" className={inCls} /></div>
                    <div><label className="block text-xs text-gray-500">Tahun</label><input name="tahun" defaultValue={new Date().getFullYear()} className={`${inCls} w-20`} /></div>
                    <div><label className="block text-xs text-gray-500">Tanggal</label><input type="date" name="tanggal" className={inCls} /></div>
                    <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
                  </form>
                  {s.prestasi.length > 0 && (
                    <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-3 py-1 text-left font-medium">Prestasi</th><th className="px-3 py-1 font-medium">Tingkat</th><th className="px-3 py-1 font-medium">Tahun</th><th className="px-3 py-1 font-medium">Tanggal</th><th className="px-3 py-1 text-right font-medium">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {s.prestasi.map((p) => (
                          <tr key={p.id}><td className="px-3 py-1 text-gray-900">{p.namaPrestasi}</td><td className="px-3 py-1 text-gray-600">{p.tingkat ?? "-"}</td><td className="px-3 py-1 text-gray-600">{p.tahun ?? "-"}</td><td className="px-3 py-1 text-gray-600">{fmt(p.tanggal)}</td><td className="px-3 py-1 text-right"><ConfirmDelete action={deletePrestasi} id={p.id} message={`Hapus "${p.namaPrestasi}"?`} /></td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <form action={saveBeasiswa} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="siswaId" value={s.id} />
                    <div className="flex-1"><label className="block text-xs text-gray-500">Beasiswa</label><input name="nama" required placeholder="Beasiswa KIP…" className={`${inCls} w-full`} /></div>
                    <div><label className="block text-xs text-gray-500">Nominal (Rp)</label><input name="nominal" type="number" min={0} className={`${inCls} w-36`} /></div>
                    <div><label className="block text-xs text-gray-500">Tahun</label><input name="tahun" defaultValue={new Date().getFullYear()} className={`${inCls} w-20`} /></div>
                    <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
                  </form>
                  {s.beasiswa.length > 0 && (
                    <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-3 py-1 text-left font-medium">Beasiswa</th><th className="px-3 py-1 font-medium">Nominal</th><th className="px-3 py-1 font-medium">Tahun</th><th className="px-3 py-1 text-right font-medium">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {s.beasiswa.map((b) => (
                          <tr key={b.id}><td className="px-3 py-1 text-gray-900">{b.nama}</td><td className="px-3 py-1 text-gray-600">{rupiah(b.nominal)}</td><td className="px-3 py-1 text-gray-600">{b.tahun ?? "-"}</td><td className="px-3 py-1 text-right"><ConfirmDelete action={deleteBeasiswa} id={b.id} message={`Hapus "${b.nama}"?`} /></td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {siswaList.length === 0 && <p className="text-sm text-gray-400">Tidak ada siswa.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hrefPage(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hrefPage(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
