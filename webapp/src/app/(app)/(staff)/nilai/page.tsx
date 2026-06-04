import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { saveNilai } from "./actions";
import { PageGuide } from "@/components/PageGuide";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { MapelSelect } from "@/components/filters/MapelSelect";
import { PeriodeSelect } from "@/components/filters/PeriodeSelect";

const selCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const inCls = "w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function NilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; periodeId?: string; mapelId?: string; kurikulum?: string }>;
}) {
  const sekolahId = await requireModule("nilai");
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;
  const mapelId = Number(sp.mapelId) || 0;

  const sekolah = await prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { kurikulumDefault: true } });
  const kurikulum =
    sp.kurikulum === "K13" || sp.kurikulum === "MERDEKA"
      ? sp.kurikulum
      : (sekolah?.kurikulumDefault ?? "MERDEKA");

  const ready = rombelId > 0 && periodeId > 0 && mapelId > 0;

  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { id: number; namaLengkap: string };
    nilai?: { nilaiPengetahuan: number | null; nilaiKeterampilan: number | null; nilaiAkhir: number | null; deskripsiCapaian: string | null };
  }[] = [];

  if (ready) {
    const [rows, nilaiRows] = await Promise.all([
      prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { id: true, namaLengkap: true } } },
      }),
      prisma.nilaiRapor.findMany({
        where: { mapelId, periodeId, siswa: { sekolahId } },
        select: { siswaId: true, nilaiPengetahuan: true, nilaiKeterampilan: true, nilaiAkhir: true, deskripsiCapaian: true },
      }),
    ]);
    const byId = new Map(nilaiRows.map((n) => [n.siswaId, n]));
    anggota = rows.map((r) => ({ ...r, nilai: byId.get(r.siswaId) }));
  }

  return (
    <div className="space-y-5">
      <PageGuide
        icon="📊"
        title="Input Nilai Rapor"
        description="Masukkan nilai akhir rapor per mapel per periode. Nilai ini merupakan akumulasi dari semua komponen penilaian (harian, tugas, UTS, UAS). Pilih Rombel → Periode → Mapel untuk mulai input."
        tips={[
          "Kurikulum Merdeka: isi Nilai Akhir + Deskripsi Capaian Kompetensi.",
          "K13: isi Nilai Pengetahuan dan Nilai Keterampilan terpisah.",
          "Klik nama siswa untuk melihat profil lengkap.",
          "Untuk input nilai harian/tugas/UTS/UAS, gunakan halaman Entri Nilai.",
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nilai / Rapor</h1>
        <div className="flex gap-2">
          <Link href="/nilai/entri" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            📝 Entri Nilai Harian
          </Link>
          <Link href="/nilai/rapor" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            📋 Ekstra &amp; Catatan Rapor
          </Link>
        </div>
      </div>

      {/* Filter — pakai reusable server components */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Kelas / Rombel</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className={selCls} emptyLabel="— pilih rombel —" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Periode</label>
          <PeriodeSelect sekolahId={sekolahId} name="periodeId" defaultValue={periodeId || ""} className={selCls} emptyLabel="— pilih periode —" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Mata Pelajaran</label>
          <MapelSelect sekolahId={sekolahId} name="mapelId" defaultValue={mapelId || ""} className={selCls} emptyLabel="— pilih mapel —" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Kurikulum</label>
          <select name="kurikulum" defaultValue={kurikulum} className={selCls}>
            <option value="MERDEKA">Kurikulum Merdeka</option>
            <option value="K13">K13</option>
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          Tampilkan
        </button>
      </form>

      {!ready && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 py-12 text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-2 text-sm text-gray-500">Pilih rombel, periode, dan mapel untuk mulai input nilai.</p>
        </div>
      )}

      {ready && (
        <form action={saveNilai} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <input type="hidden" name="periodeId" value={periodeId} />
          <input type="hidden" name="mapelId" value={mapelId} />
          <input type="hidden" name="kurikulum" value={kurikulum} />

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nama Siswa</th>
                  {kurikulum === "K13" ? (
                    <>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Pengetahuan</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Keterampilan</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nilai Akhir</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Deskripsi Capaian Kompetensi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggota.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Rombel belum punya anggota.</td></tr>
                )}
                {anggota.map((a, i) => {
                  const nilaiVal = a.nilai?.nilaiAkhir ?? a.nilai?.nilaiPengetahuan;
                  return (
                    <tr key={a.siswaId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400">{a.nomorAbsen ?? i + 1}</td>
                      <td className="px-4 py-2">
                        {/* Link ke halaman detail siswa */}
                        <Link href={`/siswa/${a.siswa.id}`} className="font-medium text-gray-900 hover:text-indigo-600 hover:underline">
                          {a.siswa.namaLengkap}
                        </Link>
                        {nilaiVal != null && (
                          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${nilaiVal >= 90 ? "bg-green-100 text-green-700" : nilaiVal >= 80 ? "bg-blue-100 text-blue-700" : nilaiVal >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {nilaiVal}
                          </span>
                        )}
                      </td>
                      {kurikulum === "K13" ? (
                        <>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`peng_${a.siswaId}`} defaultValue={a.nilai?.nilaiPengetahuan ?? ""} className={inCls} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`ket_${a.siswaId}`} defaultValue={a.nilai?.nilaiKeterampilan ?? ""} className={inCls} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2">
                            <input type="number" min={0} max={100} name={`akhir_${a.siswaId}`} defaultValue={a.nilai?.nilaiAkhir ?? ""} className={inCls} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" name={`desk_${a.siswaId}`} defaultValue={a.nilai?.deskripsiCapaian ?? ""} placeholder="Siswa memahami…" className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {anggota.length > 0 && (
            <div className="flex items-center gap-3">
              <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                💾 Simpan Nilai
              </button>
              <p className="text-xs text-gray-400">{anggota.length} siswa · nilai disimpan otomatis ter-update</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
