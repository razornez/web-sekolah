import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteSiswa } from "./actions";

const PER_PAGE = 20;

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sekolahId = await getSekolahId();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.SiswaWhereInput = {
    sekolahId,
    ...(q
      ? {
          OR: [
            { namaLengkap: { contains: q, mode: "insensitive" } },
            { nisn: { contains: q } },
            { nis: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({
      where,
      orderBy: { namaLengkap: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        anggotaRombel: {
          include: { rombel: { select: { nama: true } } },
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/siswa?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Siswa</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} siswa</p>
        </div>
        <Link
          href="/siswa/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Siswa
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama / NISN / NIS…"
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          Cari
        </button>
        {q && (
          <Link href="/siswa" className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">
            Reset
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">NISN</th>
              <th className="px-4 py-2 font-medium">L/P</th>
              <th className="px-4 py-2 font-medium">Kelas</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/siswa/${s.id}`} className="font-medium text-gray-900 hover:underline">
                    {s.namaLengkap}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{s.nisn ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{s.jenisKelamin ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">
                  {s.anggotaRombel[0]?.rombel.nama ?? "-"}
                </td>
                <td className="px-4 py-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/siswa/${s.id}`} className="text-gray-600 hover:underline">
                      Edit
                    </Link>
                    <ConfirmDelete action={deleteSiswa} id={s.id} message={`Hapus siswa "${s.namaLengkap}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Halaman {page} dari {totalPages}
          </span>
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
