import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  saveTahunAjaran, setTahunAjaranAktif, deleteTahunAjaran,
  savePeriode, setPeriodeAktif, deletePeriode,
} from "./actions";

const inCls = "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function weeksBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (7 * 86400000));
}

export default async function AkademikPage() {
  const sekolahId = await requireModule("pengaturan");

  const tahunList = await prisma.tahunAjaran.findMany({
    where: { sekolahId },
    orderBy: { tahun: "desc" },
    include: {
      periode: { orderBy: { urutan: "asc" } },
      _count: { select: { rombel: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akademik</h1>
        <p className="text-sm text-gray-500">
          Kelola tahun ajaran dan periode (semester). Tanggal mulai/selesai periode
          digunakan oleh sistem presensi, rapor, dan nilai untuk menentukan rentang waktu.
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
        <p className="font-semibold mb-1">💡 Mengapa tanggal periode penting?</p>
        <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
          <li><strong>Presensi</strong> — grid attendance menampilkan kolom dari <code>tanggalMulai</code> sampai <code>tanggalSelesai</code> periode aktif</li>
          <li><strong>Rapor</strong> — nilai diambil dari periode yang aktif</li>
          <li><strong>Efektif minggu</strong> — dihitung otomatis dari selisih tanggal (tidak perlu input manual)</li>
        </ul>
      </div>

      {/* Tambah Tahun Ajaran */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">+ Tahun Ajaran Baru</h2>
        <form action={saveTahunAjaran} className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Format Tahun *</label>
            <input name="tahun" required placeholder="2025/2026" pattern="\d{4}/\d{4}"
              className={`${inCls} w-36 font-mono`} />
          </div>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Tambah
          </button>
        </form>
      </div>

      {/* Daftar Tahun Ajaran */}
      {tahunList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          Belum ada tahun ajaran.
        </div>
      ) : (
        <div className="space-y-4">
          {tahunList.map((ta) => (
            <div key={ta.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${ta.aktif ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"}`}>
              {/* TA header */}
              <div className={`flex items-center justify-between px-5 py-3.5 ${ta.aktif ? "bg-indigo-600" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black font-mono ${ta.aktif ? "text-white" : "text-gray-900"}`}>
                    {ta.tahun}
                  </span>
                  {ta.aktif && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                      ★ Aktif
                    </span>
                  )}
                  <span className={`text-xs ${ta.aktif ? "text-indigo-200" : "text-gray-400"}`}>
                    {ta._count.rombel} rombel · {ta.periode.length} periode
                  </span>
                </div>
                <div className="flex gap-2">
                  {!ta.aktif && (
                    <form action={setTahunAjaranAktif}>
                      <input type="hidden" name="id" value={ta.id} />
                      <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        Aktifkan
                      </button>
                    </form>
                  )}
                  {ta._count.rombel === 0 && (
                    <ConfirmDelete action={deleteTahunAjaran} id={ta.id} message={`Hapus tahun ajaran ${ta.tahun}?`} />
                  )}
                </div>
              </div>

              {/* Periode list */}
              <div className="divide-y divide-gray-100">
                {ta.periode.length === 0 && (
                  <div className="px-5 py-4 text-sm text-gray-400">Belum ada periode. Tambah di bawah.</div>
                )}
                {ta.periode.map((p) => {
                  const weeks = weeksBetween(p.tanggalMulai, p.tanggalSelesai);
                  return (
                    <div key={p.id} className={`flex flex-wrap items-center gap-4 px-5 py-3 ${p.aktif ? "bg-green-50" : "hover:bg-gray-50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{p.nama}</span>
                          {p.aktif && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              ★ Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-gray-500">
                          <span>📅 {fmt(p.tanggalMulai)} — {fmt(p.tanggalSelesai)}</span>
                          {weeks !== null && (
                            <span className={`font-medium ${weeks <= 18 && weeks >= 14 ? "text-green-600" : "text-amber-600"}`}>
                              {weeks} minggu efektif
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!p.aktif && (
                          <form action={setPeriodeAktif}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="tahunAjaranId" value={ta.id} />
                            <button className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-white">
                              Aktifkan
                            </button>
                          </form>
                        )}
                        <ConfirmDelete action={deletePeriode} id={p.id} message={`Hapus periode "${p.nama}"?`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tambah Periode */}
              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 select-none">
                    <span className="group-open:hidden">+ Tambah Periode</span>
                    <span className="hidden group-open:inline">− Tutup</span>
                  </summary>
                  <form action={savePeriode} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="tahunAjaranId" value={ta.id} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nama Periode *</label>
                      <input name="nama" required placeholder="Semester Ganjil" className={`${inCls} min-w-[180px]`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Urutan</label>
                      <input name="urutan" type="number" min={1} defaultValue={ta.periode.length + 1}
                        className={`${inCls} w-16`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Mulai</label>
                      <input name="tanggalMulai" type="date" className={inCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Selesai</label>
                      <input name="tanggalSelesai" type="date" className={inCls} />
                    </div>
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                      Simpan Periode
                    </button>
                  </form>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
