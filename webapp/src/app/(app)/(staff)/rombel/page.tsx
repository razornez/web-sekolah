import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteRombel } from "./actions";

export default async function RombelPage() {
  const sekolahId = await getSekolahId();
  const rows = await prisma.rombel.findMany({
    where: { sekolahId },
    orderBy: [{ tahunAjaranId: "desc" }, { nama: "asc" }],
    include: {
      tingkat: { select: { nama: true } },
      tahunAjaran: { select: { tahun: true } },
      waliGuru: { select: { namaGuru: true } },
      _count: { select: { anggota: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rombel / Kelas</h1>
          <p className="text-sm text-gray-500">{rows.length} rombongan belajar</p>
        </div>
        <Link
          href="/rombel/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Rombel
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Tingkat</th>
              <th className="px-4 py-2 font-medium">Tahun Ajaran</th>
              <th className="px-4 py-2 font-medium">Wali Kelas</th>
              <th className="px-4 py-2 font-medium">Anggota</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Belum ada rombel.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/rombel/${r.id}`} className="font-medium text-gray-900 hover:underline">
                    {r.nama}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{r.tingkat.nama}</td>
                <td className="px-4 py-2 text-gray-600">{r.tahunAjaran.tahun}</td>
                <td className="px-4 py-2 text-gray-600">{r.waliGuru?.namaGuru ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{r._count.anggota}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/rombel/${r.id}`} className="text-gray-600 hover:underline">Kelola</Link>
                    <Link href={`/rombel/${r.id}/edit`} className="text-gray-600 hover:underline">Edit</Link>
                    <ConfirmDelete action={deleteRombel} id={r.id} message={`Hapus rombel "${r.nama}"?`} />
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
