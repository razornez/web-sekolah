import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createJadwal, deleteJadwal } from "./actions";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function JadwalPage() {
  const sekolahId = await requireStaff();
  const [rows, guru, rombel] = await Promise.all([
    prisma.jadwalGuru.findMany({
      where: { sekolahId },
      include: { guru: { select: { namaGuru: true } }, hari: { select: { nama: true, urutan: true } } },
      orderBy: [{ hari: { urutan: "asc" } }, { jamMulai: "asc" }],
    }),
    prisma.guru.findMany({ where: { sekolahId }, orderBy: { namaGuru: "asc" }, select: { id: true, namaGuru: true } }),
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  const rombelMap = new Map(rombel.map((r) => [r.id, r.nama]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Jadwal Mengajar</h1>

      <form action={createJadwal} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Guru</label>
          <select name="guruId" required defaultValue="" className={inCls}>
            <option value="">- pilih -</option>
            {guru.map((g) => <option key={g.id} value={g.id}>{g.namaGuru}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Hari</label>
          <select name="hari" required defaultValue="" className={inCls}>
            <option value="">- pilih -</option>
            {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <select name="rombelId" defaultValue="" className={inCls}>
            <option value="">-</option>
            {rombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">Jam Mulai</label><input name="jamMulai" type="time" className={inCls} /></div>
        <div><label className="block text-xs text-gray-500">Jam Selesai</label><input name="jamSelesai" type="time" className={inCls} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Hari</th><th className="px-4 py-2 font-medium">Jam</th><th className="px-4 py-2 font-medium">Guru</th><th className="px-4 py-2 font-medium">Rombel</th><th className="px-4 py-2 font-medium">Mapel</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada jadwal.</td></tr>}
            {rows.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{j.hari.nama}</td>
                <td className="px-4 py-2 text-gray-600">{j.jamMulai ?? "-"}{j.jamSelesai ? `–${j.jamSelesai}` : ""}</td>
                <td className="px-4 py-2 text-gray-600">{j.guru.namaGuru}</td>
                <td className="px-4 py-2 text-gray-600">{j.rombelId ? rombelMap.get(j.rombelId) ?? "-" : "-"}</td>
                <td className="px-4 py-2 text-gray-600">{j.mapel ?? "-"}</td>
                <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteJadwal} id={j.id} message="Hapus jadwal ini?" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
