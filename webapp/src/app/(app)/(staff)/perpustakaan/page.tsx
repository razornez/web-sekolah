import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteBuku } from "./actions";

const PER_PAGE = 20;

export default async function PerpustakaanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sekolahId = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.BukuPerpustakaanWhereInput = {
    sekolahId,
    ...(q
      ? {
          OR: [
            { judul: { contains: q, mode: "insensitive" } },
            { pengarang: { contains: q, mode: "insensitive" } },
            { isbn: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.bukuPerpustakaan.count({ where }),
    prisma.bukuPerpustakaan.findMany({
      where,
      orderBy: { judul: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { pinjaman: { where: { tanggalKembali: null } } } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/perpustakaan?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Perpustakaan — Katalog Buku</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} judul</p>
        </div>
        <div className="flex gap-2">
          <Link href="/perpustakaan/pinjam" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
            Peminjaman
          </Link>
          <Link href="/perpustakaan/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            + Tambah Buku
          </Link>
        </div>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari judul / pengarang / ISBN…" className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        {q && <Link href="/perpustakaan" className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Judul</th>
              <th className="px-4 py-2 font-medium">Pengarang</th>
              <th className="px-4 py-2 font-medium">Tahun</th>
              <th className="px-4 py-2 font-medium">Eksemplar</th>
              <th className="px-4 py-2 font-medium">Dipinjam</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada buku.</td></tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/perpustakaan/${b.id}`} className="font-medium text-gray-900 hover:underline">{b.judul}</Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{b.pengarang ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{b.tahunTerbit ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{b.jumlahEksemplar}</td>
                <td className="px-4 py-2 text-gray-600">{b._count.pinjaman}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/perpustakaan/${b.id}`} className="text-gray-600 hover:underline">Edit</Link>
                    <ConfirmDelete action={deleteBuku} id={b.id} message={`Hapus buku "${b.judul}"?`} />
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
            {page > 1 && <Link href={hrefPage(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hrefPage(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
