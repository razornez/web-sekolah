import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import MapelForm from "../_components/MapelForm";
import { GuruSelect } from "@/components/filters/GuruSelect";
import type { ACOption } from "@/components/AutocompleteSelect";
import { addGuruMapel } from "../actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";

export default async function EditMapelPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("mapel");
  const { id } = await params;

  const [mapel, guruList] = await Promise.all([
    prisma.mapel.findFirst({
      where: { id: Number(id), sekolahId },
      include: {
        guruHistory: {
          include: { guru: { select: { id: true, namaGuru: true, statusGuru: true, foto: true } } },
          orderBy: [{ aktif: "desc" }, { tahunAjaran: "desc" }],
        },
        _count: { select: { nilaiRapor: true } },
      },
    }),
    prisma.guru.findMany({ where: { sekolahId, deletedAt: null }, orderBy: { namaGuru: "asc" }, select: { id: true, namaGuru: true, jenisJabatan: true } }),
  ]);
  if (!mapel) notFound();

  const guruOptions: ACOption[] = guruList.map((g) => ({
    key: g.id, value: g.id, label: g.namaGuru, sub: g.jenisJabatan ?? undefined,
  }));

  const tahunList = await prisma.tahunAjaran.findMany({ where: { sekolahId }, orderBy: { tahun: "desc" }, select: { tahun: true } });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/mapel" className="text-sm text-gray-500 hover:text-gray-900">← Mata Pelajaran</Link>
        <h1 className="mt-0.5 text-2xl font-bold text-gray-900">{mapel.namaMapel}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-mono text-gray-600">{mapel.kodeMapel}</span>
          <span>·</span>
          <span>Kelompok {mapel.kelompok}</span>
          {mapel.fase && <><span>·</span><span>Fase {mapel.fase}</span></>}
          <span>·</span>
          <span>KKM {mapel.kkm}</span>
          {!mapel.aktif && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">⛔ Nonaktif</span>}
          <span>·</span>
          <span>{mapel._count.nilaiRapor} catatan nilai</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Form edit — col 3 */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">✏️ Edit Data Mapel</h2>
          <MapelForm
            guruOptions={guruOptions}
            initial={{
              id: mapel.id,
              namaMapel: mapel.namaMapel,
              kodeMapel: mapel.kodeMapel,
              kelompok: mapel.kelompok,
              fase: mapel.fase,
              kkm: mapel.kkm,
              noUrut: mapel.noUrut,
              guruId: mapel.guruId,
            }}
          />
        </div>

        {/* History Guru — col 2 */}
        <div className="lg:col-span-2 space-y-4">
          {/* History list */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">👨‍🏫 History Guru Pengajar</h2>
            {mapel.guruHistory.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada history guru.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {mapel.guruHistory.map((mg) => (
                  <li key={mg.id} className="flex items-center gap-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                      {mg.guru.namaGuru.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/guru/${mg.guru.id}`} className="text-sm font-medium text-gray-800 hover:underline truncate block">
                        {mg.guru.namaGuru}
                      </Link>
                      <div className="text-xs text-gray-400">
                        {mg.tahunAjaran ?? "—"}
                        {mg.guru.statusGuru && ` · ${mg.guru.statusGuru}`}
                      </div>
                    </div>
                    {mg.aktif && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">aktif</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tambah guru ke history */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">➕ Tambah Guru ke History</h2>
            <form action={addGuruMapel} className="space-y-2">
              <input type="hidden" name="mapelId" value={mapel.id} />
              <div>
                <label className="block text-xs text-gray-500">Guru</label>
                <GuruSelect sekolahId={sekolahId} name="guruId" required emptyLabel="— pilih guru —" className={`${inCls} w-full`} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tahun Ajaran</label>
                <select name="tahunAjaran" defaultValue="" className={`${inCls} w-full`}>
                  <option value="">— pilih —</option>
                  {tahunList.map((t) => <option key={t.tahun} value={t.tahun}>{t.tahun}</option>)}
                </select>
              </div>
              <button className="w-full rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">Tambah</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
