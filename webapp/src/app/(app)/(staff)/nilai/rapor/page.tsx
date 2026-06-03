import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const selCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export default async function RaporDetailListPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; periodeId?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;

  const [rombelOpts, periodeOpts] = await Promise.all([
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: { nama: "asc" }, include: { tahunAjaran: { select: { tahun: true } } } }),
    prisma.periode.findMany({ where: { tahunAjaran: { sekolahId } }, orderBy: [{ tahunAjaranId: "desc" }, { urutan: "asc" }], include: { tahunAjaran: { select: { tahun: true } } } }),
  ]);

  const anggota = rombelId && periodeId
    ? await prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true } } },
      })
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapor — Ekstrakurikuler & Catatan</h1>
          <p className="text-sm text-gray-500">Lengkapi halaman 2 rapor (e-Rapor Merdeka) per siswa.</p>
        </div>
        <Link href="/nilai" className="text-sm text-gray-500 hover:text-gray-900">← Input Nilai Mapel</Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <select name="rombelId" defaultValue={rombelId || ""} className={selCls}>
            <option value="">- pilih -</option>
            {rombelOpts.map((r) => <option key={r.id} value={r.id}>{r.nama} ({r.tahunAjaran.tahun})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Periode</label>
          <select name="periodeId" defaultValue={periodeId || ""} className={selCls}>
            <option value="">- pilih -</option>
            {periodeOpts.map((p) => <option key={p.id} value={p.id}>{p.tahunAjaran.tahun} · {p.nama}</option>)}
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Tampilkan</button>
      </form>

      {rombelId > 0 && periodeId > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2 font-medium">No</th><th className="px-4 py-2 font-medium">Nama</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Rombel belum punya anggota.</td></tr>}
              {anggota.map((a, i) => (
                <tr key={a.siswaId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500">{a.nomorAbsen ?? i + 1}</td>
                  <td className="px-4 py-2 text-gray-900">{a.siswa.namaLengkap}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/nilai/rapor/${a.siswaId}?periodeId=${periodeId}`} className="text-gray-600 hover:underline">Detail Rapor</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
