import { prisma } from "@/lib/prisma";

// Penerjemah dari getTranslations("jadwal"); kunci di bawah namespace "peta.*".
export type T = (key: string, values?: Record<string, string | number>) => string;

export type Stat = { l: string; v: string; small?: string; d?: string };
export type Info = { l: string; v: string };
export type Room = {
  id: string;
  left: string;
  top: string;
  status: "active" | "warn" | "idle" | "busy";
  pulse: boolean;
  label: string;
  tag: string;
  title: string;
  sub: string;
  stats: Stat[];
  info: Info[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};
export type PetaData = { schoolName: string; rooms: Room[]; defaultId: string; startMin: number; endMin: number };

// "07:00"/"07.00"/"0700" → menit. Fallback bila tidak valid.
function parseHM(s: string | null | undefined, fallback: number): number {
  if (!s) return fallback;
  const m = s.match(/(\d{1,2})\D+(\d{1,2})/) ?? s.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return fallback;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return fallback;
  return h * 60 + mi;
}

export async function getPetaData(sekolahId: number, t: T): Promise<PetaData> {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const dueFilter = { OR: [{ tahun: { lt: thisYear } }, { tahun: thisYear, bulan: { lte: thisMonth } }] };

  const [sekolah, ta, setting] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true } }),
    prisma.tahunAjaran.findFirst({ where: { sekolahId, aktif: true }, select: { id: true } }),
    prisma.settingKehadiran.findFirst({ where: { sekolahId }, select: { jamMasuk: true, jamPulang: true } }),
  ]);
  const startMin = parseHM(setting?.jamMasuk, 420);
  const endMin = parseHM(setting?.jamPulang, 870);

  const rombels = await prisma.rombel.findMany({
    where: { sekolahId, ...(ta ? { tahunAjaranId: ta.id } : {}) },
    orderBy: [{ tingkat: { urutan: "asc" } }, { nama: "asc" }],
    take: 3,
    select: { id: true, nama: true, waliGuru: { select: { namaGuru: true } }, tingkat: { select: { nama: true } }, anggota: { select: { siswaId: true } } },
  });
  const allIds = rombels.flatMap((r) => r.anggota.map((a) => a.siswaId));
  const hadirRows = allIds.length
    ? await prisma.kehadiranSiswa.findMany({ where: { siswaId: { in: allIds }, tanggal: today, status: "hadir" }, select: { siswaId: true } })
    : [];
  const hadirSet = new Set(hadirRows.map((h) => h.siswaId));

  const [
    totalSiswa, totalGuru, hadirGuru, waliCount,
    ujianAktif, pesertaUjian, pinjamanAktif, overdue, totalBuku,
    sppDue, ppdbBaru, kasusMonth, activityToday, ujianUpcoming,
  ] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
    prisma.kehadiranGuru.count({ where: { sekolahId, tanggal: today, status: "hadir" } }),
    prisma.rombel.count({ where: { sekolahId, waliGuruId: { not: null }, ...(ta ? { tahunAjaranId: ta.id } : {}) } }),
    prisma.ujian.count({ where: { sekolahId, aktif: true } }),
    prisma.hasilUjian.count({ where: { ujian: { sekolahId, aktif: true } } }),
    prisma.pinjamanBuku.count({ where: { sekolahId, tanggalKembali: null } }),
    prisma.pinjamanBuku.count({ where: { sekolahId, tanggalKembali: null, tanggalPinjam: { lt: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.bukuPerpustakaan.count({ where: { sekolahId } }),
    prisma.tagihanSpp.count({ where: { sekolahId, status: { not: "lunas" }, ...dueFilter } }),
    prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "baru", deletedAt: null } }),
    prisma.kasusSiswa.count({ where: { sekolahId, tanggal: { gte: startOfMonth } } }),
    prisma.auditLog.count({ where: { sekolahId, createdAt: { gte: today } } }),
    prisma.ujian.findFirst({ where: { sekolahId, mulai: { gte: now } }, orderBy: { mulai: "asc" }, select: { judul: true, mulai: true } }),
  ]);

  const guruHadirPct = totalGuru ? Math.round((hadirGuru / totalGuru) * 100) : 0;
  const todoCount = [sppDue, ppdbBaru, kasusMonth, ujianAktif, overdue].filter((n) => n > 0).length;
  const agendaDays = ujianUpcoming?.mulai ? Math.max(0, Math.ceil((ujianUpcoming.mulai.getTime() - now.getTime()) / 86400000)) : null;
  const nearestAgenda = ujianUpcoming?.judul ?? null;

  const CLASS_POS = [["39%", "47%"], ["45%", "47%"], ["61%", "47%"]];
  const rooms: Room[] = [];

  rombels.forEach((r, i) => {
    if (i >= CLASS_POS.length) return;
    const total = r.anggota.length;
    const hadir = r.anggota.filter((a) => hadirSet.has(a.siswaId)).length;
    rooms.push({
      id: `kelas${r.id}`,
      left: CLASS_POS[i][0], top: CLASS_POS[i][1],
      status: hadir > 0 ? "active" : "idle", pulse: hadir > 0,
      label: r.nama,
      tag: hadir > 0 ? t("peta.tagActive") : t("peta.tagNoPresence"),
      title: r.nama,
      sub: r.waliGuru ? t("peta.subWali", { n: r.waliGuru.namaGuru }) : t("peta.subTingkat", { n: r.tingkat?.nama ?? "-" }),
      stats: [
        { l: t("peta.statHadir"), v: String(hadir), small: `/${total}`, d: total > 0 && hadir === total ? t("peta.hadirFull") : t("peta.hadirPartial", { n: Math.max(0, total - hadir) }) },
        { l: t("peta.statJumlah"), v: String(total), small: t("peta.unitSiswa") },
      ],
      info: [
        { l: t("peta.infoWali"), v: r.waliGuru?.namaGuru ?? t("peta.waliNone") },
        { l: t("peta.infoTingkat"), v: r.tingkat?.nama ?? "-" },
      ],
      primaryLabel: t("peta.primaryKelas"), primaryHref: `/rombel/${r.id}`,
      secondaryLabel: t("peta.secPresensi"), secondaryHref: "/presensi",
    });
  });

  rooms.push({
    id: "lab", left: "56%", top: "47%",
    status: ujianAktif > 0 ? "busy" : "idle", pulse: ujianAktif > 0,
    label: ujianAktif > 0 ? t("peta.labLabelCbt") : t("peta.labLabel"),
    tag: ujianAktif > 0 ? t("peta.labTagActive") : t("peta.labTagNone"),
    title: t("peta.labLabel"),
    sub: ujianAktif > 0 ? t("peta.labSubActive", { n: ujianAktif }) : t("peta.labSubNone"),
    stats: [
      { l: t("peta.labStatUjian"), v: String(ujianAktif), small: t("peta.unitSesi") },
      { l: t("peta.labStatPeserta"), v: String(pesertaUjian), small: t("peta.unitSiswa") },
    ],
    info: [{ l: t("peta.labStatus"), v: ujianAktif > 0 ? t("peta.statusBerlangsung") : t("peta.statusIdle") }],
    primaryLabel: t("peta.labPrimary"), primaryHref: "/ujian",
    secondaryLabel: t("peta.labSec"), secondaryHref: "/ujian",
  });

  rooms.push({
    id: "perpus", left: "25%", top: "61%",
    status: pinjamanAktif > 0 ? "active" : "idle", pulse: pinjamanAktif > 0,
    label: t("peta.perpusLabel"),
    tag: pinjamanAktif > 0 ? t("peta.perpusTagOpen") : t("peta.perpusLabel"),
    title: t("peta.perpusLabel"),
    sub: overdue > 0 ? t("peta.perpusSubLate", { n: pinjamanAktif, late: overdue }) : t("peta.perpusSub", { n: pinjamanAktif }),
    stats: [
      { l: t("peta.perpusStatPinjam"), v: String(pinjamanAktif), small: t("peta.unitBuku") },
      { l: t("peta.perpusStatLate"), v: String(overdue), small: t("peta.unitBuku"), d: overdue > 0 ? t("peta.lateNeed") : t("peta.lateOk") },
    ],
    info: [{ l: t("peta.perpusInfoTotal"), v: totalBuku.toLocaleString("id-ID") }],
    primaryLabel: t("peta.perpusPrimary"), primaryHref: "/perpustakaan",
    secondaryLabel: t("peta.perpusSec"), secondaryHref: "/perpustakaan/pinjam",
  });

  rooms.push({
    id: "kepala", left: "39%", top: "61%",
    status: "idle", pulse: false,
    label: t("peta.kepalaLabel"),
    tag: t("peta.kepalaTag"),
    title: t("peta.kepalaTitle"),
    sub: todoCount > 0 ? t("peta.kepalaSub", { n: todoCount }) : t("peta.kepalaSubNone"),
    stats: [
      { l: t("peta.kepalaStatTodo"), v: String(todoCount), small: t("peta.unitHal") },
      { l: t("peta.kepalaStatLog"), v: String(activityToday), small: t("peta.unitLog") },
    ],
    info: [
      { l: t("peta.kepalaInfoAgenda"), v: nearestAgenda ?? t("peta.agendaNone") },
      { l: t("peta.kepalaInfoSiswa"), v: totalSiswa.toLocaleString("id-ID") },
    ],
    primaryLabel: t("peta.kepalaPrimary"), primaryHref: "/dashboard",
    secondaryLabel: t("peta.kepalaSec"), secondaryHref: "/audit",
  });

  rooms.push({
    id: "tu", left: "45%", top: "61%",
    status: sppDue > 0 ? "warn" : "idle", pulse: sppDue > 0,
    label: sppDue > 0 ? t("peta.tuLabelWarn", { n: sppDue }) : t("peta.tuLabel"),
    tag: sppDue > 0 ? t("peta.tuTagWarn") : t("peta.tuTagOk"),
    title: t("peta.tuLabel"),
    sub: sppDue > 0 ? t("peta.tuSubWarn", { n: sppDue }) : t("peta.tuSubOk"),
    stats: [
      { l: t("peta.tuStatSpp"), v: String(sppDue), small: t("peta.unitTagihan") },
      { l: t("peta.tuStatPpdb"), v: String(ppdbBaru), small: t("peta.unitPendaftar") },
    ],
    info: [{ l: t("peta.tuInfoKasus"), v: t("peta.kasusUnit", { n: kasusMonth }) }],
    primaryLabel: t("peta.tuPrimary"), primaryHref: "/spp",
    secondaryLabel: t("peta.tuSec"), secondaryHref: "/ppdb",
  });

  rooms.push({
    id: "guru", left: "56%", top: "61%",
    status: hadirGuru > 0 ? "active" : "idle", pulse: false,
    label: t("peta.guruLabel"),
    tag: t("peta.guruTag"),
    title: t("peta.guruLabel"),
    sub: t("peta.guruSub", { hadir: hadirGuru, total: totalGuru }),
    stats: [
      { l: t("peta.guruStatHadir"), v: String(hadirGuru), small: `/${totalGuru}` },
      { l: t("peta.guruStatWali"), v: String(waliCount), small: t("peta.unitOrang") },
    ],
    info: [{ l: t("peta.guruInfoPct"), v: `${guruHadirPct}%` }],
    primaryLabel: t("peta.guruPrimary"), primaryHref: "/guru",
    secondaryLabel: t("peta.guruSec"), secondaryHref: "/presensi",
  });

  rooms.push({
    id: "kantin", left: "71%", top: "61%",
    status: "idle", pulse: false,
    label: t("peta.kantinLabel"),
    tag: t("peta.kantinTag"),
    title: t("peta.kantinTitle"),
    sub: t("peta.kantinSub"),
    stats: [
      { l: t("peta.kantinStatJam"), v: "09.45", small: "WIB" },
      { l: t("peta.kantinStatStatus"), v: t("peta.kantinStatusVal") },
    ],
    info: [{ l: t("peta.kantinInfo"), v: t("peta.kantinInfoVal") }],
    primaryLabel: t("peta.kantinPrimary"), primaryHref: "/sarpras",
    secondaryLabel: t("peta.kantinSec"), secondaryHref: "/sarpras/kategori",
  });

  rooms.push({
    id: "aula", left: "88%", top: "67%",
    status: agendaDays !== null && agendaDays <= 7 ? "active" : "idle", pulse: agendaDays !== null && agendaDays <= 3,
    label: nearestAgenda ? t("peta.aulaLabel", { ag: nearestAgenda }) : t("peta.aulaLabelNone"),
    tag: t("peta.aulaTag"),
    title: t("peta.aulaTitle"),
    sub: nearestAgenda ? t("peta.aulaSub", { ag: nearestAgenda }) : t("peta.aulaSubNone"),
    stats: [
      { l: t("peta.aulaStatAgenda"), v: agendaDays !== null ? String(agendaDays) : "–", small: agendaDays !== null ? t("peta.unitHariLagi") : "" },
      { l: t("peta.aulaStatSiswa"), v: totalSiswa.toLocaleString("id-ID"), small: "" },
    ],
    info: [{ l: t("peta.aulaInfoAcara"), v: nearestAgenda ?? t("peta.agendaNone") }],
    primaryLabel: t("peta.aulaPrimary"), primaryHref: "/pengumuman",
    secondaryLabel: t("peta.aulaSec"), secondaryHref: "/pengumuman/new",
  });

  return {
    schoolName: sekolah?.nama ?? "Sekolah Anda",
    rooms,
    defaultId: rooms[0]?.id ?? "kepala",
    startMin,
    endMin,
  };
}
