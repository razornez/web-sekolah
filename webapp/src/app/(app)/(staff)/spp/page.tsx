import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { addTagihan, bayarTagihan, deleteTagihan } from "./actions";

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function SppPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; siswaId?: string }>;
}) {
  const sekolahId = await getSekolahId();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const siswaId = Number(sp.siswaId) || 0;

  const kandidat = q
    ? await prisma.siswa.findMany({
        where: {
          sekolahId,
          OR: [
            { namaLengkap: { contains: q, mode: "insensitive" } },
            { nisn: { contains: q } },
          ],
        },
        take: 10,
        orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : [];

  const siswa = siswaId
    ? await prisma.siswa.findFirst({
        where: { id: siswaId, sekolahId },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : null;

  const [tagihan, jenisList] = siswa
    ? await Promise.all([
        prisma.tagihanSpp.findMany({
          where: { siswaId: siswa.id, sekolahId },
          orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
          include: { jenis: { select: { nama: true } } },
        }),
        prisma.jenisPembayaran.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
      ])
    : [[], []];

  const tahunIni = new Date().getFullYear();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">SPP / Keuangan</h1>
        <Link href="/spp/jenis" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Kelola Jenis Pembayaran
        </Link>
      </div>

      {/* cari siswa */}
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari siswa (nama / NISN)…" className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
      </form>

      {q && !siswa && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {kandidat.length === 0 && <li className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa cocok.</li>}
          {kandidat.map((s) => (
            <li key={s.id} className="px-4 py-2 text-sm">
              <Link href={`/spp?siswaId=${s.id}`} className="text-gray-900 hover:underline">
                {s.namaLengkap}
              </Link>
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
            <Link href="/spp" className="ml-auto text-sm text-gray-500 hover:text-gray-900">Ganti siswa</Link>
          </div>

          {/* tambah tagihan */}
          <form action={addTagihan} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
            <input type="hidden" name="siswaId" value={siswa.id} />
            <div>
              <label className="block text-xs text-gray-500">Jenis</label>
              <select name="jenisId" required className={inCls}>
                <option value="">- pilih -</option>
                {jenisList.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama} ({rupiah(j.nominal)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Bulan</label>
              <select name="bulan" defaultValue={new Date().getMonth() + 1} className={inCls}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                  <option key={b} value={b}>{BULAN[b]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tahun</label>
              <input name="tahun" type="number" defaultValue={tahunIni} className={`${inCls} w-24`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Nominal (opsional)</label>
              <input name="nominal" type="number" min={0} defaultValue={0} className={`${inCls} w-32`} />
            </div>
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tagihan</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Jenis</th>
                  <th className="px-4 py-2 font-medium">Periode</th>
                  <th className="px-4 py-2 font-medium">Nominal</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tagihan.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada tagihan.</td></tr>
                )}
                {tagihan.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{t.jenis.nama}</td>
                    <td className="px-4 py-2 text-gray-600">{BULAN[t.bulan]} {t.tahun}</td>
                    <td className="px-4 py-2 text-gray-600">{rupiah(t.nominal)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${t.status === "lunas" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-3">
                        {t.status !== "lunas" && (
                          <form action={bayarTagihan}>
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="siswaId" value={siswa.id} />
                            <button className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">Bayar</button>
                          </form>
                        )}
                        <form action={deleteTagihan}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="siswaId" value={siswa.id} />
                          <button className="text-red-600 hover:underline">Hapus</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
