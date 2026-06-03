import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { saveMutasi, deleteMutasi } from "../prestasi/actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const PER = 30;

export default async function MutasiPage({ searchParams }: { searchParams: Promise<{ q?: string; jenis?: string; page?: string }> }) {
  const sekolahId = await requireModule("siswa");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const jenis = sp.jenis === "masuk" ? "masuk" : sp.jenis === "keluar" ? "keluar" : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.MutasiSiswaWhereInput = {
    sekolahId,
    ...(jenis ? { jenis } : {}),
    ...(q ? { siswa: { namaLengkap: { contains: q, mode: "insensitive" } } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.mutasiSiswa.count({ where }),
    prisma.mutasiSiswa.findMany({
      where, orderBy: { tanggal: "desc" }, skip: (page - 1) * PER, take: PER,
      include: { siswa: { select: { id: true, namaLengkap: true, nisn: true } } },
    }),
  ]);

  const siswaOpts = await prisma.siswa.findMany({
    where: { sekolahId }, orderBy: { namaLengkap: "asc" },
    take: 300, select: { id: true, namaLengkap: true },
  });
  const totalPages = Math.max(1, Math.ceil(total / PER));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Mutasi Siswa</h1>

      <form action={saveMutasi} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Siswa</label>
          <select name="siswaId" required defaultValue="" className={inCls}>
            <option value="">- pilih -</option>
            {siswaOpts.map((s) => <option key={s.id} value={s.id}>{s.namaLengkap}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Jenis</label>
          <select name="jenis" defaultValue="keluar" className={inCls}>
            <option value="masuk">Masuk</option>
            <option value="keluar">Keluar</option>
          </select>
        </div>
        <div className="flex-1"><label className="block text-xs text-gray-500">Asal / Tujuan Sekolah</label><input name="asalTujuan" className={`${inCls} w-full`} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-500">Alasan</label><input name="alasan" className={`${inCls} w-full`} /></div>
        <div><label className="block text-xs text-gray-500">Tanggal</label><input type="date" name="tanggal" defaultValue={new Date().toISOString().slice(0, 10)} className={inCls} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Catat</button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        {[["", "Semua"], ["masuk", "Masuk"], ["keluar", "Keluar"]].map(([val, lbl]) => (
          <Link key={val} href={`/mutasi?jenis=${val}${q ? `&q=${q}` : ""}`} className={`rounded-md border px-3 py-1.5 ${jenis === val ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-100"}`}>{lbl}</Link>
        ))}
        <form className="flex gap-2 ml-auto">
          {jenis && <input type="hidden" name="jenis" value={jenis} />}
          <input name="q" defaultValue={q} placeholder="Cari nama siswa…" className={`${inCls} w-60`} />
          <button className="rounded-md border border-gray-300 px-4 py-1.5 hover:bg-gray-100">Cari</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Siswa</th><th className="px-4 py-2 font-medium">Jenis</th><th className="px-4 py-2 font-medium">Asal/Tujuan</th><th className="px-4 py-2 font-medium">Alasan</th><th className="px-4 py-2 font-medium">Tanggal</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data mutasi.</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/siswa/${m.siswa?.id}`} className="text-gray-900 hover:underline">{m.siswa?.namaLengkap ?? "-"}</Link></td>
                <td className="px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${m.jenis === "masuk" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{m.jenis}</span></td>
                <td className="px-4 py-2 text-gray-600">{m.asalTujuan ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{m.alasan ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{fmt(m.tanggal)}</td>
                <td className="px-4 py-2 text-right"><ConfirmDelete action={deleteMutasi} id={m.id} message={`Hapus mutasi ini?`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/mutasi?jenis=${jenis}&q=${q}&page=${page - 1}`} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={`/mutasi?jenis=${jenis}&q=${q}&page=${page + 1}`} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
