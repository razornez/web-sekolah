import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { MapelSelect } from "@/components/filters/MapelSelect";
import { PeriodeSelect } from "@/components/filters/PeriodeSelect";
import { saveEntriNilai } from "./actions";

const TIPE_LABEL: Record<string, { label: string; color: string }> = {
  harian:         { label: "Ulangan Harian", color: "bg-blue-100 text-blue-700" },
  tugas:          { label: "Tugas / PR", color: "bg-green-100 text-green-700" },
  ulangan:        { label: "Ulangan Blok", color: "bg-cyan-100 text-cyan-700" },
  uts:            { label: "UTS", color: "bg-amber-100 text-amber-700" },
  uas:            { label: "UAS", color: "bg-orange-100 text-orange-700" },
  sumatif_harian: { label: "Sumatif Harian (KurMer)", color: "bg-purple-100 text-purple-700" },
  sumatif_akhir:  { label: "Sumatif Akhir Semester", color: "bg-pink-100 text-pink-700" },
  formatif:       { label: "Formatif (tidak dihitung)", color: "bg-gray-100 text-gray-600" },
  praktik:        { label: "Praktik", color: "bg-teal-100 text-teal-700" },
};

export default async function EntriNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; periodeId?: string; mapelId?: string; tipe?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;
  const mapelId = Number(sp.mapelId) || 0;
  const tipe = sp.tipe ?? "harian";

  const ready = rombelId && periodeId && mapelId;

  // Load existing entri for this combination
  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { id: number; namaLengkap: string };
  }[] = [];
  let existingEntri: Record<number, { id: bigint; nilai: number; keterangan: string | null }[]> = {};

  if (ready) {
    const [rows, entriRows] = await Promise.all([
      prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { id: true, namaLengkap: true } } },
      }),
      prisma.entriNilai.findMany({
        where: { mapelId, periodeId, rombelId, sekolahId, tipe: tipe as never },
        orderBy: { tanggal: "desc" },
        select: { id: true, siswaId: true, nilai: true, keterangan: true },
      }),
    ]);
    anggota = rows;
    for (const e of entriRows) {
      const n = Number(e.nilai);
      (existingEntri[e.siswaId] ??= []).push({ ...e, nilai: n });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/nilai" className="text-sm text-gray-500 hover:text-gray-900">← Nilai Rapor</Link>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">Entri Nilai Harian</h1>
          <p className="text-sm text-gray-500">Input nilai mentah: ulangan harian, tugas, UTS, UAS — dasar perhitungan rapor.</p>
        </div>
      </div>

      {/* Filter */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div><label className="mb-1 block text-xs font-medium text-gray-500">Kelas / Rombel</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId} emptyLabel="— pilih rombel —" className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium text-gray-500">Periode</label>
          <PeriodeSelect sekolahId={sekolahId} name="periodeId" defaultValue={periodeId||""} emptyLabel="— pilih periode —" className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium text-gray-500">Mata Pelajaran</label>
          <MapelSelect sekolahId={sekolahId} name="mapelId" defaultValue={mapelId||""} emptyLabel="— pilih mapel —" className="rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Tipe Nilai</label>
          <select name="tipe" defaultValue={tipe} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
            {Object.entries(TIPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">Tampilkan</button>
      </form>

      {!ready && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
          <div className="text-4xl">📝</div>
          <p className="mt-2 text-sm">Pilih rombel, periode, mapel, dan tipe nilai.</p>
        </div>
      )}

      {ready && (
        <>
          {/* Existing entries */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-700">
                  {TIPE_LABEL[tipe]?.label ?? tipe}
                </span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${TIPE_LABEL[tipe]?.color ?? "bg-gray-100"}`}>
                  {tipe.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-gray-400">{anggota.length} siswa</p>
            </div>
            <form action={saveEntriNilai} className="p-0">
              <input type="hidden" name="rombelId" value={rombelId} />
              <input type="hidden" name="periodeId" value={periodeId} />
              <input type="hidden" name="mapelId" value={mapelId} />
              <input type="hidden" name="tipe" value={tipe} />
              <input type="hidden" name="tanggal" value={new Date().toISOString().slice(0, 10)} />
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">No</th>
                    <th className="px-4 py-2 text-left font-semibold">Nama Siswa</th>
                    <th className="px-4 py-2 font-semibold">Nilai Baru</th>
                    <th className="px-4 py-2 text-left font-semibold">Keterangan</th>
                    <th className="px-4 py-2 text-left font-semibold">Riwayat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anggota.map((a, i) => {
                    const riwayat = existingEntri[a.siswaId] ?? [];
                    const avg = riwayat.length ? Math.round(riwayat.reduce((s, e) => s + e.nilai, 0) / riwayat.length) : null;
                    return (
                      <tr key={a.siswaId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{a.nomorAbsen ?? i + 1}</td>
                        <td className="px-4 py-2">
                          <Link href={`/siswa/${a.siswa.id}`} className="font-medium text-gray-900 hover:text-indigo-600 hover:underline">
                            {a.siswa.namaLengkap}
                          </Link>
                          {avg != null && (
                            <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${avg >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              rata {avg}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input type="number" min={0} max={100} name={`nilai_${a.siswaId}`} placeholder="—" className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <input name={`ket_${a.siswaId}`} placeholder="nama ulangan…" className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {riwayat.slice(0, 4).map((e) => (
                              <span key={String(e.id)} className={`rounded px-1.5 py-0.5 text-xs ${e.nilai >= 75 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                {e.nilai}
                              </span>
                            ))}
                            {riwayat.length > 4 && <span className="text-xs text-gray-400">+{riwayat.length - 4}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {anggota.length > 0 && (
                <div className="border-t border-gray-100 p-4 flex items-center gap-3">
                  <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">💾 Simpan Entri Nilai</button>
                  <p className="text-xs text-gray-400">Nilai kosong tidak disimpan.</p>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
