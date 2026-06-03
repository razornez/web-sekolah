import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { saveRaporCatatan, addEkstra, deleteEkstra } from "../actions";

const inCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const PREDIKAT = ["Sangat Baik", "Baik", "Cukup", "Kurang"];

export default async function RaporSiswaEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ siswaId: string }>;
  searchParams: Promise<{ periodeId?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const siswaId = Number((await params).siswaId);
  const periodeId = Number((await searchParams).periodeId) || 0;

  const siswa = await prisma.siswa.findFirst({
    where: { id: siswaId, sekolahId },
    select: { id: true, namaLengkap: true, nisn: true },
  });
  if (!siswa) notFound();

  if (!periodeId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">{siswa.namaLengkap}</h1>
        <p className="text-gray-500">Periode tidak dipilih. <Link href="/nilai/rapor" className="underline">Kembali</Link>.</p>
      </div>
    );
  }

  const [periode, catatan, ekstra] = await Promise.all([
    prisma.periode.findFirst({ where: { id: periodeId, tahunAjaran: { sekolahId } }, include: { tahunAjaran: { select: { tahun: true } } } }),
    prisma.raporCatatan.findUnique({ where: { siswaId_periodeId: { siswaId, periodeId } } }),
    prisma.nilaiRaporEkstra.findMany({ where: { siswaId, periodeId }, orderBy: { id: "asc" } }),
  ]);
  if (!periode) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/nilai/rapor?periodeId=${periodeId}`} className="text-sm text-gray-500 hover:text-gray-900">← Daftar</Link>
          <h1 className="text-2xl font-semibold text-gray-900">{siswa.namaLengkap}</h1>
          <p className="text-sm text-gray-500">{siswa.nisn ?? "-"} · {periode.tahunAjaran.tahun} · {periode.nama}</p>
        </div>
        <a href={`/cetak/rapor/${siswa.id}?periodeId=${periodeId}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Cetak Rapor</a>
      </div>

      {/* Ekstrakurikuler */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Ekstrakurikuler</h2>
        <form action={addEkstra} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="siswaId" value={siswa.id} />
          <input type="hidden" name="periodeId" value={periodeId} />
          <div><label className="block text-xs text-gray-500">Nama</label><input name="namaEkstra" required placeholder="Pramuka" className={inCls} /></div>
          <div>
            <label className="block text-xs text-gray-500">Predikat</label>
            <select name="predikat" defaultValue="Baik" className={inCls}>
              {PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-1"><label className="block text-xs text-gray-500">Deskripsi</label><input name="deskripsi" className={`${inCls} w-full`} /></div>
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah</button>
        </form>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {ekstra.length === 0 && <tr><td className="py-2 text-gray-400">Belum ada ekstrakurikuler.</td></tr>}
            {ekstra.map((e) => (
              <tr key={e.id}>
                <td className="py-2 font-medium text-gray-900">{e.namaEkstra}</td>
                <td className="py-2 text-gray-600">{e.nilai ?? "-"}</td>
                <td className="py-2 text-gray-500">{e.deskripsi ?? ""}</td>
                <td className="py-2 text-right">
                  <form action={deleteEkstra} className="inline">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="siswaId" value={siswa.id} />
                    <button className="text-red-600 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Catatan wali kelas & sikap */}
      <form action={saveRaporCatatan} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input type="hidden" name="siswaId" value={siswa.id} />
        <input type="hidden" name="periodeId" value={periodeId} />
        <h2 className="text-sm font-medium text-gray-700">Catatan Wali Kelas & Sikap</h2>
        <div>
          <label className="block text-xs text-gray-500">Catatan Wali Kelas</label>
          <textarea name="catatan" defaultValue={catatan?.catatan ?? ""} rows={3} className={`${inCls} w-full`} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Sikap (deskripsi)</label>
          <textarea name="sikap" defaultValue={catatan?.sikap ?? ""} rows={2} className={`${inCls} w-full`} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Simpan Catatan</button>
      </form>
    </div>
  );
}
