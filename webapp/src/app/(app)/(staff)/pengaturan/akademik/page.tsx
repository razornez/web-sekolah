import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ConfirmForm } from "@/components/ConfirmForm";
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

/** Hitung hari sekolah (Senin–Jumat) dalam rentang [from, to] */
function countSchoolDays(from: Date | null, to: Date | null): number {
  if (!from || !to) return 0;
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Pertemuan per jadwal berdasarkan frekuensi */
function meetingCount(schoolDays: number, freqPerWeek: number): number {
  return Math.round((schoolDays / 5) * freqPerWeek);
}

export default async function AkademikPage() {
  const sekolahId = await requireModule("pengaturan");

  const tahunList = await prisma.tahunAjaran.findMany({
    where: { sekolahId },
    orderBy: { tahun: "desc" },
    include: {
      periode: {
        orderBy: { urutan: "asc" },
        include: {
          _count: { select: { nilaiRapor: true, raporCatatan: true } },
        },
      },
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
                  {ta.aktif
                    ? <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">★ Aktif</span>
                    : <span className="text-xs text-gray-400">{ta._count.rombel} rombel · {ta.periode.length} periode</span>
                  }
                </div>
                <div className="flex gap-2">
                  {!ta.aktif && (
                    <ConfirmForm
                      action={setTahunAjaranAktif}
                      message={`Aktifkan Tahun Ajaran ${ta.tahun}?\n\nIni akan mengubah TA aktif. Filter rombel, nilai, dan jadwal akan menggunakan TA ini sebagai default.\n\nData di TA lain tidak akan dihapus.`}
                    >
                      <input type="hidden" name="id" value={ta.id} />
                      <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        Aktifkan TA
                      </button>
                    </ConfirmForm>
                  )}
                  {ta._count.rombel === 0 && ta.periode.every(p => p._count.nilaiRapor === 0 && p._count.raporCatatan === 0) ? (
                    <ConfirmDelete action={deleteTahunAjaran} id={ta.id} message={`Hapus tahun ajaran ${ta.tahun}? Semua periode di dalamnya ikut terhapus.`} />
                  ) : !ta.aktif && (
                    <span className="rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs text-gray-400" title="Ada rombel atau data nilai yang terkait">
                      🔒 Tidak bisa dihapus
                    </span>
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
                  const schoolDays = countSchoolDays(p.tanggalMulai, p.tanggalSelesai);
                  const meet1x = meetingCount(schoolDays, 1);
                  const meet2x = meetingCount(schoolDays, 2);
                  const hasDates = p.tanggalMulai && p.tanggalSelesai;
                  const dataCount = p._count.nilaiRapor + p._count.raporCatatan;
                  const bisa_hapus = dataCount === 0;

                  return (
                    <div key={p.id} className={`px-5 py-4 ${p.aktif ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}>
                      {/* Row 1: Nama + status + aksi */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-gray-900">{p.nama}</span>
                          {p.aktif
                            ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">★ Aktif</span>
                            : null
                          }
                          <span className="text-xs text-gray-400">Urutan {p.urutan}</span>
                        </div>

                        {/* Aksi — dipisah jelas dari info */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!p.aktif && (
                            <ConfirmForm
                              action={setPeriodeAktif}
                              message={`Aktifkan periode "${p.nama}" (${ta.tahun})?\n\nDampak:\n• Form entri nilai akan default ke periode ini\n• Presensi akan menggunakan rentang tanggal periode ini\n• Periode aktif sebelumnya akan dinonaktifkan\n\nData yang sudah diinput tidak akan hilang.`}
                            >
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="tahunAjaranId" value={ta.id} />
                              <button className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                                Aktifkan
                              </button>
                            </ConfirmForm>
                          )}
                          {bisa_hapus ? (
                            <ConfirmDelete action={deletePeriode} id={p.id} message={`Hapus periode "${p.nama}"? Periode kosong, tidak ada data terkait.`} />
                          ) : (
                            <span className="rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs text-gray-400"
                              title={`${dataCount} data nilai/catatan terkait — tidak bisa dihapus`}>
                              🔒 {dataCount} data
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Tanggal + stats */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xs text-gray-500">
                          📅 {fmt(p.tanggalMulai)} — {fmt(p.tanggalSelesai)}
                          {weeks !== null && (
                            <span className={`ml-2 font-semibold ${weeks <= 18 && weeks >= 14 ? "text-green-600" : "text-amber-600"}`}>
                              ({weeks} minggu)
                            </span>
                          )}
                        </div>

                        {hasDates ? (
                          <div className="flex gap-2 ml-auto">
                            <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-center min-w-[60px]">
                              <div className="text-base font-black text-gray-900 leading-none">{schoolDays}</div>
                              <div className="text-[10px] text-gray-400">hari sekolah</div>
                            </div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-center min-w-[60px]">
                              <div className="text-base font-black text-blue-700 leading-none">{meet1x}×</div>
                              <div className="text-[10px] text-blue-500">1x/minggu</div>
                            </div>
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-center min-w-[60px]">
                              <div className="text-base font-black text-indigo-700 leading-none">{meet2x}×</div>
                              <div className="text-[10px] text-indigo-500">2x/minggu</div>
                            </div>
                          </div>
                        ) : (
                          <span className="ml-auto text-xs text-amber-600">⚠ Isi tanggal untuk hitung pertemuan</span>
                        )}
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
                      <input name="urutan" type="number" min={1} defaultValue={ta.periode.length + 1} className={`${inCls} w-16`} />
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
