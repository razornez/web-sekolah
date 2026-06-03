import Link from "next/link";
import { type Prisma, StatusPpdb } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { updateStatusPendaftar, deletePendaftar } from "./actions";

const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const STATUS = ["baru", "diterima", "ditolak", "cadangan"];
const badge: Record<string, string> = {
  baru: "bg-gray-100 text-gray-700",
  diterima: "bg-green-100 text-green-700",
  ditolak: "bg-red-100 text-red-700",
  cadangan: "bg-amber-100 text-amber-700",
};

export default async function PpdbPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sekolahId = await requireStaff();
  const status = (await searchParams).status ?? "";

  const where: Prisma.PendaftaranPpdbWhereInput = { sekolahId };
  if (STATUS.includes(status)) where.status = status as StatusPpdb;

  const [rows, sekolah] = await Promise.all([
    prisma.pendaftaranPpdb.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { jalur: { select: { nama: true } } },
      take: 200,
    }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { slug: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">PPDB — Pendaftar</h1>
          <p className="text-sm text-gray-500">
            {rows.length} pendaftar · form publik:{" "}
            <Link href={`/daftar/${sekolah?.slug}`} className="text-gray-700 underline">/daftar/{sekolah?.slug}</Link>
          </p>
        </div>
        <Link href="/ppdb/jalur" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Kelola Jalur</Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/ppdb" className={`rounded-md border px-3 py-1.5 ${!status ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>Semua</Link>
        {STATUS.map((s) => (
          <Link key={s} href={`/ppdb?status=${s}`} className={`rounded-md border px-3 py-1.5 ${status === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>{s}</Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tgl Daftar</th>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">L/P</th>
              <th className="px-4 py-2 font-medium">Asal Sekolah</th>
              <th className="px-4 py-2 font-medium">Jalur</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada pendaftar.</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{fmt(p.createdAt)}</td>
                <td className="px-4 py-2 text-gray-900">{p.namaLengkap}</td>
                <td className="px-4 py-2 text-gray-600">{p.jenisKelamin}</td>
                <td className="px-4 py-2 text-gray-600">{p.asalSekolah ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{p.jalur?.nama ?? "-"}</td>
                <td className="px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${badge[p.status]}`}>{p.status}</span></td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <form action={updateStatusPendaftar} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="status" defaultValue={p.status} className="rounded-md border border-gray-300 px-1 py-1 text-xs">
                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">Set</button>
                    </form>
                    <ConfirmDelete action={deletePendaftar} id={p.id} message={`Hapus pendaftar "${p.namaLengkap}"?`} />
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
