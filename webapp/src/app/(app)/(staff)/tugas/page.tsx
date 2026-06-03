import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createTugas, deleteTugas } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) => (d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default async function TugasPage() {
  const sekolahId = await requireModule("tugas");
  const [rows, rombel] = await Promise.all([
    prisma.tugas.findMany({
      where: { sekolahId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { pengumpulan: true } } },
    }),
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  const rombelMap = new Map(rombel.map((r) => [r.id, r.nama]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Tugas</h1>

      <form action={createTugas} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex-1"><label className="block text-xs text-gray-500">Judul</label><input name="judul" required className={`${inCls} w-full`} /></div>
        <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" className={inCls} /></div>
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <select name="rombelId" defaultValue="" className={inCls}>
            <option value="">- semua -</option>
            {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Deadline</label><input type="date" name="deadline" className={inCls} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Judul</th><th className="px-4 py-2 font-medium">Mapel</th><th className="px-4 py-2 font-medium">Rombel</th><th className="px-4 py-2 font-medium">Deadline</th><th className="px-4 py-2 font-medium">Terkumpul</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada tugas.</td></tr>}
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/tugas/${t.id}`} className="font-medium text-gray-900 hover:underline">{t.judul}</Link></td>
                <td className="px-4 py-2 text-gray-600">{t.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{t.rombelId ? rombelMap.get(t.rombelId) ?? "-" : "Semua"}</td>
                <td className="px-4 py-2 text-gray-600">{fmt(t.deadline)}</td>
                <td className="px-4 py-2 text-gray-600">{t._count.pengumpulan}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/tugas/${t.id}`} className="text-gray-600 hover:underline">Periksa</Link>
                    <ConfirmDelete action={deleteTugas} id={t.id} message={`Hapus tugas "${t.judul}"?`} />
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
