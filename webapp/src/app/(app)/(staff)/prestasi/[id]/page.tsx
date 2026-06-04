import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { addPenerimaPrestasi, removePenerimaPrestasi, updatePrestasiMaster } from "../actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";
const TINGKAT = ["Sekolah","Kecamatan","Kabupaten","Provinsi","Nasional","Internasional"];
const KAT_P = ["Akademik","Non-akademik","Olahraga","Seni","Teknologi","Kepemimpinan","Lainnya"];

export default async function DetailPrestasiPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const sekolahId = await requireModule("siswa");
  const { id } = await params;
  const addQ = ((await searchParams).add ?? "").trim();

  const prestasi = await prisma.prestasiMaster.findFirst({
    where: { id: Number(id), sekolahId },
    include: {
      penerima: {
        include: {
          siswa: {
            select: { id: true, namaLengkap: true, nisn: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, include: { rombel: { select: { nama: true } } } } },
          },
        },
        orderBy: { tahun: "desc" },
      },
    },
  });
  if (!prestasi) notFound();

  const kandidat = addQ ? await prisma.siswa.findMany({
    where: { sekolahId, deletedAt: null, namaLengkap: { contains: addQ, mode: "insensitive" }, NOT: { penerimaPrestasiList: { some: { prestasiId: prestasi.id } } } },
    take: 8, orderBy: { namaLengkap: "asc" }, select: { id: true, namaLengkap: true, nisn: true },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/prestasi" className="text-sm text-gray-500 hover:text-gray-900">← Prestasi &amp; Beasiswa</Link>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">{prestasi.nama}</h1>
          <div className="mt-1 flex gap-2 text-sm text-gray-500">
            <span>🏅 {prestasi.tingkat}</span>
            <span>·</span>
            <span>📂 {prestasi.kategori}</span>
            {prestasi.penyelenggara && <><span>·</span><span>📌 {prestasi.penyelenggara}</span></>}
            {prestasi.tahun && <><span>·</span><span>📅 {prestasi.tahun}</span></>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daftar Penerima */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-gray-700">Penerima Prestasi ({prestasi.penerima.length})</h2>
          {prestasi.penerima.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-gray-400">
              <div className="text-3xl">👤</div>
              <p className="mt-2 text-sm">Belum ada penerima. Tambahkan siswa di samping.</p>
            </div>
          )}
          {prestasi.penerima.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <Link href={`/siswa/${p.siswa.id}`} className="font-semibold text-gray-900 hover:underline">{p.siswa.namaLengkap}</Link>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>{p.siswa.nisn ?? "—"}</span>
                  {p.siswa.anggotaRombel[0] && <><span>·</span><span>{p.siswa.anggotaRombel[0].rombel.nama}</span></>}
                  {p.tahun && <><span>·</span><span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 font-medium">Tahun {p.tahun}</span></>}
                  {p.keterangan && <><span>·</span><span className="italic">{p.keterangan}</span></>}
                </div>
              </div>
              <form action={removePenerimaPrestasi}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="prestasiId" value={prestasi.id} />
                <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">Hapus</button>
              </form>
            </div>
          ))}
        </div>

        {/* Tambah Penerima + Edit */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-700">➕ Tambah Penerima</h2>
            <form className="flex gap-2">
              <input name="add" defaultValue={addQ} placeholder="Cari nama siswa…" className={`${inCls} flex-1`} />
              <button className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-100">Cari</button>
            </form>
            {addQ && kandidat.length === 0 && <p className="mt-2 text-xs text-gray-400">Tidak ditemukan atau sudah terdaftar.</p>}
            <ul className="mt-2 divide-y divide-gray-100">
              {kandidat.map((s) => (
                <li key={s.id} className="py-2">
                  <div className="font-medium text-sm text-gray-900">{s.namaLengkap}</div>
                  <div className="text-xs text-gray-400 mb-1">{s.nisn ?? "—"}</div>
                  <form action={addPenerimaPrestasi} className="flex items-center gap-2">
                    <input type="hidden" name="prestasiId" value={prestasi.id} />
                    <input type="hidden" name="siswaId" value={s.id} />
                    <input name="tahun" placeholder="Tahun" defaultValue={prestasi.tahun ?? ""} className={`${inCls} w-20`} />
                    <button className="rounded-md bg-amber-600 px-2.5 py-1 text-xs text-white hover:bg-amber-700">+ Tambah</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>

          {/* Edit Data Prestasi */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-700">✏️ Edit Prestasi</h2>
            <form action={updatePrestasiMaster} className="space-y-2">
              <input type="hidden" name="id" value={prestasi.id} />
              <input name="nama" defaultValue={prestasi.nama} className={`${inCls} w-full`} required />
              <div className="grid grid-cols-2 gap-2">
                <select name="tingkat" defaultValue={prestasi.tingkat} className={`${inCls} w-full`}>
                  {TINGKAT.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select name="kategori" defaultValue={prestasi.kategori} className={`${inCls} w-full`}>
                  {KAT_P.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <input name="penyelenggara" defaultValue={prestasi.penyelenggara ?? ""} placeholder="Penyelenggara" className={`${inCls} w-full`} />
              <input name="tahun" defaultValue={prestasi.tahun ?? ""} placeholder="Tahun" className={`${inCls} w-full`} />
              <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Simpan</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
