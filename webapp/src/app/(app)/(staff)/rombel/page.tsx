import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteRombel } from "./actions";

export default async function RombelPage({
  searchParams,
}: {
  searchParams: Promise<{ ta?: string; tingkat?: string; wali?: string; groupBy?: string }>;
}) {
  const sekolahId = await requireModule("rombel");
  const sp = await searchParams;
  const taFilter = Number(sp.ta) || 0;
  const tingkatFilter = Number(sp.tingkat) || 0;
  const waliFilter = sp.wali ?? "";
  const groupBy = sp.groupBy ?? "ta"; // ta | tingkat | none

  const [rows, tahunAjaranList, tingkatList, taAktif] = await Promise.all([
    prisma.rombel.findMany({
      where: {
        sekolahId,
        ...(taFilter ? { tahunAjaranId: taFilter } : {}),
        ...(tingkatFilter ? { tingkatId: tingkatFilter } : {}),
        ...(waliFilter === "ada" ? { waliGuruId: { not: null } } : {}),
        ...(waliFilter === "kosong" ? { waliGuruId: null } : {}),
      },
      orderBy: [{ tahunAjaranId: "desc" }, { tingkat: { urutan: "asc" } }, { nama: "asc" }],
      include: {
        tingkat: { select: { id: true, nama: true, urutan: true } },
        tahunAjaran: { select: { id: true, tahun: true, aktif: true } },
        waliGuru: { select: { id: true, namaGuru: true } },
        _count: { select: { anggota: true } },
      },
    }),
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" }, select: { id: true, tahun: true, aktif: true } }),
    prisma.tingkat.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" }, select: { id: true, nama: true } }),
    prisma.tahunAjaran.findFirst({ where: { sekolahId, aktif: true }, select: { id: true } }),
  ]);

  // Stats
  const totalSiswa = rows.reduce((s, r) => s + r._count.anggota, 0);
  const tanpaWali = rows.filter((r) => !r.waliGuru).length;

  // Grouping
  type Row = typeof rows[number];
  let groups: { key: string | number; label: string; sublabel?: string; rows: Row[] }[] = [];

  if (groupBy === "ta") {
    const map = new Map<number, Row[]>();
    for (const r of rows) {
      if (!map.has(r.tahunAjaranId)) map.set(r.tahunAjaranId, []);
      map.get(r.tahunAjaranId)!.push(r);
    }
    // Sort by tahunAjaranId desc (already ordered)
    const seen = new Set<number>();
    for (const r of rows) {
      if (!seen.has(r.tahunAjaranId)) {
        seen.add(r.tahunAjaranId);
        const group = map.get(r.tahunAjaranId)!;
        groups.push({
          key: r.tahunAjaranId,
          label: r.tahunAjaran.tahun,
          sublabel: r.tahunAjaran.aktif ? "Aktif" : undefined,
          rows: group,
        });
      }
    }
  } else if (groupBy === "tingkat") {
    const map = new Map<number, Row[]>();
    for (const r of rows) {
      if (!map.has(r.tingkatId)) map.set(r.tingkatId, []);
      map.get(r.tingkatId)!.push(r);
    }
    const seen = new Set<number>();
    for (const r of rows) {
      if (!seen.has(r.tingkatId)) {
        seen.add(r.tingkatId);
        groups.push({ key: r.tingkatId, label: r.tingkat.nama, rows: map.get(r.tingkatId)! });
      }
    }
  } else {
    groups = [{ key: "all", label: "Semua Rombel", rows }];
  }

  const makeFilter = (extra: Record<string, string>) =>
    `/rombel?${new URLSearchParams({ ta: String(taFilter || ""), tingkat: String(tingkatFilter || ""), wali: waliFilter, groupBy, ...extra }).toString()}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Rombel / Kelas</h1>
          <p className="text-sm text-gray-500">
            {rows.length} rombel · {totalSiswa.toLocaleString("id-ID")} siswa
            {tanpaWali > 0 && (
              <span className="ml-2 text-amber-600">· ⚠ {tanpaWali} tanpa wali kelas</span>
            )}
          </p>
        </div>
        <Link href="/rombel/new"
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Rombel
        </Link>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Ajaran</label>
            <select name="ta" defaultValue={taFilter || ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="">Semua TA</option>
              {tahunAjaranList.map((t) => (
                <option key={t.id} value={t.id}>{t.tahun}{t.aktif ? " ★" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tingkat</label>
            <select name="tingkat" defaultValue={tingkatFilter || ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="">Semua Tingkat</option>
              {tingkatList.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Wali Kelas</label>
            <select name="wali" defaultValue={waliFilter} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="">Semua</option>
              <option value="ada">Ada wali kelas</option>
              <option value="kosong">Belum ada wali</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelompokkan</label>
            <select name="groupBy" defaultValue={groupBy} className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
              <option value="ta">Per Tahun Ajaran</option>
              <option value="tingkat">Per Tingkat</option>
              <option value="none">Tanpa pengelompokan</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Terapkan</button>
            {(taFilter || tingkatFilter || waliFilter) && (
              <Link href="/rombel" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>
            )}
          </div>
        </form>
      </div>

      {/* Group by tabs (quick switch) */}
      <div className="flex gap-1">
        {[["ta", "Per TA"], ["tingkat", "Per Tingkat"], ["none", "Flat"]].map(([val, lbl]) => (
          <Link key={val} href={makeFilter({ groupBy: val })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${groupBy === val ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
            {lbl}
          </Link>
        ))}
      </div>

      {/* Groups */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-4xl">🏫</div>
          <p className="mt-3 text-sm text-gray-500">Belum ada rombel yang sesuai filter.</p>
          <Link href="/rombel/new" className="mt-3 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">
            + Tambah Rombel
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Group header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800 text-base">{g.label}</span>
                  {g.sublabel && (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      ★ {g.sublabel}
                    </span>
                  )}
                  <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {g.rows.length} rombel
                  </span>
                  <span className="text-xs text-gray-400">
                    {g.rows.reduce((s, r) => s + r._count.anggota, 0)} siswa
                  </span>
                </div>
              </div>

              {/* Card grid per group */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.rows.map((r) => {
                  const pct = r._count.anggota > 0 ? Math.min(100, Math.round(r._count.anggota / 40 * 100)) : 0;
                  return (
                    <div key={r.id} className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-400 hover:shadow-sm transition-all">
                      {/* Top: nama + badge */}
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/rombel/${r.id}`} className="font-bold text-gray-900 hover:text-indigo-700 hover:underline leading-tight">
                          {r.nama}
                        </Link>
                        {r.kodeKelas && (
                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                            {r.kodeKelas}
                          </span>
                        )}
                      </div>

                      {/* Tingkat + TA (shown when groupBy=none) */}
                      {groupBy !== "ta" && (
                        <p className="mt-0.5 text-xs text-gray-400">{r.tahunAjaran.tahun}</p>
                      )}
                      {groupBy !== "tingkat" && (
                        <p className="text-xs text-gray-400">{r.tingkat.nama}</p>
                      )}

                      {/* Siswa count + bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Siswa</span>
                          <span className="font-semibold text-gray-700">{r._count.anggota}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-green-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Wali kelas */}
                      <div className="mt-2.5 flex items-center gap-2">
                        {r.waliGuru ? (
                          <>
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">
                              {r.waliGuru.namaGuru.charAt(0)}
                            </div>
                            <span className="truncate text-xs text-gray-600">{r.waliGuru.namaGuru}</span>
                          </>
                        ) : (
                          <span className="text-xs text-amber-600">⚠ Belum ada wali kelas</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2.5">
                        <Link href={`/rombel/${r.id}`} className="flex-1 rounded-lg border border-gray-300 py-1 text-center text-xs font-medium hover:bg-gray-100">
                          Kelola
                        </Link>
                        <Link href={`/rombel/${r.id}/edit`} className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">
                          Edit
                        </Link>
                        <ConfirmDelete action={deleteRombel} id={r.id} message={`Hapus rombel "${r.nama}"?`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
