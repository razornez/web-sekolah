import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createJurnal, deleteJurnal } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function JurnalPage() {
  const sekolahId = await requireStaff();
  const [rows, guru] = await Promise.all([
    prisma.jurnalGuru.findMany({
      where: { sekolahId },
      orderBy: { tanggal: "desc" },
      take: 100,
      include: { guru: { select: { namaGuru: true } } },
    }),
    prisma.guru.findMany({ where: { sekolahId }, orderBy: { namaGuru: "asc" }, select: { id: true, namaGuru: true } }),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Jurnal Mengajar Guru</h1>

      <form action={createJurnal} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Guru</label>
          <select name="guruId" required defaultValue="" className={inCls}>
            <option value="">- pilih -</option>
            {guru.map((g) => <option key={g.id} value={g.id}>{g.namaGuru}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Tanggal</label><input type="date" name="tanggal" defaultValue={today} className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">Kelas</label><input name="kelas" className={`${inCls} w-24`} /></div>
        <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" className={inCls} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">Materi</label><input name="materi" className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Catat</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Tanggal</th><th className="px-4 py-2 font-medium">Guru</th><th className="px-4 py-2 font-medium">Kelas</th><th className="px-4 py-2 font-medium">Mapel</th><th className="px-4 py-2 font-medium">Materi</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada jurnal.</td></tr>}
            {rows.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{fmt(j.tanggal)}</td>
                <td className="px-4 py-2 text-gray-900">{j.guru.namaGuru}</td>
                <td className="px-4 py-2 text-gray-600">{j.kelas ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{j.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{j.materi ?? "-"}</td>
                <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteJurnal} id={j.id} message="Hapus jurnal ini?" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
