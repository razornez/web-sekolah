import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteMapel } from "./actions";
import { PageGuide } from "@/components/PageGuide";

export default async function MapelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sekolahId = await getSekolahId();
  const q = ((await searchParams).q ?? "").trim();

  const where: Prisma.MapelWhereInput = {
    sekolahId,
    ...(q
      ? {
          OR: [
            { namaMapel: { contains: q, mode: "insensitive" } },
            { kodeMapel: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.mapel.findMany({
    where,
    orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }],
    include: { guru: { select: { namaGuru: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mata Pelajaran</h1>
          <p className="text-sm text-gray-500">{rows.length} mapel</p>
        </div>
        <Link href="/mapel/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          + Tambah Mapel
        </Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari nama / kode…" className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        {q && <Link href="/mapel" className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Kode</th>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Kelompok</th>
              <th className="px-4 py-2 font-medium">Fase</th>
              <th className="px-4 py-2 font-medium">KKM</th>
              <th className="px-4 py-2 font-medium">Pengampu</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada mapel.</td></tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-600">{m.kodeMapel}</td>
                <td className="px-4 py-2">
                  <Link href={`/mapel/${m.id}`} className="font-medium text-gray-900 hover:underline">{m.namaMapel}</Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{m.kelompok}</td>
                <td className="px-4 py-2 text-gray-600">{m.fase ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{m.kkm}</td>
                <td className="px-4 py-2 text-gray-600">{m.guru?.namaGuru ?? "-"}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/mapel/${m.id}`} className="text-gray-600 hover:underline">Edit</Link>
                    <ConfirmDelete action={deleteMapel} id={m.id} message={`Hapus mapel "${m.namaMapel}"?`} />
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
