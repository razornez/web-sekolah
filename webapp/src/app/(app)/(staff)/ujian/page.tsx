import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createUjian, deleteUjian } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function UjianPage() {
  const sekolahId = await requireModule("ujian");
  const [rows, rombel] = await Promise.all([
    prisma.ujian.findMany({
      where: { sekolahId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { soal: true, hasil: true } } },
    }),
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  const rombelMap = new Map(rombel.map((r) => [r.id, r.nama]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ujian Online (CBT)</h1>
        <p className="text-sm text-gray-500">Buat ujian, kelola bank soal, lihat & nilai hasil.</p>
      </div>

      <form action={createUjian} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex-1"><label className="block text-xs text-gray-500">Judul</label><input name="judul" required className={`${inCls} w-full`} /></div>
        <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" className={inCls} /></div>
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <select name="rombelId" defaultValue="" className={inCls}>
            <option value="">- semua -</option>
            {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Durasi (menit)</label><input name="durasiMenit" type="number" min={1} className={`${inCls} w-28`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Buat</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Judul</th><th className="px-4 py-2 font-medium">Mapel</th><th className="px-4 py-2 font-medium">Rombel</th><th className="px-4 py-2 font-medium">Soal</th><th className="px-4 py-2 font-medium">Peserta</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada ujian.</td></tr>}
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/ujian/${u.id}`} className="font-medium text-gray-900 hover:underline">{u.judul}</Link></td>
                <td className="px-4 py-2 text-gray-600">{u.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{u.rombelId ? rombelMap.get(u.rombelId) ?? "-" : "Semua"}</td>
                <td className="px-4 py-2 text-gray-600">{u._count.soal}</td>
                <td className="px-4 py-2 text-gray-600">{u._count.hasil}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${u.aktif ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {u.aktif ? "aktif" : "draft"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/ujian/${u.id}`} className="text-gray-600 hover:underline">Kelola</Link>
                    <ConfirmDelete action={deleteUjian} id={u.id} message={`Hapus ujian "${u.judul}"?`} />
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
