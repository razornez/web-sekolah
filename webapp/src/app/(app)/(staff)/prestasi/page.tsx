import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createPrestasiMaster, deletePrestasiMaster, createBeasiswaMaster, deleteBeasiswaMaster } from "./actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";
const rupiah = (n: number | null) => n ? "Rp " + n.toLocaleString("id-ID") : "-";

const TINGKAT = ["Sekolah", "Kecamatan", "Kabupaten", "Provinsi", "Nasional", "Internasional"];
const KAT_P = ["Akademik", "Non-akademik", "Olahraga", "Seni", "Teknologi", "Kepemimpinan", "Lainnya"];
const KAT_B = ["Pemerintah", "Swasta", "Yayasan", "Internal Sekolah", "Lainnya"];

const TINGKAT_BADGE: Record<string, string> = {
  Sekolah: "bg-gray-100 text-gray-700",
  Kecamatan: "bg-green-100 text-green-700",
  Kabupaten: "bg-blue-100 text-blue-700",
  Provinsi: "bg-purple-100 text-purple-700",
  Nasional: "bg-amber-100 text-amber-700",
  Internasional: "bg-red-100 text-red-700",
};

export default async function PrestasiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tingkat?: string; kategori?: string }>;
}) {
  const sekolahId = await requireModule("siswa");
  const sp = await searchParams;
  const tab = sp.tab === "beasiswa" ? "beasiswa" : "prestasi";
  const filterTingkat = sp.tingkat ?? "";
  const filterKategori = sp.kategori ?? "";

  const [prestasi, beasiswa] = await Promise.all([
    prisma.prestasiMaster.findMany({
      where: {
        sekolahId,
        ...(filterTingkat ? { tingkat: filterTingkat } : {}),
        ...(filterKategori && tab === "prestasi" ? { kategori: filterKategori } : {}),
      },
      orderBy: [{ tahun: "desc" }, { nama: "asc" }],
      include: { _count: { select: { penerima: true } } },
    }),
    prisma.beasiswaMaster.findMany({
      where: {
        sekolahId,
        ...(filterKategori && tab === "beasiswa" ? { kategori: filterKategori } : {}),
      },
      orderBy: { nama: "asc" },
      include: { _count: { select: { penerima: true } } },
    }),
  ]);

  const buildUrl = (ov: Record<string, string>) => {
    const p = new URLSearchParams({ tab, tingkat: filterTingkat, kategori: filterKategori, ...ov });
    return `/prestasi?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestasi &amp; Beasiswa</h1>
          <p className="text-sm text-gray-500">Kelola data pencapaian dan bantuan pendidikan siswa</p>
        </div>
        {tab === "prestasi" ? (
          <Link href="#form-tambah" className="scroll-smooth rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800">
            + Tambah Prestasi
          </Link>
        ) : (
          <Link href="#form-tambah-b" className="scroll-smooth rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-800">
            + Tambah Beasiswa
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Link href={buildUrl({ tab: "prestasi", kategori: "" })} className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === "prestasi" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          🏆 Prestasi <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "prestasi" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{prestasi.length}</span>
        </Link>
        <div className="w-px bg-gray-200" />
        <Link href={buildUrl({ tab: "beasiswa", tingkat: "", kategori: "" })} className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === "beasiswa" ? "bg-indigo-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          🎓 Beasiswa <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "beasiswa" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{beasiswa.length}</span>
        </Link>
      </div>

      {tab === "prestasi" && (
        <>
          {/* Filter Prestasi */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Tingkat:</span>
            {["", ...TINGKAT].map((t) => (
              <Link key={t} href={buildUrl({ tingkat: t })} className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${filterTingkat === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                {t === "" ? "Semua" : t}
              </Link>
            ))}
            <span className="ml-3 text-xs font-medium text-gray-500">Kategori:</span>
            {["", ...KAT_P].map((k) => (
              <Link key={k} href={buildUrl({ kategori: k })} className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${filterKategori === k ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                {k === "" ? "Semua" : k}
              </Link>
            ))}
          </div>

          {/* List Prestasi */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prestasi.length === 0 && (
              <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
                <div className="text-4xl">🏆</div>
                <p className="mt-2 text-sm">Belum ada data prestasi. Tambahkan di bawah.</p>
              </div>
            )}
            {prestasi.map((p) => (
              <div key={p.id} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TINGKAT_BADGE[p.tingkat] ?? TINGKAT_BADGE.Sekolah}`}>{p.tingkat}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{p.kategori}</span>
                  </div>
                  <ConfirmDelete action={deletePrestasiMaster} id={p.id} message={`Hapus "${p.nama}"?`} />
                </div>
                <Link href={`/prestasi/${p.id}`} className="block text-base font-semibold text-gray-900 hover:text-gray-700 hover:underline">
                  {p.nama}
                </Link>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  {p.penyelenggara && <span>📌 {p.penyelenggara}</span>}
                  {p.tahun && <span>📅 {p.tahun}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    👤 {p._count.penerima} penerima
                  </span>
                  <Link href={`/prestasi/${p.id}`} className="text-xs text-gray-500 hover:text-gray-900">Kelola →</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Form Tambah Prestasi */}
          <div id="form-tambah" className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">➕ Tambah Prestasi Baru</h2>
            <form action={createPrestasiMaster} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Nama Prestasi *</label>
                  <input name="nama" required placeholder="Juara 1 OSN Matematika..." className={`${inCls} w-full`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Tahun</label>
                  <input name="tahun" defaultValue={new Date().getFullYear()} className={`${inCls} w-full`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Tingkat *</label>
                  <select name="tingkat" defaultValue="Sekolah" className={`${inCls} w-full`}>
                    {TINGKAT.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kategori *</label>
                  <select name="kategori" defaultValue="Akademik" className={`${inCls} w-full`}>
                    {KAT_P.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Penyelenggara</label>
                  <input name="penyelenggara" placeholder="Kemendikbud, OSIS..." className={`${inCls} w-full`} />
                </div>
              </div>
              <button className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800">Simpan Prestasi</button>
            </form>
          </div>
        </>
      )}

      {tab === "beasiswa" && (
        <>
          {/* Filter Beasiswa */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Kategori:</span>
            {["", ...KAT_B].map((k) => (
              <Link key={k} href={buildUrl({ kategori: k })} className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${filterKategori === k ? "border-indigo-700 bg-indigo-700 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                {k === "" ? "Semua" : k}
              </Link>
            ))}
          </div>

          {/* List Beasiswa */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beasiswa.length === 0 && (
              <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
                <div className="text-4xl">🎓</div>
                <p className="mt-2 text-sm">Belum ada data beasiswa. Tambahkan di bawah.</p>
              </div>
            )}
            {beasiswa.map((b) => (
              <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{b.kategori}</span>
                  <ConfirmDelete action={deleteBeasiswaMaster} id={b.id} message={`Hapus "${b.nama}"?`} />
                </div>
                <Link href={`/prestasi/beasiswa/${b.id}`} className="block text-base font-semibold text-gray-900 hover:underline">{b.nama}</Link>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  {b.penyelenggara && <span>📌 {b.penyelenggara}</span>}
                  {b.nominal && <span>💰 {rupiah(b.nominal)}/bln</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    👤 {b._count.penerima} penerima
                  </span>
                  <Link href={`/prestasi/beasiswa/${b.id}`} className="text-xs text-gray-500 hover:text-gray-900">Kelola →</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Form Tambah Beasiswa */}
          <div id="form-tambah-b" className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">➕ Tambah Beasiswa Baru</h2>
            <form action={createBeasiswaMaster} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Nama Beasiswa *</label>
                  <input name="nama" required placeholder="Beasiswa KIP, Bidikmisi..." className={`${inCls} w-full`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kategori *</label>
                  <select name="kategori" defaultValue="Pemerintah" className={`${inCls} w-full`}>
                    {KAT_B.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Penyelenggara</label>
                  <input name="penyelenggara" placeholder="Kemendikbud..." className={`${inCls} w-full`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Nominal Standar (Rp)</label>
                  <input name="nominal" type="number" min={0} placeholder="500000" className={`${inCls} w-full`} />
                </div>
              </div>
              <button className="rounded-lg bg-indigo-700 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-800">Simpan Beasiswa</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
