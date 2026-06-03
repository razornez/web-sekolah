import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getSekolahId } from "@/lib/session";
import { saveNilai } from "./actions";

const selCls =
  "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const inCls =
  "w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";

export default async function NilaiPage({
  searchParams,
}: {
  searchParams: Promise<{
    rombelId?: string;
    periodeId?: string;
    mapelId?: string;
    kurikulum?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const sekolahId = await getSekolahId();
  const sp = await searchParams;

  const rombelId = Number(sp.rombelId) || 0;
  const periodeId = Number(sp.periodeId) || 0;
  const mapelId = Number(sp.mapelId) || 0;

  const [sekolah, rombelOpts, periodeOpts, mapelOpts] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { kurikulumDefault: true } }),
    prisma.rombel.findMany({
      where: { sekolahId },
      orderBy: { nama: "asc" },
      include: { tahunAjaran: { select: { tahun: true } } },
    }),
    prisma.periode.findMany({
      where: { tahunAjaran: { sekolahId } },
      orderBy: [{ tahunAjaranId: "desc" }, { urutan: "asc" }],
      include: { tahunAjaran: { select: { tahun: true } } },
    }),
    prisma.mapel.findMany({
      where: { sekolahId },
      orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }],
    }),
  ]);

  const kurikulum =
    sp.kurikulum === "K13" || sp.kurikulum === "MERDEKA"
      ? sp.kurikulum
      : (sekolah?.kurikulumDefault ?? "MERDEKA");

  const ready = rombelId && periodeId && mapelId;

  // Data entry hanya bila ketiga filter dipilih.
  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { namaLengkap: string };
    nilai?: {
      nilaiPengetahuan: number | null;
      nilaiKeterampilan: number | null;
      nilaiAkhir: number | null;
      deskripsiCapaian: string | null;
    };
  }[] = [];

  if (ready) {
    const [rows, nilaiRows] = await Promise.all([
      prisma.anggotaRombel.findMany({
        where: { rombelId, rombel: { sekolahId } },
        orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
        select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true } } },
      }),
      prisma.nilaiRapor.findMany({
        where: { mapelId, periodeId, siswa: { sekolahId } },
        select: {
          siswaId: true,
          nilaiPengetahuan: true,
          nilaiKeterampilan: true,
          nilaiAkhir: true,
          deskripsiCapaian: true,
        },
      }),
    ]);
    const byId = new Map(nilaiRows.map((n) => [n.siswaId, n]));
    anggota = rows.map((r) => ({ ...r, nilai: byId.get(r.siswaId) }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Nilai / Rapor</h1>
        <Link href="/nilai/rapor" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Ekstrakurikuler &amp; Catatan Rapor
        </Link>
      </div>

      {/* Filter */}
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <select name="rombelId" defaultValue={rombelId || ""} className={selCls}>
            <option value="">- pilih -</option>
            {rombelOpts.map((r) => (
              <option key={r.id} value={r.id}>{r.nama} ({r.tahunAjaran.tahun})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Periode</label>
          <select name="periodeId" defaultValue={periodeId || ""} className={selCls}>
            <option value="">- pilih -</option>
            {periodeOpts.map((p) => (
              <option key={p.id} value={p.id}>{p.tahunAjaran.tahun} · {p.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Mapel</label>
          <select name="mapelId" defaultValue={mapelId || ""} className={selCls}>
            <option value="">- pilih -</option>
            {mapelOpts.map((m) => (
              <option key={m.id} value={m.id}>{m.namaMapel}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Kurikulum</label>
          <select name="kurikulum" defaultValue={kurikulum} className={selCls}>
            <option value="MERDEKA">Merdeka</option>
            <option value="K13">K13</option>
          </select>
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Tampilkan
        </button>
      </form>

      {!ready && (
        <p className="text-sm text-gray-500">Pilih rombel, periode, dan mapel untuk input nilai.</p>
      )}

      {ready && (
        <form action={saveNilai} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <input type="hidden" name="periodeId" value={periodeId} />
          <input type="hidden" name="mapelId" value={mapelId} />
          <input type="hidden" name="kurikulum" value={kurikulum} />

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">No</th>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  {kurikulum === "K13" ? (
                    <>
                      <th className="px-4 py-2 font-medium">Pengetahuan</th>
                      <th className="px-4 py-2 font-medium">Keterampilan</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 font-medium">Nilai Akhir</th>
                      <th className="px-4 py-2 font-medium">Deskripsi Capaian</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggota.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Rombel belum punya anggota.</td></tr>
                )}
                {anggota.map((a, i) => (
                  <tr key={a.siswaId}>
                    <td className="px-4 py-2 text-gray-500">{a.nomorAbsen ?? i + 1}</td>
                    <td className="px-4 py-2 text-gray-900">{a.siswa.namaLengkap}</td>
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
                          <input type="text" name={`desk_${a.siswaId}`} defaultValue={a.nilai?.deskripsiCapaian ?? ""} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900" />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {anggota.length > 0 && (
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Simpan Nilai
            </button>
          )}
        </form>
      )}

      <p className="text-xs text-gray-400">Mode kurikulum default sekolah: {sekolah?.kurikulumDefault}. Login sebagai {user.role}.</p>
    </div>
  );
}
