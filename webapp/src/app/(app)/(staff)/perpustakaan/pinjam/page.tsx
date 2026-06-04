import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { pinjamBuku, kembalikanBuku } from "../actions";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default async function PinjamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; siswaId?: string }>;
}) {
  const sekolahId = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const siswaId = Number(sp.siswaId) || 0;

  const kandidat = q
    ? await prisma.siswa.findMany({
        where: { sekolahId, OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { nisn: { contains: q } }] },
        take: 10,
        orderBy: { namaLengkap: "asc" },
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
          include: { buku: { select: { judul: true } } },
        }),
        prisma.bukuPerpustakaan.findMany({ where: { sekolahId }, orderBy: { judul: "asc" }, select: { id: true, judul: true } }),
      ])
    : [[], []];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Peminjaman Buku</h1>
        <Link href="/perpustakaan" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">← Katalog Buku</Link>
      </div>

      <form className="flex gap-2">
        <SiswaAutocomplete name="q" defaultValue={q} placeholder="Cari peminjam (nama / NISN)…" className="w-80 rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
      </form>

      {q && !siswa && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {kandidat.length === 0 && <li className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa cocok.</li>}
          {kandidat.map((s) => (
            <li key={s.id} className="px-4 py-2 text-sm">
              <Link href={`/perpustakaan/pinjam?siswaId=${s.id}`} className="text-gray-900 hover:underline">{s.namaLengkap}</Link>
              <span className="ml-2 text-xs text-gray-400">{s.nisn ?? ""}</span>
            </li>
          ))}
        </ul>
      )}

      {siswa && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">{siswa.namaLengkap}</h2>
            <span className="text-xs text-gray-400">{siswa.nisn ?? ""}</span>
            <Link href="/perpustakaan/pinjam" className="ml-auto text-sm text-gray-500 hover:text-gray-900">Ganti peminjam</Link>
          </div>

          <form action={pinjamBuku} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
            <input type="hidden" name="siswaId" value={siswa.id} />
            <div>
              <label className="block text-xs text-gray-500">Buku</label>
              <select name="bukuId" required className={inCls}>
                <option value="">- pilih buku -</option>
                {bukuList.map((b) => (
                  <option key={b.id} value={b.id}>{b.judul}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Durasi (hari)</label>
              <input name="durasiHari" type="number" min={1} defaultValue={7} className={`${inCls} w-24`} />
            </div>
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Pinjam</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Buku</th>
                  <th className="px-4 py-2 font-medium">Tgl Pinjam</th>
                  <th className="px-4 py-2 font-medium">Durasi</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pinjaman.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada peminjaman.</td></tr>
                )}
                {pinjaman.map((p) => {
                  const dipinjam = !p.tanggalKembali;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{p.buku.judul}</td>
                      <td className="px-4 py-2 text-gray-600">{fmt(p.tanggalPinjam)}</td>
                      <td className="px-4 py-2 text-gray-600">{p.durasiHari ? `${p.durasiHari} hari` : "-"}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${dipinjam ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                          {dipinjam ? "dipinjam" : `kembali ${fmt(p.tanggalKembali)}`}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {dipinjam && (
                          <form action={kembalikanBuku}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="siswaId" value={siswa.id} />
                            <button className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">Kembalikan</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
