import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { addKasus, deleteKasus } from "./actions";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const fmtTgl = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

// Threshold poin pelanggaran → level sanksi
const THRESHOLDS = [
  { min: 0,  max: 25,  label: "Baik",            color: "bg-emerald-500", desc: "Peringatan lisan" },
  { min: 26, max: 50,  label: "Perlu Perhatian",  color: "bg-amber-400",   desc: "Peringatan tertulis + panggil ortu" },
  { min: 51, max: 75,  label: "Perlu Tindakan",   color: "bg-orange-500",  desc: "Skorsing 1–3 hari" },
  { min: 76, max: 100, label: "Berbahaya",         color: "bg-red-500",     desc: "Skorsing + konferensi kasus" },
  { min: 101, max: 9999, label: "Kritis",          color: "bg-red-900",     desc: "Potensi dikeluarkan" },
];
function getLevel(poin: number) {
  return THRESHOLDS.find(t => poin >= t.min && poin <= t.max) ?? THRESHOLDS[0];
}

export default async function BkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; siswaId?: string }>;
}) {
  const sekolahId = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const siswaId = Number(sp.siswaId) || 0;

  // Overview stats (default view)
  const [totalKasus, topKategori, siswaKritis, recentKasus] = await Promise.all([
    prisma.kasusSiswa.count({ where: { sekolahId } }),
    prisma.kasusSiswa.groupBy({
      by: ["namaKasus"],
      where: { sekolahId },
      _count: { _all: true },
      _sum: { poin: true },
      orderBy: { namaKasus: "asc" },
      take: 8,
    }),
    // Siswa dengan akumulasi poin tertinggi
    prisma.kasusSiswa.groupBy({
      by: ["siswaId"],
      where: { sekolahId },
      _sum: { poin: true },
      orderBy: { _sum: { poin: "desc" } },
      take: 10,
    }),
    prisma.kasusSiswa.findMany({
      where: { sekolahId },
      orderBy: { tanggal: "desc" },
      take: 5,
      include: { siswa: { select: { id: true, namaLengkap: true } }, kategori: { select: { nama: true } } },
    }),
  ]);

  // Ambil nama siswa untuk ranking
  const siswaKritisIds = siswaKritis.map(s => s.siswaId).filter(Boolean) as number[];
  const siswaMap = siswaKritisIds.length > 0
    ? await prisma.siswa.findMany({ where: { id: { in: siswaKritisIds } }, select: { id: true, namaLengkap: true } })
    : [];
  const siswaNameMap = new Map(siswaMap.map(s => [s.id, s.namaLengkap]));

  // Siswa data untuk detail
  const kandidat = q
    ? await prisma.siswa.findMany({
        where: { sekolahId, OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { nisn: { contains: q } }] },
        take: 10, orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true },
      })
    : [];

  const siswa = siswaId
    ? await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId }, select: { id: true, namaLengkap: true, nisn: true } })
    : null;

  const [kasus, kategori] = siswa
    ? await Promise.all([
        prisma.kasusSiswa.findMany({ where: { siswaId: siswa.id, sekolahId }, orderBy: { tanggal: "desc" }, include: { kategori: { select: { nama: true } } } }),
        prisma.kategoriKasus.findMany({ where: { sekolahId }, orderBy: { nama: "asc" } }),
      ])
    : [[], []];

  const totalPoin = kasus.reduce((s, k) => s + k.poin, 0);
  const level = getLevel(totalPoin);
  const today = new Date().toISOString().slice(0, 10);
  const maxBar = Math.max(...topKategori.map(k => (k as { _count?: { _all?: number } })._count?._all ?? 0), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BK — Pencatatan Pelanggaran</h1>
          <p className="text-sm text-gray-500">
            Sistem poin pelanggaran. Klik siswa untuk catat / lihat riwayat.
          </p>
        </div>
        <Link href="/bk/kategori" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Kelola Kategori</Link>
      </div>

      {/* Info poin */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
        <p className="font-semibold text-indigo-800 mb-2">💡 Cara kerja sistem poin pelanggaran</p>
        <p className="text-indigo-700 text-xs mb-2">
          Setiap pelanggaran memiliki nilai poin. Poin diakumulasi per siswa. Makin tinggi poin, makin serius sanksi:
        </p>
        <div className="flex flex-wrap gap-2">
          {THRESHOLDS.map(t => (
            <div key={t.label} className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
              <span className="text-xs font-medium text-gray-700">{t.min}–{t.max === 9999 ? "∞" : t.max}</span>
              <span className="text-xs text-gray-500">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Kolom kiri: Overview stats */}
        <div className="space-y-4 lg:col-span-2">
          {/* Top pelanggaran bar chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">📊 Jenis Pelanggaran Terbanyak</h2>
            {topKategori.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada catatan pelanggaran.</p>
            ) : (
              <div className="space-y-2.5">
                {topKategori.map((k) => {
                  const cnt = (k as { _count?: { _all?: number } })._count?._all ?? 0;
                  const pct = Math.round((cnt / maxBar) * 100);
                  return (
                    <div key={k.namaKasus} className="flex items-center gap-3">
                      <div className="w-36 shrink-0 truncate text-xs font-medium text-gray-700" title={k.namaKasus ?? ""}>
                        {k.namaKasus ?? "—"}
                      </div>
                      <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-5 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center pl-2 transition-all"
                          style={{ width: `${Math.max(pct, 4)}%` }}>
                          <span className="text-[9px] font-bold text-white whitespace-nowrap">{cnt}×</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-gray-400 w-16 text-right">
                        {(k as { _sum?: { poin?: number } })._sum?.poin ?? 0} poin
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">🕐 Pelanggaran Terbaru</h2>
            {recentKasus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada catatan.</p>
            ) : (
              <div className="space-y-2">
                {recentKasus.map(k => (
                  <div key={k.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-xs">
                      {k.siswa?.namaLengkap?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/bk?siswaId=${k.siswa?.id}`} className="text-xs font-semibold text-gray-900 hover:underline">
                        {k.siswa?.namaLengkap ?? "—"}
                      </Link>
                      <div className="text-[10px] text-gray-500">{k.namaKasus} · {fmtTgl(k.tanggal)}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${k.poin >= 25 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {k.poin} poin
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom kanan: Ranking siswa */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">🏷 Siswa Akumulasi Poin Tertinggi</h2>
            {siswaKritis.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">—</p>
            ) : (
              <div className="space-y-2">
                {siswaKritis.map((s, i) => {
                  const poin = (s._sum as { poin?: number | null } | null)?.poin ?? 0;
                  const lvl = getLevel(poin);
                  const nama = siswaNameMap.get(s.siswaId!) ?? "—";
                  return (
                    <Link key={s.siswaId} href={`/bk?siswaId=${s.siswaId}`}
                      className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${i < 3 ? "bg-red-500" : "bg-gray-400"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-semibold text-gray-900">{nama}</div>
                        <div className={`text-[10px] ${lvl.color.replace("bg-", "text-").replace("-500", "-700").replace("-400", "-600")}`}>{lvl.label}</div>
                      </div>
                      <div className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black text-white ${lvl.color}`}>
                        {poin}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stat chips */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-black text-gray-900 leading-none">{totalKasus.toLocaleString("id-ID")}</div>
            <div className="text-xs text-gray-500 mt-0.5">total catatan pelanggaran</div>
          </div>
        </div>
      </div>

      {/* Search siswa */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">🔍 Cari & Catat Pelanggaran Siswa</h2>
        <form className="flex gap-2">
          <SiswaAutocomplete name="q" defaultValue={q} placeholder="Cari siswa (nama / NISN)…" />
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
        </form>

        {q && !siswa && (
          <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            {kandidat.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa cocok.</p>}
            {kandidat.map((s) => (
              <Link key={s.id} href={`/bk?siswaId=${s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {s.namaLengkap.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.namaLengkap}</div>
                  {s.nisn && <div className="text-xs text-gray-400">NISN: {s.nisn}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Detail siswa */}
        {siswa && (
          <div className="mt-4 space-y-4">
            {/* Siswa header card */}
            <div className={`flex items-center gap-4 rounded-2xl border p-4 ${level.color.replace("bg-", "border-").replace("500", "200").replace("400","200").replace("900","200")} ${level.color.replace("bg-", "bg-").replace("500","50").replace("400","50").replace("900","50")}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black text-white ${level.color}`}>
                {siswa.namaLengkap.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">{siswa.namaLengkap}</div>
                {siswa.nisn && <div className="text-xs text-gray-500">NISN: {siswa.nisn}</div>}
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black text-white rounded-xl px-4 py-2 ${level.color}`}>{totalPoin}</div>
                <div className="text-xs text-gray-500 mt-1">poin akumulasi</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">{level.label}</div>
                <div className="text-xs text-gray-500">{level.desc}</div>
                <Link href="/bk" className="mt-1 block text-xs text-gray-400 hover:text-gray-700">Ganti ↗</Link>
              </div>
            </div>

            {/* Form catat */}
            <form action={addKasus} className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input type="hidden" name="siswaId" value={siswa.id} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                <select name="kategoriId" className={inCls}>
                  <option value="">- manual -</option>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.poin} poin)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pelanggaran</label>
                <input name="namaKasus" placeholder="Nama pelanggaran" className={`${inCls} w-44`} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Poin</label>
                <input name="poin" type="number" min={0} defaultValue={0} className={`${inCls} w-20`} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
                <input name="tanggal" type="date" defaultValue={today} className={inCls} />
              </div>
              <div className="flex-1 min-w-32">
                <label className="block text-xs text-gray-500 mb-1">Keterangan</label>
                <input name="keterangan" className={`${inCls} w-full`} />
              </div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Catat</button>
            </form>

            {/* Riwayat */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Riwayat Pelanggaran ({kasus.length})</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tanggal</th>
                    <th className="px-4 py-2 font-medium">Pelanggaran</th>
                    <th className="px-4 py-2 font-medium text-center">Poin</th>
                    <th className="px-4 py-2 font-medium">Keterangan</th>
                    <th className="px-4 py-2 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kasus.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada catatan pelanggaran.</td></tr>
                  )}
                  {kasus.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{fmtTgl(k.tanggal)}</td>
                      <td className="px-4 py-2 text-gray-900">{k.namaKasus}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${k.poin >= 25 ? "bg-red-100 text-red-700" : k.poin >= 10 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                          {k.poin}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{k.keterangan ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <form action={deleteKasus}>
                          <input type="hidden" name="id" value={k.id} />
                          <input type="hidden" name="siswaId" value={siswa.id} />
                          <button className="text-xs text-red-600 hover:underline">Hapus</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
