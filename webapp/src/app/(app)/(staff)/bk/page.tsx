import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { addKasus, deleteKasus } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmtTgl = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function BkPage({
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

  const [kasus, kategori] = siswa
    ? await Promise.all([
        prisma.kasusSiswa.findMany({
          where: { siswaId: siswa.id, sekolahId },
          orderBy: { tanggal: "desc" },
          include: { kategori: { select: { nama: true } } },
        }),
        prisma.kategoriKasus.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
      ])
    : [[], []];

  const totalPoin = kasus.reduce((s, k) => s + k.poin, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">BK — Pencatatan Pelanggaran</h1>
        <Link href="/bk/kategori" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Kelola Kategori
        </Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari siswa (nama / NISN)…" className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
      </form>

      {q && !siswa && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {kandidat.length === 0 && <li className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa cocok.</li>}
          {kandidat.map((s) => (
            <li key={s.id} className="px-4 py-2 text-sm">
              <Link href={`/bk?siswaId=${s.id}`} className="text-gray-900 hover:underline">{s.namaLengkap}</Link>
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
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Total poin: {totalPoin}</span>
            <Link href="/bk" className="ml-auto text-sm text-gray-500 hover:text-gray-900">Ganti siswa</Link>
          </div>

          <form action={addKasus} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
            <input type="hidden" name="siswaId" value={siswa.id} />
            <div>
              <label className="block text-xs text-gray-500">Kategori</label>
              <select name="kategoriId" className={inCls}>
                <option value="">- manual -</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.poin} poin)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Nama (opsional jika pilih kategori)</label>
              <input name="namaKasus" className={`${inCls} w-48`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Poin</label>
              <input name="poin" type="number" min={0} defaultValue={0} className={`${inCls} w-20`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tanggal</label>
              <input name="tanggal" type="date" defaultValue={today} className={inCls} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500">Keterangan</label>
              <input name="keterangan" className={`${inCls} w-full`} />
            </div>
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Catat</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">Pelanggaran</th>
                  <th className="px-4 py-2 font-medium">Poin</th>
                  <th className="px-4 py-2 font-medium">Keterangan</th>
                  <th className="px-4 py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kasus.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada catatan pelanggaran.</td></tr>
                )}
                {kasus.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{fmtTgl(k.tanggal)}</td>
                    <td className="px-4 py-2 text-gray-900">{k.namaKasus}</td>
                    <td className="px-4 py-2 text-gray-700">{k.poin}</td>
                    <td className="px-4 py-2 text-gray-500">{k.keterangan ?? "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={deleteKasus}>
                        <input type="hidden" name="id" value={k.id} />
                        <input type="hidden" name="siswaId" value={siswa.id} />
                        <button className="text-red-600 hover:underline">Hapus</button>
                      </form>
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
