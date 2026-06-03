import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteSurat } from "./actions";

const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function SuratPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sekolahId = await requireStaff();
  const q = ((await searchParams).q ?? "").trim();

  const where: Prisma.SuratWhereInput = {
    sekolahId,
    ...(q
      ? {
          OR: [
            { perihal: { contains: q, mode: "insensitive" } },
            { nomor: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.surat.findMany({ where, orderBy: { tanggal: "desc" }, take: 100 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Administrasi Surat</h1>
        <Link href="/surat/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          + Tambah Surat
        </Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari perihal / nomor…" className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        {q && <Link href="/surat" className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Nomor</th>
              <th className="px-4 py-2 font-medium">Perihal</th>
              <th className="px-4 py-2 font-medium">Jenis</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada surat.</td></tr>}
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{fmt(s.tanggal)}</td>
                <td className="px-4 py-2 text-gray-600">{s.nomor ?? "-"}</td>
                <td className="px-4 py-2">
                  <Link href={`/surat/${s.id}`} className="font-medium text-gray-900 hover:underline">{s.perihal}</Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{s.jenis ?? "-"}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/surat/${s.id}`} className="text-gray-600 hover:underline">Edit</Link>
                    <ConfirmDelete action={deleteSurat} id={s.id} message={`Hapus surat "${s.perihal}"?`} />
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
