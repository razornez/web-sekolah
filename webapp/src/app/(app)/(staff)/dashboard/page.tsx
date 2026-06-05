import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PengumumanFeed } from "@/components/PengumumanFeed";
import { BarList, Donut } from "@/components/charts";

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const gCount = (rows: { _count: number }[], field: string, value: string | null) =>
  rows.find((r) => (r as Record<string, unknown>)[field] === value)?._count ?? 0;

function StatCard({ label, value, href, colorClass }: { label: string; value: number | string; href?: string; colorClass?: string }) {
  const inner = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:opacity-80">
      <div className={`text-2xl font-semibold ${colorClass ?? "text-gray-900"}`}>
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

// ── Admin / Kepsek / Operator ─────────────────────────────────────────────────
async function DashboardAdmin({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const [siswa, guru, rombel, tagihanBelum, pelanggaran, ujian,
    genderG, statusG, rombelTop, sppG, hadirG] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId } }),
    prisma.guru.count({ where: { sekolahId } }),
    prisma.rombel.count({ where: { sekolahId } }),
    prisma.tagihanSpp.count({ where: { sekolahId, status: { not: "lunas" } } }),
    prisma.kasusSiswa.count({ where: { sekolahId } }),
    prisma.ujian.count({ where: { sekolahId } }),
    prisma.siswa.groupBy({ by: ["jenisKelamin"], where: { sekolahId }, _count: true }),
    prisma.siswa.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: { nama: "asc" }, take: 10, select: { nama: true, _count: { select: { anggota: true } } } }),
    prisma.tagihanSpp.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
    prisma.kehadiranSiswa.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
  ]);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("statSiswa")} value={siswa} href="/siswa" />
        <StatCard label={t("statGuru")} value={guru} href="/guru" />
        <StatCard label={t("statRombel")} value={rombel} href="/rombel" />
        <StatCard label={t("statSppBelum")} value={tagihanBelum} href="/spp" colorClass="text-amber-600" />
        <StatCard label={t("statPelanggaran")} value={pelanggaran} href="/bk" colorClass="text-red-600" />
        <StatCard label={t("statUjian")} value={ujian} href="/ujian" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Donut title={t("chartGender")} data={[
          { label: t("genderL"), value: gCount(genderG, "jenisKelamin", "L"), color: "#3b82f6" },
          { label: t("genderP"), value: gCount(genderG, "jenisKelamin", "P"), color: "#ec4899" },
          { label: t("genderNull"), value: gCount(genderG, "jenisKelamin", null), color: "#9ca3af" },
        ]} />
        <BarList title={t("chartStatusSiswa")} data={(["aktif","lulus","pindah","keluar","alumni"] as const).map((s) => ({ label: s, value: gCount(statusG, "status", s) }))} barClass="bg-indigo-600" />
        <BarList title={t("chartStatusSpp")} data={(["lunas","belum","cicil"] as const).map((s) => ({ label: s, value: gCount(sppG, "status", s) }))} barClass="bg-emerald-600" />
        <BarList title={t("chartRekapKehadiran")} data={(["hadir","izin","sakit","alpa","terlambat"] as const).map((s) => ({ label: s, value: gCount(hadirG, "status", s) }))} barClass="bg-amber-500" />
        <div className="lg:col-span-2">
          <BarList title={t("chartSiswaPerRombel")} data={rombelTop.map((r) => ({ label: r.nama, value: r._count.anggota }))} barClass="bg-gray-900" />
        </div>
      </div>
    </>
  );
}

