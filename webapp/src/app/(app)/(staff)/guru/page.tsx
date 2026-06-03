import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteGuru } from "./actions";

const PER_PAGE = 20;

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sekolahId = await getSekolahId();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.GuruWhereInput = {
    sekolahId,
    ...(q
      ? {
          OR: [
            { namaGuru: { contains: q, mode: "insensitive" } },
            { nip: { contains: q } },
            { nuptk: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.guru.count({ where }),
    prisma.guru.findMany({
      where,
      orderBy: { namaGuru: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/guru?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Guru / PTK</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} guru</p>
        </div>
        <Link
          href="/guru/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Guru
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama / NIP / NUPTK…"
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        {q && (
          <Link href="/guru" className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">
            Reset
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">NIP</th>
              <th className="px-4 py-2 font-medium">L/P</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {rows.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/guru/${g.id}`} className="font-medium text-gray-900 hover:underline">
                    {g.namaGuru}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{g.nip ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{g.jenisKelamin}</td>
                <td className="px-4 py-2 text-gray-600">{g.statusGuru ?? "-"}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/guru/${g.id}`} className="text-gray-600 hover:underline">
                      Edit
                    </Link>
                    <ConfirmDelete action={deleteGuru} id={g.id} message={`Hapus guru "${g.namaGuru}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefPage(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">
                ← Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefPage(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">
                Selanjutnya →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
