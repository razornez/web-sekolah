import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createSarpras, updateSarpras, deleteSarpras } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function SarprasPage() {
  const sekolahId = await requireStaff();
  const [rows, kategori] = await Promise.all([
    prisma.sarpras.findMany({
      where: { sekolahId },
      orderBy: { nama: "asc" },
      include: { kategori: { select: { nama: true } } },
    }),
    prisma.kategoriSarpras.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
  ]);

  const KategoriSelect = ({ name, value }: { name: string; value?: number | null }) => (
    <select name={name} defaultValue={value ?? ""} className={inCls}>
      <option value="">- kategori -</option>
      {kategori.map((k) => (
        <option key={k.id} value={k.id}>{k.nama}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sarana &amp; Prasarana</h1>
          <p className="text-sm text-gray-500">{rows.length} item</p>
        </div>
        <Link href="/sarpras/kategori" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Kelola Kategori
        </Link>
      </div>

      <form action={createSarpras} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Nama</label>
          <input name="nama" required placeholder="Proyektor" className={inCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Kategori</label>
          <KategoriSelect name="kategoriId" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Jumlah</label>
          <input name="jumlah" type="number" min={0} defaultValue={1} className={`${inCls} w-24`} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Kondisi</label>
          <input name="kondisi" placeholder="Baik" className={inCls} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500">Keterangan</label>
          <input name="keterangan" className={`${inCls} w-full`} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Belum ada data sarpras.</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">
                  <form action={updateSarpras} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="nama" defaultValue={s.nama} className={inCls} />
                    <KategoriSelect name="kategoriId" value={s.kategoriId} />
                    <input name="jumlah" type="number" min={0} defaultValue={s.jumlah} className={`${inCls} w-20`} />
                    <input name="kondisi" defaultValue={s.kondisi ?? ""} placeholder="kondisi" className={`${inCls} w-28`} />
                    <input name="keterangan" defaultValue={s.keterangan ?? ""} placeholder="keterangan" className={`${inCls} flex-1`} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Simpan</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right align-top">
                  <ConfirmDelete action={deleteSarpras} id={s.id} message={`Hapus "${s.nama}"?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