// ── Guru ──────────────────────────────────────────────────────────────────────
async function DashboardGuru({ sekolahId, userId }: { sekolahId: number; userId: string }) {
  const t = await getTranslations("dashboard");
  const guru = await prisma.guru.findFirst({ where: { userId, sekolahId }, select: { id: true } });
  if (!guru) return <p className="text-sm text-gray-500">{t("noGuru")}</p>;
  const [jadwal, tugasBelumNilai, tugasTotal, hasilUjian, jurnalTerbaru] = await Promise.all([
    prisma.jadwalGuru.findMany({ where: { guruId: guru.id, sekolahId }, include: { hari: { select: { nama: true, urutan: true } } }, orderBy: { hari: { urutan: "asc" } } }),
    prisma.pengumpulanTugas.count({ where: { tugas: { sekolahId, guruId: guru.id }, nilai: null } }),
    prisma.tugas.count({ where: { sekolahId, guruId: guru.id } }),
    prisma.hasilUjian.count({ where: { ujian: { sekolahId, guruId: guru.id } } }),
    prisma.jurnalGuru.findMany({ where: { guruId: guru.id, sekolahId }, orderBy: { tanggal: "desc" }, take: 5 }),
  ]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("statJadwalMengajar")} value={jadwal.length} href="/jadwal" />
        <StatCard label={t("statTugasDibuat")} value={tugasTotal} href="/tugas" />
        <StatCard label={t("statBelumDinilai")} value={tugasBelumNilai} href="/tugas" colorClass="text-amber-600" />
        <StatCard label={t("statPesertaUjian")} value={hasilUjian} href="/ujian" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>{t("jadwalMengajar")}</span>
            <Link href="/jadwal" className="text-xs text-gray-400 hover:text-gray-700">{t("manage")}</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-2 text-left font-medium">{t("colHari")}</th><th className="px-4 py-2 text-left font-medium">{t("colMapel")}</th><th className="px-4 py-2 text-left font-medium">{t("colJam")}</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {jadwal.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">{t("emptyJadwal")}</td></tr>}
              {jadwal.map((j) => <tr key={j.id}><td className="px-4 py-2 text-gray-900">{j.hari.nama}</td><td className="px-4 py-2 text-gray-600">{j.mapel ?? "-"}</td><td className="px-4 py-2 text-gray-500">{j.jamMulai ?? "-"}{j.jamSelesai ? `–${j.jamSelesai}` : ""}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>{t("jurnalTerbaru")}</span>
            <Link href="/jurnal" className="text-xs text-gray-400 hover:text-gray-700">{t("addArrow")}</Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {jurnalTerbaru.length === 0 && <li className="px-4 py-4 text-sm text-gray-400">{t("emptyJurnal")}</li>}
            {jurnalTerbaru.map((j) => <li key={j.id} className="px-4 py-2 text-sm"><div className="font-medium text-gray-900">{j.materi ?? "-"}</div><div className="text-xs text-gray-400">{j.kelas ?? "-"} · {fmt(j.tanggal)}</div></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Wali Kelas ────────────────────────────────────────────────────────────────
async function DashboardWalikelas({ sekolahId, userId }: { sekolahId: number; userId: string }) {
  const t = await getTranslations("dashboard");
  const guru = await prisma.guru.findFirst({ where: { userId, sekolahId }, select: { id: true } });
  const rombel = guru ? await prisma.rombel.findFirst({
    where: { waliGuruId: guru.id, sekolahId },
    include: { tahunAjaran: { select: { tahun: true } }, anggota: { include: { siswa: { select: { id: true, namaLengkap: true } } }, orderBy: { nomorAbsen: "asc" } } },
  }) : null;
  if (!rombel) return <div className="space-y-2"><p className="text-sm text-gray-500">{t("noWalikelas")}</p><PengumumanFeed sekolahId={sekolahId} audience="staf" /></div>;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const hdToday = await prisma.kehadiranSiswa.findMany({ where: { siswaId: { in: rombel.anggota.map((a) => a.siswa.id) }, tanggal: today }, select: { siswaId: true, status: true } });
  const hdMap = new Map(hdToday.map((h) => [h.siswaId, h.status]));
  const hdStats: Record<string, number> = { hadir: 0, izin: 0, sakit: 0, alpa: 0, terlambat: 0, belum: 0 };
  for (const a of rombel.anggota) { const s = hdMap.get(a.siswa.id) ?? "belum"; hdStats[s] = (hdStats[s] ?? 0) + 1; }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-lg font-semibold text-gray-900">{rombel.nama}</div><div className="text-sm text-gray-500">{t("taLabel")} {rombel.tahunAjaran.tahun} · {t("siswaCount", { n: rombel.anggota.length })}</div></div>
        <Link href={`/rombel/${rombel.id}`} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">{t("kelolaRombel")}</Link>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(hdStats).map(([s, n]) => (
          <div key={s} className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <div className="text-xl font-semibold text-gray-900">{n}</div>
            <div className="text-xs text-gray-500">{s}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">{t("siswaStatusHariIni")}</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {rombel.anggota.slice(0, 20).map((a) => {
              const s = hdMap.get(a.siswa.id);
              return <tr key={a.siswa.id}><td className="px-4 py-1.5"><Link href={`/siswa/${a.siswa.id}`} className="text-gray-900 hover:underline">{a.siswa.namaLengkap}</Link></td><td className="px-4 py-1.5 text-right"><span className={`rounded px-1.5 py-0.5 text-xs ${!s ? "bg-gray-100 text-gray-400" : s === "hadir" ? "bg-green-100 text-green-700" : s === "alpa" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{s ?? "—"}</span></td></tr>;
            })}
          </tbody>
        </table>
        {rombel.anggota.length > 20 && <div className="px-4 py-2 text-xs text-gray-400">{t("moreSiswa", { n: rombel.anggota.length - 20 })}</div>}
      </div>
    </div>
  );
}

// ── BK ────────────────────────────────────────────────────────────────────────
async function DashboardBk({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const bulanIni = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [total, bulanIniCount, topSiswa, kasusRecent] = await Promise.all([
    prisma.kasusSiswa.count({ where: { sekolahId } }),
    prisma.kasusSiswa.count({ where: { sekolahId, tanggal: { gte: bulanIni } } }),
    prisma.kasusSiswa.groupBy({ by: ["siswaId"], where: { sekolahId }, _sum: { poin: true }, orderBy: { _sum: { poin: "desc" } }, take: 8 }),
    prisma.kasusSiswa.findMany({ where: { sekolahId }, orderBy: { tanggal: "desc" }, take: 8, include: { siswa: { select: { namaLengkap: true } } } }),
  ]);
  const siswaNames = await prisma.siswa.findMany({ where: { id: { in: topSiswa.map((t) => t.siswaId) } }, select: { id: true, namaLengkap: true } });
  const nm = new Map(siswaNames.map((s) => [s.id, s.namaLengkap]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><StatCard label={t("statTotalKasus")} value={total} href="/bk" /><StatCard label={t("statBulanIni")} value={bulanIniCount} href="/bk" colorClass="text-amber-600" /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title={t("chartPoinTertinggi")} data={topSiswa.map((ts) => ({ label: nm.get(ts.siswaId) ?? "-", value: ts._sum.poin ?? 0 }))} barClass="bg-red-500" suffix={t("poinSuffix")} />
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">{t("kasusTerbaru")}</div>
          <ul className="divide-y divide-gray-100">
            {kasusRecent.map((k) => <li key={k.id} className="px-4 py-2 text-sm"><div className="font-medium text-gray-900">{k.siswa?.namaLengkap ?? "-"}</div><div className="text-xs text-gray-500">{k.namaKasus} · {t("kasusPoin", { n: k.poin })} · {fmt(k.tanggal)}</div></li>)}
            {kasusRecent.length === 0 && <li className="px-4 py-4 text-sm text-gray-400">{t("emptyKasus")}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Bendahara ─────────────────────────────────────────────────────────────────
async function DashboardBendahara({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const tahun = new Date().getFullYear();
  const [lunas, belum, cicil, recent] = await Promise.all([
    prisma.tagihanSpp.aggregate({ where: { sekolahId, tahun, status: "lunas" }, _sum: { nominal: true }, _count: true }),
    prisma.tagihanSpp.aggregate({ where: { sekolahId, tahun, status: "belum" }, _sum: { nominal: true }, _count: true }),
    prisma.tagihanSpp.aggregate({ where: { sekolahId, tahun, status: "cicil" }, _sum: { nominal: true }, _count: true }),
    prisma.pembayaranSpp.findMany({ take: 8, orderBy: { tanggalBayar: "desc" }, include: { tagihan: { include: { siswa: { select: { namaLengkap: true } }, jenis: { select: { nama: true } } } } }, where: { tagihan: { sekolahId } } }),
  ]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4"><div className="text-xl font-semibold text-green-700">{rupiah(lunas._sum.nominal ?? 0)}</div><div className="text-xs text-gray-500">{t("terbayar", { tahun, n: lunas._count })}</div></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><div className="text-xl font-semibold text-amber-700">{rupiah(belum._sum.nominal ?? 0)}</div><div className="text-xs text-gray-500">{t("belumLunas", { n: belum._count })}</div></div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="text-xl font-semibold text-blue-700">{rupiah(cicil._sum.nominal ?? 0)}</div><div className="text-xs text-gray-500">{t("cicilan", { n: cicil._count })}</div></div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Donut title={t("chartStatusSppTahun", { tahun })} data={[{ label: t("sppLunas"), value: lunas._count, color: "#22c55e" }, { label: t("sppBelum"), value: belum._count, color: "#f59e0b" }, { label: t("sppCicil"), value: cicil._count, color: "#3b82f6" }]} />
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between"><span>{t("pembayaranTerbaru")}</span><Link href="/spp" className="text-xs text-gray-400 hover:text-gray-700">{t("lihatSemua")}</Link></div>
          <table className="w-full text-sm"><tbody className="divide-y divide-gray-100">
            {recent.map((p) => <tr key={p.id}><td className="px-4 py-2 text-gray-900">{p.tagihan.siswa.namaLengkap}</td><td className="px-4 py-2 text-gray-500 text-xs">{p.tagihan.jenis.nama}</td><td className="px-4 py-2 text-right font-medium text-green-700">{rupiah(p.jumlah)}</td></tr>)}
            {recent.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">{t("emptyPembayaran")}</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}

// ── Perpustakaan ──────────────────────────────────────────────────────────────
async function DashboardPerpustakaan({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const [totalBuku, dipinjam, overdue, recent] = await Promise.all([
    prisma.bukuPerpustakaan.count({ where: { sekolahId } }),
    prisma.pinjamanBuku.count({ where: { sekolahId, tanggalKembali: null } }),
    prisma.pinjamanBuku.count({ where: { sekolahId, tanggalKembali: null, tanggalPinjam: { lt: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.pinjamanBuku.findMany({ where: { sekolahId, tanggalKembali: null }, orderBy: { tanggalPinjam: "asc" }, take: 8, include: { buku: { select: { judul: true } }, siswa: { select: { namaLengkap: true } } } }),
  ]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><StatCard label={t("statTotalJudul")} value={totalBuku} href="/perpustakaan" /><StatCard label={t("statDipinjam")} value={dipinjam} href="/perpustakaan/pinjam" colorClass="text-amber-600" /><StatCard label={t("statOverdue")} value={overdue} colorClass="text-red-600" /></div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">{t("pinjamanAktif")}</div>
        <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-2 text-left font-medium">{t("colBuku")}</th><th className="px-4 py-2 text-left font-medium">{t("colPeminjam")}</th><th className="px-4 py-2 text-left font-medium">{t("colTanggal")}</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {recent.map((p) => <tr key={p.id} className={p.tanggalPinjam < new Date(Date.now() - 7 * 86400000) ? "bg-red-50" : ""}><td className="px-4 py-2 text-gray-900">{p.buku.judul}</td><td className="px-4 py-2 text-gray-600">{p.siswa?.namaLengkap ?? "-"}</td><td className="px-4 py-2 text-gray-500">{fmt(p.tanggalPinjam)}</td></tr>)}
            {recent.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">{t("emptyPinjaman")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Kesiswaan ─────────────────────────────────────────────────────────────────
async function DashboardKesiswaan({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bulanIni = new Date(today.getFullYear(), today.getMonth(), 1);
  const [hdToday, kasusMonth, ppdbBaru, totalSiswa] = await Promise.all([
    prisma.kehadiranSiswa.groupBy({ by: ["status"], where: { sekolahId, tanggal: today }, _count: true }),
    prisma.kasusSiswa.count({ where: { sekolahId, tanggal: { gte: bulanIni } } }),
    prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "baru" } }),
    prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
  ]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t("statSiswaAktif")} value={totalSiswa} href="/siswa" />
        <StatCard label={t("statHadirHariIni")} value={gCount(hdToday, "status", "hadir")} href="/presensi" colorClass="text-green-700" />
        <StatCard label={t("statKasusBulanIni")} value={kasusMonth} href="/bk" colorClass="text-red-600" />
        <StatCard label={t("statPpdbMenunggu")} value={ppdbBaru} href="/ppdb" colorClass="text-amber-600" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title={t("chartKehadiranHariIni")} data={(["hadir","izin","sakit","alpa","terlambat"] as const).map((s) => ({ label: s, value: gCount(hdToday, "status", s) }))} barClass="bg-indigo-600" />
        <PengumumanFeed sekolahId={sekolahId} audience="staf" />
      </div>
    </div>
  );
}

// ── Humas ─────────────────────────────────────────────────────────────────────
async function DashboardHumas({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const [total, diterima, ditolak, pengumuman] = await Promise.all([
    prisma.pendaftaranPpdb.count({ where: { sekolahId } }),
    prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "diterima" } }),
    prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "ditolak" } }),
    prisma.pengumuman.count({ where: { sekolahId } }),
  ]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t("statTotalPendaftar")} value={total} href="/ppdb" />
        <StatCard label={t("statDiterima")} value={diterima} href="/ppdb?status=diterima" colorClass="text-green-700" />
        <StatCard label={t("statDitolak")} value={ditolak} href="/ppdb?status=ditolak" colorClass="text-red-600" />
        <StatCard label={t("statPengumuman")} value={pengumuman} href="/pengumuman" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Donut title={t("chartStatusPpdb")} data={[{ label: t("ppdbDiterima"), value: diterima, color: "#22c55e" }, { label: t("ppdbDitolak"), value: ditolak, color: "#ef4444" }, { label: t("ppdbLainnya"), value: total - diterima - ditolak, color: "#9ca3af" }]} />
        <PengumumanFeed sekolahId={sekolahId} audience="staf" />
      </div>
    </div>
  );
}

// ── Sarpras ───────────────────────────────────────────────────────────────────
async function DashboardSarpras({ sekolahId }: { sekolahId: number }) {
  const t = await getTranslations("dashboard");
  const [total, baik, rusak, byKat] = await Promise.all([
    prisma.sarpras.count({ where: { sekolahId } }),
    prisma.sarpras.count({ where: { sekolahId, kondisi: "Baik" } }),
    prisma.sarpras.count({ where: { sekolahId, kondisi: { startsWith: "Rusak" } } }),
    prisma.sarpras.groupBy({ by: ["kategoriId"], where: { sekolahId }, _count: true }),
  ]);
  const katIds = byKat.filter((k) => k.kategoriId).map((k) => k.kategoriId as number);
  const kats = await prisma.kategoriSarpras.findMany({ where: { id: { in: katIds } }, select: { id: true, nama: true } });
  const km = new Map(kats.map((k) => [k.id, k.nama]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("statTotalItem")} value={total} href="/sarpras" />
        <StatCard label={t("statKondisiBaik")} value={baik} colorClass="text-green-700" />
        <StatCard label={t("statRusak")} value={rusak} colorClass="text-red-600" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Donut title={t("chartKondisiSarpras")} data={[{ label: t("sarprasBaik"), value: baik, color: "#22c55e" }, { label: t("sarprasRusak"), value: rusak, color: "#ef4444" }, { label: t("sarprasLainnya"), value: total - baik - rusak, color: "#9ca3af" }]} />
        <BarList title={t("chartItemPerKategori")} data={byKat.map((k) => ({ label: k.kategoriId ? (km.get(k.kategoriId) ?? t("katLainnya")) : t("tanpaKategori"), value: k._count }))} barClass="bg-gray-900" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator", operator: "Operator", kepsek: "Kepala Sekolah",
  kurikulum: "Kurikulum", kesiswaan: "Kesiswaan", humas: "Humas",
  guru: "Guru", walikelas: "Wali Kelas", bk: "Bimbingan Konseling",
  bendahara: "Bendahara", perpustakaan: "Perpustakaan", sarpras: "Sarana Prasarana",
  resepsionis: "Resepsionis",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const sekolahId = user.sekolahId ?? -1;
  const { role, id: userId } = user;
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");
  const roleLabel = tRoles.has(role) ? tRoles(role) : (ROLE_LABELS[role] ?? role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{t("title")}</h1>
        <p className="text-sm text-gray-500">
          {t("welcome")} <span className="font-medium">{user.name}</span>
          {" · "}<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{roleLabel}</span>
        </p>
      </div>

      {["admin","operator","kepsek","superadmin","kurikulum"].includes(role) && <DashboardAdmin sekolahId={sekolahId} />}
      {role === "guru" && <DashboardGuru sekolahId={sekolahId} userId={userId} />}
      {role === "walikelas" && <DashboardWalikelas sekolahId={sekolahId} userId={userId} />}
      {role === "bk" && <DashboardBk sekolahId={sekolahId} />}
      {role === "bendahara" && <DashboardBendahara sekolahId={sekolahId} />}
      {role === "perpustakaan" && <DashboardPerpustakaan sekolahId={sekolahId} />}
      {role === "kesiswaan" && <DashboardKesiswaan sekolahId={sekolahId} />}
      {role === "humas" && <DashboardHumas sekolahId={sekolahId} />}
      {role === "sarpras" && <DashboardSarpras sekolahId={sekolahId} />}
      {role === "resepsionis" && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label={t("statTamuHariIni")} value={await prisma.tamu.count({ where: { sekolahId } })} href="/surat" />
          <StatCard label={t("statPpdbMenunggu")} value={await prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "baru" } })} href="/ppdb" />
        </div>
      )}

      {!["admin","operator","kepsek","superadmin","kurikulum","guru","walikelas","bk","bendahara","perpustakaan","kesiswaan","humas","sarpras","resepsionis"].includes(role) && (
        <PengumumanFeed sekolahId={sekolahId} audience="staf" />
      )}
    </div>
  );
}
