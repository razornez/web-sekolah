import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createProjek, deleteProjek } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function P5Page() {
  const sekolahId = await requireStaff();
  const [projek, tahunAjaran] = await Promise.all([
    prisma.projekP5.findMany({
      where: { sekolahId },
      orderBy: { id: "desc" },
      include: { tahunAjaran: { select: { tahun: true } }, _count: { select: { target: true, penilaian: true } } },
    }),
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Projek P5</h1>
        <p className="text-sm text-gray-500">Projek Penguatan Profil Pelajar Pancasila — {projek.length} projek</p>
      </div>

      <form action={createProjek} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Tahun Ajaran</label>
          <select name="tahunAjaranId" required defaultValue="" className={inCls}>
            <option value="">- pilih -</option>
            {tahunAjaran.map((t) => <option key={t.id} value={t.id}>{t.tahun}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Tema</label><input name="tema" required placeholder="Kearifan Lokal" className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">Judul</label><input name="judul" required className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">Deskripsi</label><input name="deskripsi" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Judul</th><th className="px-4 py-2 font-medium">Tema</th><th className="px-4 py-2 font-medium">Tahun</th><th className="px-4 py-2 font-medium">Target/Nilai</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projek.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada projek P5.</td></tr>}
            {projek.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/p5/${p.id}`} className="font-medium text-gray-900 hover:underline">{p.judul}</Link></td>
                <td className="px-4 py-2 text-gray-600">{p.tema}</td>
                <td className="px-4 py-2 text-gray-600">{p.tahunAjaran.tahun}</td>
                <td className="px-4 py-2 text-gray-600">{p._count.target} elemen · {p._count.penilaian} nilai</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/p5/${p.id}`} className="text-gray-600 hover:underline">Kelola</Link>
                    <ConfirmDelete action={deleteProjek} id={p.id} message={`Hapus projek "${p.judul}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
