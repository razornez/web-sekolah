import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const PER = 50;
const fmt = (d: Date) => d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const BADGE: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ aksi?: string; entitas?: string; user?: string; page?: string }>;
}) {
  const sekolahId = await requireModule("audit");
  const sp = await searchParams;
  const aksi = sp.aksi ?? "";
  const entitas = sp.entitas ?? "";
  const user = (sp.user ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = {
    sekolahId,
    ...(aksi ? { aksi } : {}),
    ...(entitas ? { entitas } : {}),
    ...(user ? { userName: { contains: user, mode: "insensitive" } } : {}),
  };

  const [total, rows, entitasList] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    prisma.auditLog.findMany({
      where: { sekolahId },
      distinct: ["entitas"],
      select: { entitas: true },
      orderBy: { entitas: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));

  const hrefFilter = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ aksi, entitas, user, page: "1", ...extra });
    return `/audit?${p.toString()}`;
  };
  const hrefPage = (p: number) => {
    const params = new URLSearchParams({ aksi, entitas, user, page: String(p) });
    return `/audit?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} entri · semua aksi tulis oleh staf</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Aksi</label>
          <div className="flex gap-1">
            {["", "create", "update", "delete"].map((a) => (
              <Link key={a} href={hrefFilter({ aksi: a })} className={`rounded px-2 py-1 text-xs border ${aksi === a ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>
                {a === "" ? "Semua" : a}
              </Link>
            ))}
          </div>
        </div>
        <form className="flex items-end gap-2">
          <input type="hidden" name="aksi" value={aksi} />
          <input type="hidden" name="user" value={user} />
          <div>
            <label className="block text-xs text-gray-500">Entitas</label>
            <select name="entitas" defaultValue={entitas} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
              <option value="">Semua</option>
              {entitasList.map((e) => <option key={e.entitas} value={e.entitas}>{e.entitas}</option>)}
            </select>
          </div>
          <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Filter</button>
        </form>
        <form className="flex items-end gap-2">
          <input type="hidden" name="aksi" value={aksi} />
          <input type="hidden" name="entitas" value={entitas} />
          <div><label className="block text-xs text-gray-500">Cari nama user</label><input name="user" defaultValue={user} className="rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900" /></div>
          <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Cari</button>
        </form>
        {(aksi || entitas || user) && <Link href="/audit" className="text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </div>

      {/* Entitas filter chips */}
      <div className="flex flex-wrap gap-1">
        <Link href={hrefFilter({ entitas: "" })} className={`rounded-full border px-3 py-1 text-xs ${!entitas ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-100"}`}>Semua</Link>
        {entitasList.map((e) => (
          <Link key={e.entitas} href={hrefFilter({ entitas: e.entitas })} className={`rounded-full border px-3 py-1 text-xs ${entitas === e.entitas ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-100"}`}>
            {e.entitas}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Waktu</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Aksi</th>
              <th className="px-4 py-2 font-medium">Entitas</th>
              <th className="px-4 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada log.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={String(r.id)} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                <td className="px-4 py-2 text-gray-900">{r.userName}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{r.role}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${BADGE[r.aksi] ?? "bg-gray-100 text-gray-600"}`}>{r.aksi}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600">{r.entitas}{r.entitasId ? `#${r.entitasId}` : ""}</td>
                <td className="px-4 py-2 text-gray-600">{r.detail ?? "-"}</td>
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
