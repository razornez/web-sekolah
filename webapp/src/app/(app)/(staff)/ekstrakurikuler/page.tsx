import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createEkstra, updateEkstra, deleteEkstra } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function EkstrakurikulerPage() {
  const sekolahId = await requireModule("ekstrakurikuler");
  const [rows, guru] = await Promise.all([
    prisma.ekstrakurikuler.findMany({
      where: { sekolahId },
      orderBy: { nama: "asc" },
      include: { pembina: { select: { namaGuru: true } }, _count: { select: { anggota: true } } },
    }),
    prisma.guru.findMany({ where: { sekolahId }, orderBy: { namaGuru: "asc" }, select: { id: true, namaGuru: true } }),
  ]);

  const GuruSelect = ({ value }: { value?: number | null }) => (
    <select name="pembinaGuruId" defaultValue={value ?? ""} className={inCls}>
      <option value="">- pembina -</option>
      {guru.map((g) => <option key={g.id} value={g.id}>{g.namaGuru}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Ekstrakurikuler</h1>

      <form action={createEkstra} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex-1"><label className="block text-xs text-gray-500">Nama</label><input name="nama" required placeholder="Pramuka" className={`${inCls} w-full`} /></div>
        <div><label className="block text-xs text-gray-500">Pembina</label><GuruSelect /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Ekstrakurikuler</th><th className="px-4 py-2 font-medium">Anggota</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada ekstrakurikuler.</td></tr>}
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">
                  <form action={updateEkstra} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <input name="nama" defaultValue={e.nama} className={inCls} />
                    <GuruSelect value={e.pembinaGuruId} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Simpan</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  <Link href={`/ekstrakurikuler/${e.id}`} className="text-gray-700 hover:underline">{e._count.anggota} anggota</Link>
                </td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDelete action={deleteEkstra} id={e.id} message={`Hapus "${e.nama}"?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
