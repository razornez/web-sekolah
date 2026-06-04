import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { savePresensi } from "./actions";
import { RombelSelect } from "@/components/filters/RombelSelect";

const STATUS = ["hadir", "izin", "sakit", "alpa", "terlambat"] as const;
const selCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export default async function PresensiPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string; tanggal?: string }>;
}) {
  const sekolahId = await requireStaff();
  const sp = await searchParams;
  const rombelId = Number(sp.rombelId) || 0;
  const tanggal = sp.tanggal || new Date().toISOString().slice(0, 10);

  let anggota: {
    siswaId: number;
    nomorAbsen: number | null;
    siswa: { namaLengkap: string };
    rec?: { status: string; keterangan: string | null };
  }[] = [];

  if (rombelId) {
    const rows = await prisma.anggotaRombel.findMany({
      where: { rombelId, rombel: { sekolahId } },
      orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
      select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true } } },
    });
    const existing = await prisma.kehadiranSiswa.findMany({
      where: { siswaId: { in: rows.map((r) => r.siswaId) }, tanggal: new Date(tanggal) },
      select: { siswaId: true, status: true, keterangan: true },
    });
    const byId = new Map(existing.map((e) => [e.siswaId, e]));
    anggota = rows.map((r) => ({ ...r, rec: byId.get(r.siswaId) }));
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Presensi Siswa</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">Rombel</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className={selCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Tanggal</label>
          <input type="date" name="tanggal" defaultValue={tanggal} className={selCls} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Tampilkan
        </button>
      </form>

      {!rombelId && <p className="text-sm text-gray-500">Pilih rombel dan tanggal untuk input presensi.</p>}

      {rombelId > 0 && (
        <form action={savePresensi} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <input type="hidden" name="tanggal" value={tanggal} />
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">No</th>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Keterangan</th>
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
                    <td className="px-4 py-2">
                      <select name={`status_${a.siswaId}`} defaultValue={a.rec?.status ?? "hadir"} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input name={`ket_${a.siswaId}`} defaultValue={a.rec?.keterangan ?? ""} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {anggota.length > 0 && (
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Simpan Presensi
            </button>
          )}
        </form>
      )}
    </div>
  );
}
