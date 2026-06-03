import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { addAnggotaEkstra, removeAnggotaEkstra } from "../actions";

export default async function EkstraDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const ekstraId = Number((await params).id);
  const addQ = ((await searchParams).add ?? "").trim();

  const ekstra = await prisma.ekstrakurikuler.findFirst({
    where: { id: ekstraId, sekolahId },
    include: {
      pembina: { select: { namaGuru: true } },
      anggota: {
        include: { siswa: { select: { id: true, namaLengkap: true, nisn: true } } },
        orderBy: { siswa: { namaLengkap: "asc" } },
      },
    },
  });
  if (!ekstra) notFound();

  const kandidat = addQ
    ? await prisma.siswa.findMany({
        where: {
          sekolahId,
          namaLengkap: { contains: addQ, mode: "insensitive" },
          NOT: { anggotaEkstra: { some: { ekstraId } } },
        },
        take: 10,
        orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ekstrakurikuler" className="text-sm text-gray-500 hover:text-gray-900">← Ekstrakurikuler</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{ekstra.nama}</h1>
        <p className="text-sm text-gray-500">Pembina: {ekstra.pembina?.namaGuru ?? "-"} · {ekstra.anggota.length} anggota</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2 font-medium">Nama</th><th className="px-4 py-2 font-medium">NISN</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ekstra.anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada anggota.</td></tr>}
              {ekstra.anggota.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{a.siswa.namaLengkap}</td>
                  <td className="px-4 py-2 text-gray-600">{a.siswa.nisn ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeAnggotaEkstra} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="ekstraId" value={ekstra.id} />
                      <button className="text-red-600 hover:underline">Keluarkan</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-700">Tambah Anggota</h2>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <form className="flex gap-2">
              <input name="add" defaultValue={addQ} placeholder="Cari nama siswa…" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              <button className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Cari</button>
            </form>
            {addQ && kandidat.length === 0 && <p className="text-sm text-gray-400">Tidak ada siswa cocok.</p>}
            <ul className="divide-y divide-gray-100">
              {kandidat.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.namaLengkap} <span className="text-xs text-gray-400">{s.nisn ?? ""}</span></span>
                  <form action={addAnggotaEkstra}>
                    <input type="hidden" name="ekstraId" value={ekstra.id} />
                    <input type="hidden" name="siswaId" value={s.id} />
                    <button className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800">+ Tambah</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
