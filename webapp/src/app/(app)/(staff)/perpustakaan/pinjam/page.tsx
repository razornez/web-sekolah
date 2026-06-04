import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { pinjamBuku, kembalikanBuku } from "../actions";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function PinjamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; siswaId?: string }>;
}) {
  const sekolahId = await requireModule("perpustakaan");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const siswaId = Number(sp.siswaId) || 0;

  const kandidat = q
    ? await prisma.siswa.findMany({
        where: { sekolahId, OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { nisn: { contains: q } }] },
        take: 10, orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : [];

  const siswa = siswaId
    ? await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true, namaLengkap: true, nisn: true } })
    : null;

  const [pinjaman, bukuList] = siswa
    ? await Promise.all([
        prisma.pinjamanBuku.findMany({
          where: { siswaId: siswa.id, sekolahId },
          orderBy: { tanggalPinjam: "desc" },
          include: { buku: { select: { id: true, judul: true } } },
        }),
        prisma.bukuPerpustakaan.findMany({
          where: { sekolahId },
          orderBy: { judul: "asc" },
          select: { id: true, judul: true, jumlahEksemplar: true, _count: { select: { pinjaman: { where: { tanggalKembali: null } } } } },
        }),
      ])
    : [[], []];

  const today = new Date();
  const dueDate = (p: { tanggalPinjam: Date; durasiHari: number | null }) =>
    new Date(p.tanggalPinjam.getTime() + (p.durasiHari ?? 7) * 86400000);

  const aktif = pinjaman.filter((p) => !p.tanggalKembali);
  const selesai = pinjaman.filter((p) => p.tanggalKembali);
  const overdueCount = aktif.filter((p) => dueDate(p) < today).length;

  // Buku dengan stok tersedia
  const bukuTersedia = (bukuList as { id: number; judul: string; jumlahEksemplar: number; _count: { pinjaman: number } }[]).filter(
    (b) => b.jumlahEksemplar - b._count.pinjaman > 0,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Peminjaman Buku</h1>
          <p className="text-sm text-gray-500">Pilih siswa untuk melihat dan mengelola peminjaman.</p>
        </div>
        <Link href="/perpustakaan" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          ← Katalog Buku
        </Link>
      </div>

      {/* Search siswa */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cari Peminjam</p>
        <form className="flex gap-2">
          <SiswaAutocomplete
            name="q"
            defaultValue={q}
            placeholder="Ketik nama atau NISN siswa…"
            className="flex-1 rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-gray-900"
          />
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        </form>

        {/* Kandidat list */}
        {q && !siswa && (
          <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            {kandidat.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa cocok.</p>}
            {kandidat.map((s) => (
              <Link key={s.id} href={`/perpustakaan/pinjam?siswaId=${s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {s.namaLengkap.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.namaLengkap}</div>
                  {s.nisn && <div className="text-xs text-gray-400">NISN: {s.nisn}</div>}
                </div>
                <span className="ml-auto text-xs text-indigo-500">Pilih →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Siswa selected */}
      {siswa && (
        <div className="space-y-5">
          {/* Siswa card */}
          <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-lg font-black text-indigo-700">
              {siswa.namaLengkap.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{siswa.namaLengkap}</div>
              {siswa.nisn && <div className="text-xs text-gray-500">NISN: {siswa.nisn}</div>}
            </div>
            <div className="flex gap-3">
              {aktif.length > 0 && (
                <div className={`rounded-xl px-3 py-2 text-center ${overdueCount > 0 ? "bg-red-100" : "bg-amber-100"}`}>
                  <div className={`text-lg font-bold leading-none ${overdueCount > 0 ? "text-red-700" : "text-amber-700"}`}>{aktif.length}</div>
                  <div className={`text-xs ${overdueCount > 0 ? "text-red-500" : "text-amber-500"}`}>
                    {overdueCount > 0 ? `${overdueCount} overdue` : "dipinjam"}
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-green-100 px-3 py-2 text-center">
                <div className="text-lg font-bold leading-none text-green-700">{selesai.length}</div>
                <div className="text-xs text-green-500">selesai</div>
              </div>
            </div>
            <Link href="/perpustakaan/pinjam" className="text-sm text-gray-500 hover:text-gray-900">Ganti ↗</Link>
          </div>

          {/* Form pinjam */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-800">📕 Pinjamkan Buku</p>
            <form action={pinjamBuku} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="siswaId" value={siswa.id} />
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-gray-500 mb-1">Buku tersedia</label>
                <select name="bukuId" required className={`${inCls} w-full`}>
                  <option value="">— pilih buku —</option>
                  {bukuTersedia.map((b) => {
                    const sisa = b.jumlahEksemplar - b._count.pinjaman;
                    return <option key={b.id} value={b.id}>{b.judul} ({sisa} tersedia)</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Durasi (hari)</label>
                <input name="durasiHari" type="number" min={1} defaultValue={7} className={`${inCls} w-24`} />
              </div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                + Pinjam
              </button>
            </form>
          </div>

          {/* Aktif pinjaman */}
          {aktif.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
                <span className="text-sm font-semibold text-amber-800">📖 Sedang Dipinjam ({aktif.length})</span>
                {overdueCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{overdueCount} overdue!</span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {aktif.map((p) => {
                  const due = dueDate(p);
                  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);
                  const overdue = daysLeft < 0;
                  const daysBorrowed = Math.floor((today.getTime() - p.tanggalPinjam.getTime()) / 86400000);
                  return (
                    <div key={p.id} className={`flex items-center gap-4 px-4 py-3 ${overdue ? "bg-red-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <Link href={`/perpustakaan/${p.buku.id}`} className="font-medium text-gray-900 hover:underline line-clamp-1">
                          {p.buku.judul}
                        </Link>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">Pinjam: {fmt(p.tanggalPinjam)}</span>
                          <span className={`text-xs font-medium ${overdue ? "text-red-600" : "text-gray-500"}`}>
                            Jatuh tempo: {fmt(due)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {overdue ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            ⚠ {Math.abs(daysLeft)}h terlambat
                          </span>
                        ) : daysLeft <= 2 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            {daysLeft === 0 ? "Hari ini!" : `${daysLeft}h lagi`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{daysBorrowed}h dipinjam</span>
                        )}
                      </div>
                      <form action={kembalikanBuku}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="siswaId" value={siswa.id} />
                        <button className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${overdue ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                          Kembalikan
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Riwayat */}
          {selesai.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">🕐 Riwayat ({selesai.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Buku</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Pinjam</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kembali</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selesai.slice(0, 10).map((p) => {
                      const days = p.tanggalKembali
                        ? Math.max(0, Math.floor((p.tanggalKembali.getTime() - p.tanggalPinjam.getTime()) / 86400000))
                        : null;
                      const late = days !== null && p.durasiHari && days > p.durasiHari;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <Link href={`/perpustakaan/${p.buku.id}`} className="text-gray-900 hover:underline line-clamp-1">
                              {p.buku.judul}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmt(p.tanggalPinjam)}</td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmt(p.tanggalKembali ?? null)}</td>
                          <td className="px-4 py-2.5">
                            {days !== null ? (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${late ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                                {days}h{late ? " ⚠" : ""}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pinjaman.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
              <div className="text-4xl">📚</div>
              <p className="mt-2 text-sm text-gray-500">Siswa ini belum pernah meminjam buku.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
