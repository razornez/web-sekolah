import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { GuruSelect } from "@/components/filters/GuruSelect";
import { createElearning, deleteElearning } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function ElearningPage() {
  const sekolahId = await requireStaff();
  const rows = await prisma.elearning.findMany({ where: { sekolahId }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">E-Learning</h1>

      <form action={createElearning} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div><label className="block text-xs text-gray-500">Judul</label><input name="judul" required className={inCls} /></div>
        <div>
          <label className="block text-xs text-gray-500">Guru</label>
          <GuruSelect sekolahId={sekolahId} name="guruId" emptyLabel="— tidak ada —" className={inCls} />
        </div>
        <div><label className="block text-xs text-gray-500">Kelas</label><input name="kelas" className={`${inCls} w-24`} /></div>
        <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">Link/Tautan</label><input name="link" placeholder="https://…" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Judul</th><th className="px-4 py-2 font-medium">Kelas</th><th className="px-4 py-2 font-medium">Mapel</th><th className="px-4 py-2 font-medium">Tautan</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada materi.</td></tr>}
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{e.judul}</td>
                <td className="px-4 py-2 text-gray-600">{e.kelas ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{e.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">buka</a> : "-"}</td>
                <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteElearning} id={e.id} message={`Hapus "${e.judul}"?`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
