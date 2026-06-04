import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { PageGuide } from "@/components/PageGuide";
import { aktifkanKembaliGuru } from "./actions";

const PER_PAGE = 20;
const STATUS_BADGE: Record<string, string> = { PNS: "bg-blue-100 text-blue-700", GTT: "bg-amber-100 text-amber-700", GTY: "bg-purple-100 text-purple-700" };

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tampil?: string }>;
}) {
  const sekolahId = await requireModule("guru");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tampil = sp.tampil ?? "aktif"; // aktif | nonaktif
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.GuruWhereInput = {
    sekolahId,
    deletedAt: tampil === "nonaktif" ? { not: null } : null,
    ...(q ? { OR: [{ namaGuru: { contains: q, mode: "insensitive" } }, { nip: { contains: q } }, { nuptk: { contains: q } }] } : {}),
  };

  const [total, rows, nonaktifCount] = await Promise.all([
    prisma.guru.count({ where }),
    prisma.guru.findMany({ where, orderBy: { namaGuru: "asc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.guru.count({ where: { sekolahId, deletedAt: { not: null } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hp = (p: number) => `/guru?${new URLSearchParams({ q, tampil, page: String(p) }).toString()}`;

  return (
    <div className="space-y-4">
      <PageGuide
        icon="👨‍🏫"
        title="Data Guru / PTK"
        description="Kelola data seluruh Pendidik dan Tenaga Kependidikan (PTK). Setiap guru dapat memiliki akun login, jadwal mengajar, dan data kependidikan."
        tips={[
          "Klik nama guru untuk melihat detail: biodata, jadwal, jurnal, mapel yang diajar.",
          "Guru tidak bisa dihapus permanen — gunakan Nonaktifkan dengan alasan yang jelas.",
          "Guru nonaktif masih tersimpan datanya dan bisa diaktifkan kembali.",
          "Status: PNS (Pegawai Negeri), GTT (Guru Tidak Tetap), GTY (Guru Tetap Yayasan).",
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Data Guru / PTK</h1>
          <p className="text-sm text-gray-500">
            {total.toLocaleString("id-ID")} guru {tampil}
            {nonaktifCount > 0 && (
              <Link href="/guru?tampil=nonaktif" className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-100">
                ⛔ {nonaktifCount} nonaktif
              </Link>
            )}
          </p>
        </div>
        <Link href="/guru/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          + Tambah Guru
        </Link>
      </div>

      {/* Tab aktif/nonaktif + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-gray-300">
          <Link href={`/guru?q=${q}`} className={`px-3 py-1.5 text-xs font-medium transition-colors ${tampil === "aktif" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>✅ Aktif</Link>
          <Link href={`/guru?tampil=nonaktif&q=${q}`} className={`border-l px-3 py-1.5 text-xs font-medium transition-colors ${tampil === "nonaktif" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>⛔ Nonaktif ({nonaktifCount})</Link>
        </div>
        <form className="flex flex-1 gap-2">
          <input type="hidden" name="tampil" value={tampil} />
          <input name="q" defaultValue={q} placeholder="Cari nama / NIP / NUPTK…" className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900 sm:w-64" />
          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">Cari</button>
          {q && <Link href={`/guru?tampil=${tampil}`} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nama</th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell">NIP / NPK</th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell">L/P</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
              {tampil === "nonaktif" && <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell">Alasan Nonaktif</th>}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={tampil === "nonaktif" ? 6 : 5} className="px-4 py-10 text-center text-gray-400">Tidak ada data.</td></tr>}
            {rows.map((g) => (
              <tr key={g.id} className={`hover:bg-gray-50 transition-colors ${tampil === "nonaktif" ? "opacity-70" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/guru/${g.id}`} className="font-medium text-gray-900 hover:underline">{g.namaGuru}</Link>
                  {g.email && <div className="text-xs text-gray-400">{g.email}</div>}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-gray-600 sm:table-cell">{g.nip ?? g.npk ?? "—"}</td>
                <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{g.jenisKelamin}</td>
                <td className="px-4 py-3">
                  {g.statusGuru && <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE[g.statusGuru] ?? "bg-gray-100 text-gray-700"}`}>{g.statusGuru}</span>}
                </td>
                {tampil === "nonaktif" && (
                  <td className="hidden px-4 py-3 max-w-xs text-xs text-gray-500 italic truncate sm:table-cell">{g.alasanHapus ?? "—"}</td>
                )}
                <td className="px-4 py-3 text-right">
                  {tampil === "nonaktif" ? (
                    <form action={aktifkanKembaliGuru} className="inline">
                      <input type="hidden" name="id" value={g.id} />
                      <button className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50">↩ Aktifkan</button>
                    </form>
                  ) : (
                    <Link href={`/guru/${g.id}`} className="text-gray-600 hover:underline">Detail / Edit</Link>
                  )}
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
            {page > 1 && <Link href={hp(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
