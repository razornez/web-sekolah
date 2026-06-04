import Link from "next/link";
import { type Prisma, StatusPpdb } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { PageGuide } from "@/components/PageGuide";

const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STEPS: { key: StatusPpdb; label: string; color: string }[] = [
  { key: "baru",       label: "Baru",        color: "bg-gray-100 text-gray-700" },
  { key: "verifikasi", label: "Verifikasi",   color: "bg-blue-100 text-blue-700" },
  { key: "tes",        label: "Tes",          color: "bg-purple-100 text-purple-700" },
  { key: "wawancara",  label: "Wawancara",    color: "bg-indigo-100 text-indigo-700" },
  { key: "diterima",   label: "Diterima ✓",   color: "bg-green-100 text-green-700" },
  { key: "cadangan",   label: "Cadangan",     color: "bg-amber-100 text-amber-700" },
  { key: "ditolak",    label: "Ditolak ✗",    color: "bg-red-100 text-red-700" },
];
const badgeOf = (s: StatusPpdb) => STATUS_STEPS.find((x) => x.key === s) ?? STATUS_STEPS[0];

type GroupBy = "none" | "jalur" | "asalSekolah" | "jenisKelamin" | "status";

export default async function PpdbPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; status?: string; jalur?: string; jk?: string;
    groupBy?: string; arsip?: string; page?: string;
  }>;
}) {
  const sekolahId = await requireModule("ppdb");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const statusFilter = sp.status ?? "";
  const jalurFilter = sp.jalur ?? "";
  const jkFilter = sp.jk ?? "";
  const groupBy = (sp.groupBy ?? "none") as GroupBy;
  const showArsip = sp.arsip === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const PER = 50;

  const where: Prisma.PendaftaranPpdbWhereInput = {
    sekolahId,
    deletedAt: showArsip ? { not: null } : null,
    ...(q ? { namaLengkap: { contains: q, mode: "insensitive" } } : {}),
    ...(StatusPpdb[statusFilter as StatusPpdb] !== undefined || STATUS_STEPS.some(s => s.key === statusFilter)
      ? { status: statusFilter as StatusPpdb } : {}),
    ...(jalurFilter ? { jalurId: Number(jalurFilter) } : {}),
    ...(jkFilter === "L" ? { jenisKelamin: "L" } : jkFilter === "P" ? { jenisKelamin: "P" } : {}),
  };

  const [total, rows, jalurList, sekolah, counts] = await Promise.all([
    prisma.pendaftaranPpdb.count({ where }),
    prisma.pendaftaranPpdb.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PER, take: PER,
      include: { jalur: { select: { id: true, nama: true } } },
    }),
    prisma.jalurPpdb.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { slug: true } }),
    prisma.pendaftaranPpdb.groupBy({
      by: ["status"],
      where: { sekolahId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) =>
    `/ppdb?${new URLSearchParams({ q, status: statusFilter, jalur: jalurFilter, jk: jkFilter, groupBy, arsip: showArsip ? "1" : "", page: String(p) }).toString()}`;

  // Summary counts
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const totalAktif = counts.reduce((s, c) => s + c._count._all, 0);

  // Group rows
  type Row = typeof rows[number];
  let groups: { key: string; label: string; rows: Row[] }[] = [];
  if (groupBy === "none") {
    groups = [{ key: "all", label: "", rows }];
  } else if (groupBy === "jalur") {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = r.jalur?.nama ?? "Tanpa Jalur";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    groups = [...map.entries()].map((e) => ({ key: e[0], label: e[0], rows: e[1] }));
  } else if (groupBy === "asalSekolah") {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = r.asalSekolah?.trim() || "Tidak Diketahui";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    groups = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((e) => ({ key: e[0], label: e[0], rows: e[1] }));
  } else if (groupBy === "jenisKelamin") {
    groups = [
      { key: "L", label: "Laki-laki", rows: rows.filter((r) => r.jenisKelamin === "L") },
      { key: "P", label: "Perempuan", rows: rows.filter((r) => r.jenisKelamin === "P") },
    ].filter((g) => g.rows.length > 0);
  } else if (groupBy === "status") {
    groups = STATUS_STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      rows: rows.filter((r) => r.status === s.key),
    })).filter((g) => g.rows.length > 0);
  }

  const makeFilter = (extra: Record<string, string>) =>
    `/ppdb?${new URLSearchParams({ q, status: statusFilter, jalur: jalurFilter, jk: jkFilter, groupBy, arsip: showArsip ? "1" : "", page: "1", ...extra }).toString()}`;

  return (
    <div className="space-y-5">
      <PageGuide
        icon="🏫"
        title="PPDB"
        description="Penerimaan Peserta Didik Baru. Pantau proses pendaftaran, verifikasi, seleksi, hingga keputusan akhir setiap calon siswa."
        tips={[
          "Klik nama pendaftar untuk melihat detail, riwayat tahapan, dan dokumen.",
          "Gunakan Group By untuk memetakan pendaftar per jalur atau asal sekolah.",
          "Arsip = data yang sudah di-soft-delete (tidak permanen, bisa dipulihkan).",
          "Setiap perubahan status tersimpan otomatis sebagai history.",
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">PPDB — Pendaftar</h1>
          <p className="text-sm text-gray-500">
            {totalAktif} pendaftar aktif ·{" "}
            <Link href={`/daftar/${sekolah?.slug}`} className="underline hover:text-gray-900">/daftar/{sekolah?.slug}</Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ppdb/new" className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Pendaftar
          </Link>
          <Link href="/ppdb/jalur" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Kelola Jalur</Link>
          <Link href={showArsip ? "/ppdb" : "/ppdb?arsip=1"}
            className={`rounded-lg border px-3 py-2 text-sm ${showArsip ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 hover:bg-gray-50"}`}>
            {showArsip ? "← Aktif" : "🗑 Arsip"}
          </Link>
        </div>
      </div>

      {/* Status funnel */}
      {!showArsip && (
        <div className="flex flex-wrap gap-2">
          <Link href={makeFilter({ status: "" })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!statusFilter ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
            Semua ({totalAktif})
          </Link>
          {STATUS_STEPS.map((s) => (
            <Link key={s.key} href={makeFilter({ status: s.key })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusFilter === s.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
              {s.label} {countMap[s.key] ? `(${countMap[s.key]})` : ""}
            </Link>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="arsip" value={showArsip ? "1" : ""} />
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cari Nama</label>
            <input name="q" defaultValue={q} placeholder="Nama pendaftar…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jalur</label>
            <select name="jalur" defaultValue={jalurFilter} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="">Semua Jalur</option>
              {jalurList.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Kelamin</label>
            <select name="jk" defaultValue={jkFilter} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grup per</label>
            <select name="groupBy" defaultValue={groupBy} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="none">— tidak dikelompokkan —</option>
              <option value="jalur">Jalur</option>
              <option value="asalSekolah">Asal Sekolah</option>
              <option value="jenisKelamin">Jenis Kelamin</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Terapkan</button>
            {(q || jalurFilter || jkFilter || groupBy !== "none") && (
              <Link href={`/ppdb?arsip=${showArsip ? "1" : ""}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>
            )}
          </div>
        </form>
      </div>

      {/* Table per group */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-4xl">🏫</div>
          <p className="mt-3 text-sm text-gray-500">{showArsip ? "Tidak ada data di arsip." : "Belum ada pendaftar."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {groupBy !== "none" && (
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{g.label}</span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{g.rows.length}</span>
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tgl Daftar</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">L/P</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asal Sekolah</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jalur</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {g.rows.map((p) => {
                    const b = badgeOf(p.status);
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 ${p.deletedAt ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/ppdb/${p.id}`} className="font-medium text-gray-900 hover:text-indigo-700 hover:underline">
                            {p.namaLengkap}
                          </Link>
                          {p.nisn && <div className="text-xs text-gray-400">NISN: {p.nisn}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.jenisKelamin === "L" ? "L" : "P"}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{p.asalSekolah ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{p.jalur?.nama ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.color}`}>
                            {b.label}
                          </span>
                          {p.catatan && (
                            <p className="mt-0.5 text-xs text-gray-400 max-w-[180px] truncate" title={p.catatan}>
                              {p.catatan}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/ppdb/${p.id}`} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100">
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages} ({total} pendaftar)</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hp(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
