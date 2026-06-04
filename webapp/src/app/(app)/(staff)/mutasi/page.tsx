import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";
import { PageGuide } from "@/components/PageGuide";
import { saveMutasi, deleteMutasi } from "../prestasi/actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const PER = 30;

export default async function MutasiPage({ searchParams }: { searchParams: Promise<{ q?: string; jenis?: string; asal?: string; tujuan?: string; page?: string }> }) {
  const sekolahId = await requireModule("siswa");
  const user = await getCurrentUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const jenis = sp.jenis ?? "";
  const asal = (sp.asal ?? "").trim();
  const tujuan = (sp.tujuan ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.MutasiSiswaWhereInput = {
    sekolahId,
    ...(jenis ? { jenis } : {}),
    ...(q ? { siswa: { namaLengkap: { contains: q, mode: "insensitive" } } } : {}),
    ...(asal ? { asalSekolah: { contains: asal, mode: "insensitive" } } : {}),
    ...(tujuan ? { tujuanSekolah: { contains: tujuan, mode: "insensitive" } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.mutasiSiswa.count({ where }),
    prisma.mutasiSiswa.findMany({
      where, orderBy: { tanggal: "desc" }, skip: (page - 1) * PER, take: PER,
      include: {
        siswa: { select: { id: true, namaLengkap: true, nisn: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, include: { rombel: { select: { nama: true } } } } } },
        createdBy: { select: { namaLengkap: true, role: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const hp = (p: number) => `/mutasi?${new URLSearchParams({ q, jenis, asal, tujuan, page: String(p) }).toString()}`;

  return (
    <div className="space-y-5">
      <PageGuide
        icon="🔄"
        title="Mutasi Siswa"
        description="Halaman ini mencatat perpindahan siswa — masuk dari sekolah lain atau keluar ke sekolah lain. Setiap mutasi otomatis menyimpan nama staf yang menginput."
        tips={[
          "Mutasi Masuk: siswa baru yang pindah dari sekolah lain ke sekolah ini.",
          "Mutasi Keluar: siswa yang pindah dari sekolah ini ke sekolah lain.",
          "Gunakan filter Asal/Tujuan untuk mencari mutasi dari sekolah tertentu.",
          "Klik nama siswa untuk melihat detail profil dan kelas siswa tersebut.",
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mutasi Siswa</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} catatan mutasi</p>
        </div>
      </div>

      {/* Form Catat Mutasi */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">📝 Catat Mutasi Baru</h2>
        <form action={saveMutasi} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600">Siswa *</label>
            <SiswaAutocomplete
              mode="select"
              name="siswaName"
              idName="siswaId"
              placeholder="Ketik nama siswa yang mutasi…"
              className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Jenis *</label>
            <select name="jenis" defaultValue="keluar" className={`${inCls} w-full`}>
              <option value="masuk">Masuk (dari sekolah lain)</option>
              <option value="keluar">Keluar (ke sekolah lain)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Sekolah Asal</label>
            <input name="asalSekolah" placeholder="SMP Negeri 1..." className={`${inCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Sekolah Tujuan</label>
            <input name="tujuanSekolah" placeholder="SMA Negeri 2..." className={`${inCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Tanggal *</label>
            <input type="date" name="tanggal" defaultValue={new Date().toISOString().slice(0, 10)} className={`${inCls} w-full`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600">Alasan</label>
            <input name="alasan" placeholder="Pindah domisili, ikut orang tua..." className={`${inCls} w-full`} />
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Simpan Mutasi</button>
          </div>
        </form>
      </div>

      {/* Filter & Search */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Jenis:</span>
          {[["", "Semua"], ["masuk", "Masuk"], ["keluar", "Keluar"]].map(([val, lbl]) => (
            <Link key={val} href={`/mutasi?${new URLSearchParams({ q, jenis: val, asal, tujuan, page: "1" }).toString()}`} className={`rounded-full border px-2.5 py-0.5 text-xs ${jenis === val ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}>{lbl}</Link>
          ))}
        </div>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input type="hidden" name="jenis" value={jenis} />
          <input type="hidden" name="page" value="1" />
          {/* Autocomplete nama siswa */}
          <div className="sm:col-span-2">
            <SiswaAutocomplete name="q" defaultValue={q} placeholder="🔍 Ketik nama siswa (autocomplete)…" />
          </div>
          <input name="asal" defaultValue={asal} placeholder="Asal sekolah" className={inCls} />
          <input name="tujuan" defaultValue={tujuan} placeholder="Tujuan sekolah" className={inCls} />
          <div className="flex gap-2 sm:col-span-4">
            <button className="rounded-md border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100">Terapkan Filter</button>
            {(q || jenis || asal || tujuan) && <Link href="/mutasi" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>}
          </div>
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Siswa</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Asal / Tujuan Sekolah</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Alasan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Diinput oleh</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Tidak ada catatan mutasi.</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {m.siswa ? (
                    <div>
                      <Link href={`/siswa/${m.siswa.id}`} className="font-medium text-gray-900 hover:text-indigo-700 hover:underline">{m.siswa.namaLengkap}</Link>
                      <div className="text-xs text-gray-400">{m.siswa.nisn ?? "—"}{m.siswa.anggotaRombel[0] ? ` · ${m.siswa.anggotaRombel[0].rombel.nama}` : ""}</div>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${m.jenis === "masuk" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {m.jenis === "masuk" ? "↙ Masuk" : "↗ Keluar"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {m.jenis === "masuk" ? (
                    <span>Dari: {m.asalSekolah ?? "—"}</span>
                  ) : (
                    <span>Ke: {m.tujuanSekolah ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{m.alasan ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmt(m.tanggal)}</td>
                <td className="px-4 py-3">
                  {m.createdBy ? (
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">{m.createdBy.namaLengkap}</span>
                      <span className="ml-1 text-gray-400">({m.createdBy.role})</span>
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDelete action={deleteMutasi} id={m.id} message={`Hapus catatan mutasi ini?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={hp(page - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page < totalPages && <Link href={hp(page + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
