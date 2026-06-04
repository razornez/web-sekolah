import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { PageGuide } from "@/components/PageGuide";
import { saveJadwal, deleteJadwalAction } from "./actions";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const JAM_MULAI = ["07:00","08:30","10:15","11:45","13:30"];
const JAM_LABEL: Record<string, string> = {
  "07:00": "07:00 – 08:30", "08:30": "08:30 – 10:00",
  "10:15": "10:15 – 11:45", "11:45": "11:45 – 13:15", "13:30": "13:30 – 15:00",
};
const COLORS = ["bg-blue-50 border-blue-300 text-blue-900","bg-emerald-50 border-emerald-300 text-emerald-900","bg-purple-50 border-purple-300 text-purple-900","bg-amber-50 border-amber-300 text-amber-900","bg-rose-50 border-rose-300 text-rose-900","bg-cyan-50 border-cyan-300 text-cyan-900","bg-orange-50 border-orange-300 text-orange-900","bg-teal-50 border-teal-300 text-teal-900","bg-indigo-50 border-indigo-300 text-indigo-900","bg-pink-50 border-pink-300 text-pink-900"];

export default async function JadwalPage({ searchParams }: { searchParams: Promise<{ guruId?: string; rombelId?: string; mode?: string }> }) {
  const sekolahId = await requireModule("jadwal");
  const sp = await searchParams;
  const fGuru = Number(sp.guruId) || 0;
  const fRombel = Number(sp.rombelId) || 0;
  const mode = sp.mode ?? "kalender";

  const [jadwal, guruList, hariList, mapelList] = await Promise.all([
    prisma.jadwalGuru.findMany({
      where: { sekolahId, ...(fGuru ? { guruId: fGuru } : {}), ...(fRombel ? { rombelId: fRombel } : {}) },
      include: { guru: { select: { id: true, namaGuru: true } }, hari: { select: { id: true, nama: true, urutan: true } }, rombel: { select: { id: true, nama: true } } },
      orderBy: [{ hari: { urutan: "asc" } }, { jamMulai: "asc" }],
    }),
    prisma.guru.findMany({ where: { sekolahId, deletedAt: null }, orderBy: { namaGuru: "asc" }, select: { id: true, namaGuru: true } }),
    prisma.hari.findMany({ where: { sekolahId }, orderBy: { urutan: "asc" } }),
    prisma.mapel.findMany({ where: { sekolahId, aktif: true }, orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }], select: { id: true, namaMapel: true } }),
  ]);

  const allMapelNames = [...new Set(jadwal.map(j => j.mapel ?? ""))];
  const colorMap: Record<string, string> = {};
  allMapelNames.forEach((m, i) => { colorMap[m] = COLORS[i % COLORS.length]; });

  const grid: Record<string, Record<string, typeof jadwal>> = {};
  for (const j of jadwal) {
    const h = j.hari.nama; const k = j.jamMulai ?? "?";
    if (!grid[h]) grid[h] = {};
    (grid[h][k] ??= []).push(j);
  }
  const hariNames = hariList.length ? hariList.map(h => h.nama) : HARI_ORDER;

  return (
    <div className="space-y-5">
      <PageGuide icon="🗓" title="Jadwal Mengajar"
        description="Timetable mingguan. Tiap slot menampilkan mapel + guru + kelas dengan warna berbeda per mapel. Filter per guru atau kelas untuk tampilan spesifik."
        tips={["Filter Guru → jadwal mengajar guru tertentu.", "Filter Kelas → jadwal pelajaran satu kelas.", "Mode Kalender: visual timetable. Mode List: tabel detail.", "Tambah jadwal di bagian bawah."]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Mengajar</h1>
        <div className="flex overflow-hidden rounded-lg border border-gray-300 text-xs font-medium">
          <Link href={`/jadwal?mode=kalender&guruId=${fGuru}&rombelId=${fRombel}`} className={`px-3 py-1.5 transition-colors ${mode==="kalender"?"bg-gray-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>🗓 Kalender</Link>
          <Link href={`/jadwal?mode=list&guruId=${fGuru}&rombelId=${fRombel}`} className={`border-l px-3 py-1.5 transition-colors ${mode==="list"?"bg-gray-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>📋 List</Link>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="mode" value={mode} />
        <div><label className="mb-1 block text-xs font-medium text-gray-500">Guru</label>
          <select name="guruId" defaultValue={fGuru||""} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[200px]">
            <option value="">— Semua Guru —</option>
            {guruList.map((g) => <option key={g.id} value={g.id}>{g.namaGuru}</option>)}
          </select></div>
        <div><label className="mb-1 block text-xs font-medium text-gray-500">Kelas / Rombel</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={fRombel||""} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" /></div>
        <button className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800">Filter</button>
        {(fGuru||fRombel) && <Link href={`/jadwal?mode=${mode}`} className="text-sm text-gray-500 hover:text-gray-900">Reset</Link>}
      </form>

      {/* KALENDER */}
      {mode === "kalender" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead><tr>
              <th className="bg-gray-900 text-white px-3 py-3 text-left text-xs font-semibold w-28">Jam</th>
              {hariNames.map((h) => <th key={h} className="bg-gray-900 text-white px-3 py-3 text-center text-xs font-semibold min-w-[130px]">{h}</th>)}
            </tr></thead>
            <tbody>
              {/* Istirahat row 1 */}
              <tr><td colSpan={hariNames.length+1} className="border border-gray-100 bg-amber-50 px-3 py-1 text-center text-xs text-amber-600 italic">☕ 10:00 – 10:15 (Istirahat)</td></tr>
              {JAM_MULAI.map((jam, idx) => (
                <tr key={jam} className={idx%2===0?"bg-white":"bg-gray-50/40"}>
                  <td className="border border-gray-100 px-3 py-2 text-xs font-mono font-medium text-gray-500 align-top whitespace-nowrap">{JAM_LABEL[jam]??jam}</td>
                  {hariNames.map((hari) => {
                    const cells = grid[hari]?.[jam] ?? [];
                    return (
                      <td key={hari} className="border border-gray-100 px-1.5 py-1.5 align-top">
                        {cells.length===0 ? <div className="h-10" /> : (
                          <div className="space-y-1">
                            {cells.map((j) => (
                              <div key={j.id} className={`rounded-md border px-2 py-1.5 text-xs leading-tight ${colorMap[j.mapel ?? ""]??COLORS[0]}`}>
                                <div className="font-semibold">{j.mapel??"-"}</div>
                                <div className="opacity-75 mt-0.5 text-xs">{j.guru.namaGuru.split(" ").slice(-2).join(" ")}</div>
                                {j.rombel && <div className="opacity-60 text-xs">{j.rombel.nama}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr><td colSpan={hariNames.length+1} className="border border-gray-100 bg-amber-50 px-3 py-1 text-center text-xs text-amber-600 italic">☕ 13:15 – 13:30 (Istirahat)</td></tr>
            </tbody>
          </table>
          {jadwal.length===0 && <div className="py-12 text-center text-gray-400"><div className="text-3xl">🗓</div><p className="mt-2 text-sm">Belum ada jadwal.</p></div>}
        </div>
      )}

      {/* LIST */}
      {mode==="list" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Hari</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Jam</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Mapel</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Guru</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Kelas</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jadwal.length===0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada jadwal.</td></tr>}
              {jadwal.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{j.hari.nama}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{j.jamMulai??"-"}–{j.jamSelesai??"-"}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${colorMap[j.mapel ?? ""]??""}`}>{j.mapel??"-"}</span></td>
                  <td className="px-4 py-2.5"><Link href={`/guru/${j.guru.id}`} className="text-gray-700 hover:underline">{j.guru.namaGuru}</Link></td>
                  <td className="px-4 py-2.5 text-gray-600">{j.rombel?.nama??"-"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={deleteJadwalAction} className="inline">
                      <input type="hidden" name="id" value={j.id} />
                      <button className="text-xs text-red-500 hover:underline">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tambah */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">➕ Tambah Jadwal</h2>
        <form action={saveJadwal} className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Guru *</label>
            <select name="guruId" required defaultValue="" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[180px]">
              <option value="">— pilih guru —</option>
              {guruList.map((g) => <option key={g.id} value={g.id}>{g.namaGuru}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Hari *</label>
            <select name="hariNama" required defaultValue="" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">— pilih —</option>
              {HARI_ORDER.map((h) => <option key={h} value={h}>{h}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Jam Mulai</label>
            <select name="jamMulai" defaultValue="07:00" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              {JAM_MULAI.map((j) => <option key={j} value={j}>{j}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Jam Selesai</label>
            <select name="jamSelesai" defaultValue="08:30" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              {["08:30","10:00","11:45","13:15","15:00"].map((j) => <option key={j} value={j}>{j}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Mapel</label>
            <select name="mapelNama" defaultValue="" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[150px]">
              <option value="">— pilih —</option>
              {mapelList.map((m) => <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-500">Kelas</label>
            <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue="" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" /></div>
          <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">Simpan</button>
        </form>
      </div>
    </div>
  );
}
