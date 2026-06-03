import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { naikanKelas } from "./actions";

const inCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export default async function KenaikanKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ berhasil?: string; rombel?: string }>;
}) {
  const sekolahId = await requireModule("rombel");
  const sp = await searchParams;

  const [rombelList, tahunList, tingkatList] = await Promise.all([
    prisma.rombel.findMany({
      where: { sekolahId },
      orderBy: [{ tahunAjaran: { tahun: "desc" } }, { nama: "asc" }],
      include: {
        tahunAjaran: { select: { tahun: true } },
        tingkat: { select: { nama: true } },
        _count: { select: { anggota: true } },
      },
    }),
    prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" } }),
    prisma.tingkat.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Kenaikan Kelas</h1>
        <p className="text-sm text-gray-500">Promosikan anggota rombel lama ke rombel baru (tahun ajaran baru).</p>
      </div>

      {sp.berhasil && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Berhasil memindahkan <b>{sp.berhasil}</b> siswa ke rombel <b>{decodeURIComponent(sp.rombel ?? "")}</b>.
        </div>
      )}

      <form action={naikanKelas} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-medium text-gray-700">Promosi Satu Rombel</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500">Rombel Sumber (lama)</label>
            <select name="rombelLamaId" required defaultValue="" className={inCls}>
              <option value="">- pilih rombel sumber -</option>
              {rombelList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama} · TA {r.tahunAjaran.tahun} · {r._count.anggota} siswa
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500">Tahun Ajaran Baru (target)</label>
            <select name="tahunAjaranBaruId" required defaultValue="" className={inCls}>
              <option value="">- pilih tahun ajaran baru -</option>
              {tahunList.map((t) => (
                <option key={t.id} value={t.id}>{t.tahun}{t.aktif ? " (aktif)" : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500">Tingkat Baru</label>
            <select name="tingkatBaruId" required defaultValue="" className={inCls}>
              <option value="">- pilih tingkat baru -</option>
              {tingkatList.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}{t.fase ? ` · Fase ${t.fase}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500">Nama Rombel Baru</label>
            <input name="namaRombelBaru" required placeholder="XI IPA 1" className={inCls} />
          </div>
        </div>

        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠️ Operasi ini akan <b>menambahkan</b> anggota rombel sumber ke rombel baru — tidak menghapus anggota lama. Siswa yang sudah ada di rombel tujuan tidak akan duplikat.
        </div>

        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Naikan Kelas
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Semua Rombel</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">Nama</th><th className="px-4 py-2 font-medium">Tahun Ajaran</th><th className="px-4 py-2 font-medium">Tingkat</th><th className="px-4 py-2 font-medium">Anggota</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rombelList.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">{r.nama}</td>
                <td className="px-4 py-2 text-gray-600">{r.tahunAjaran.tahun}</td>
                <td className="px-4 py-2 text-gray-600">{r.tingkat.nama}</td>
                <td className="px-4 py-2 text-gray-600">{r._count.anggota} siswa</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
