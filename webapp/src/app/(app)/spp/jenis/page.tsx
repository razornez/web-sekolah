import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createJenis, updateJenis, deleteJenis } from "../actions";

const inCls =
  "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function JenisPage() {
  const sekolahId = await getSekolahId();
  const rows = await prisma.jenisPembayaran.findMany({
    where: { sekolahId },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Jenis Pembayaran</h1>
        <Link href="/spp" className="text-sm text-gray-500 hover:text-gray-900">← Tagihan SPP</Link>
      </div>

      <form action={createJenis} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Nama</label>
          <input name="nama" required placeholder="SPP Bulanan" className={inCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Nominal</label>
          <input name="nominal" type="number" min={0} defaultValue={0} className={`${inCls} w-32`} />
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
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Nominal</th>
              <th className="px-4 py-2 font-medium">Keterangan</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada jenis pembayaran.</td></tr>
            )}
            {rows.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-2" colSpan={3}>
                  <form action={updateJenis} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={j.id} />
                    <input name="nama" defaultValue={j.nama} className={inCls} />
                    <input name="nominal" type="number" min={0} defaultValue={j.nominal} className={`${inCls} w-32`} />
                    <input name="keterangan" defaultValue={j.keterangan ?? ""} className={`${inCls} flex-1`} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Simpan</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDelete action={deleteJenis} id={j.id} message={`Hapus "${j.nama}"?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
