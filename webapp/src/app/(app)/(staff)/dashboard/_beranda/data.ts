import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Penerjemah dari getTranslations("dashboard"); semua kunci di bawah namespace "ak.*".
export type T = (key: string, values?: Record<string, string | number>) => string;

// ── Tipe ──────────────────────────────────────────────────────────────────────
export type Jenjang = { nama: string; L: number; P: number; total: number };
export type Dept = { label: string; value: number; pct: number; color: string };
export type AgendaEvt = { title: string; days: number; soon: boolean; when: string };
export type TodoItem = { title: string; sub: string; href: string; icon: TodoIcon; color: "mint" | "peach" | "lav" | "sky" };
export type TodoIcon = "spp" | "ppdb" | "bk" | "ujian" | "perpus" | "ok";
export type Activity = { initials: string; name: string; rest: string; ctx: string; time: string; color: string };
type TodoKind = "spp" | "ppdb" | "bk" | "ujian" | "perpus";

export type BerandaData = Awaited<ReturnType<typeof getBerandaData>>;

function relWaktu(d: Date, t: T): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("ak.timeNow");
  if (m < 60) return t("ak.timeMin", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("ak.timeHour", { n: h });
  const days = Math.floor(h / 24);
  if (days < 7) return t("ak.timeDay", { n: days });
  return t("ak.timeWeek", { n: Math.floor(days / 7) });
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function jakartaClock() {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const hour = Number(p.find((x) => x.type === "hour")?.value ?? "0");
  const minute = Number(p.find((x) => x.type === "minute")?.value ?? "0");
  return { hour, minute };
}

// Parse "07:00" / "07.00" / "0700" → menit sejak tengah malam. Fallback bila tidak valid.
export function parseHM(s: string | null | undefined, fallback: number): number {
  if (!s) return fallback;
  const m = s.match(/(\d{1,2})\D+(\d{1,2})/) ?? s.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return fallback;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return fallback;
  return h * 60 + mi;
}
export const fmtHM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}.${String(min % 60).padStart(2, "0")}`;

function buildHeading(name: string, t: T, startMin: number, endMin: number) {
  const { hour, minute } = jakartaClock();
  const greeting = hour < 11 ? t("ak.greetingPagi") : hour < 15 ? t("ak.greetingSiang") : hour < 18 ? t("ak.greetingSore") : t("ak.greetingMalam");
  const mins = hour * 60 + minute;
  const periods = 8;
  let eyebrow: string;
  let note: string;
  if (mins >= startMin && mins < endMin) {
    const per = Math.max(1, Math.floor((endMin - startMin) / periods));
    const jamKe = Math.min(periods, Math.floor((mins - startMin) / per) + 1);
    const sisaJam = Math.max(1, Math.round((endMin - mins) / 60));
    eyebrow = t("ak.eyebrowInClass", { n: jamKe });
    note = t("ak.noteInClass", { h: sisaJam, jam: fmtHM(endMin) });
  } else if (mins < startMin) {
    eyebrow = t("ak.eyebrowBefore");
    note = t("ak.noteBefore", { jam: fmtHM(startMin) });
  } else {
    eyebrow = t("ak.eyebrowAfter");
    note = t("ak.noteAfter");
  }
  return { greeting: `${greeting}, ${name || t("ak.greetingFallback")}`, eyebrow, note };
}

const KEL_KEY: Record<string, string> = { A: "ak.kelA", B: "ak.kelB", C: "ak.kelC", lintasminat: "ak.kelLintas", muatanlokal: "ak.kelMulok", lainnya: "ak.kelNone" };
const AKSI_KEY: Record<string, string> = { create: "ak.aksiCreate", update: "ak.aksiUpdate", delete: "ak.aksiDelete", login: "ak.aksiLogin" };
const ENT_KEY: Record<string, string> = {
  siswa: "ak.entSiswa", guru: "ak.entGuru", nilai: "ak.entNilai", spp: "ak.entSpp", presensi: "ak.entPresensi",
  ppdb: "ak.entPpdb", pengumuman: "ak.entPengumuman", rombel: "ak.entRombel", ujian: "ak.entUjian", tugas: "ak.entTugas",
  bk: "ak.entBk", perpustakaan: "ak.entPerpustakaan", rapor: "ak.entRapor", jadwal: "ak.entJadwal",
};
const TODO_TITLE: Record<TodoKind, string> = { spp: "ak.todoSppTitle", ppdb: "ak.todoPpdbTitle", bk: "ak.todoBkTitle", ujian: "ak.todoUjianTitle", perpus: "ak.todoPerpusTitle" };
const TODO_SUB: Record<TodoKind, string> = { spp: "ak.todoSppSub", ppdb: "ak.todoPpdbSub", bk: "ak.todoBkSub", ujian: "ak.todoUjianSub", perpus: "ak.todoPerpusSub" };
const TODO_META: Record<TodoKind, { href: string; icon: TodoIcon; color: "mint" | "peach" | "lav" | "sky" }> = {
  spp: { href: "/spp", icon: "spp", color: "peach" },
  ppdb: { href: "/ppdb", icon: "ppdb", color: "sky" },
  bk: { href: "/bk", icon: "bk", color: "mint" },
  ujian: { href: "/ujian", icon: "ujian", color: "lav" },
  perpus: { href: "/perpustakaan/pinjam", icon: "perpus", color: "peach" },
};
const PALETTE = ["#5B4FE9", "#7E6FE8", "#3E7BC9", "#2EA171", "#E07650", "#C68A1C"];
const TAV = ["lav", "sun", "mint", "peach", "pink", "sky"];

// ── DB layer (di-cache 60s per sekolah; hasilnya serializable & bebas-locale) ────
type AgendaRaw =
  | { kind: "ujian"; dateISO: string; judul: string; mapel: string | null }
  | { kind: "spp"; dateISO: string }
  | { kind: "periode"; dateISO: string; nama: string };

const getBerandaRaw = unstable_cache(
  async (sekolahId: number) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    const dueFilter = { OR: [{ tahun: { lt: thisYear } }, { tahun: thisYear, bulan: { lte: thisMonth } }] };

    const [ta, setting] = await Promise.all([
      prisma.tahunAjaran.findFirst({ where: { sekolahId, aktif: true }, select: { id: true, tahun: true } }),
      prisma.settingKehadiran.findFirst({ where: { sekolahId }, select: { jamMasuk: true, jamPulang: true } }),
    ]);

    // Siswa
    const [totalSiswa, genderG, growth, anggota] = await Promise.all([
      prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
      prisma.siswa.groupBy({ by: ["jenisKelamin"], where: { sekolahId, status: "aktif" }, _count: true }),
      prisma.siswa.count({ where: { sekolahId, createdAt: { gte: startOfMonth } } }),
      prisma.anggotaRombel.findMany({
        where: { siswa: { sekolahId, status: "aktif" }, rombel: ta ? { tahunAjaranId: ta.id } : { sekolahId } },
        select: { siswa: { select: { jenisKelamin: true } }, rombel: { select: { tingkat: { select: { nama: true, urutan: true } } } } },
      }),
    ]);
    const L = genderG.find((g) => g.jenisKelamin === "L")?._count ?? 0;
    const P = genderG.find((g) => g.jenisKelamin === "P")?._count ?? 0;
    const totalLP = L + P;
    const pctL = totalLP ? Math.round((L / totalLP) * 100) : 0;
    const pctP = totalLP ? 100 - pctL : 0;

    const jmap = new Map<number, { tingkat: string; urutan: number; L: number; P: number; total: number }>();
    for (const a of anggota) {
      const tk = a.rombel.tingkat;
      if (!tk) continue;
      const row = jmap.get(tk.urutan) ?? { tingkat: tk.nama, urutan: tk.urutan, L: 0, P: 0, total: 0 };
      if (a.siswa.jenisKelamin === "L") row.L++;
      else if (a.siswa.jenisKelamin === "P") row.P++;
      row.total++;
      jmap.set(tk.urutan, row);
    }
    const jenjang = [...jmap.values()].sort((a, b) => a.urutan - b.urutan);

    // Guru
    const [totalGuru, hadirGuruG, gurus, waliCount] = await Promise.all([
      prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
      prisma.kehadiranGuru.groupBy({ by: ["status"], where: { sekolahId, tanggal: today }, _count: true }),
      prisma.guru.findMany({
        where: { sekolahId, deletedAt: null },
        select: {
          id: true,
          mapelDiampu: { select: { kelompok: true } },
          mapelHistory: { where: { aktif: true }, select: { mapel: { select: { kelompok: true } } } },
        },
      }),
      prisma.rombel.count({ where: { sekolahId, waliGuruId: { not: null }, ...(ta ? { tahunAjaranId: ta.id } : {}) } }),
    ]);
    const hadirGuru = hadirGuruG.find((g) => g.status === "hadir")?._count ?? 0;
    const markedGuru = hadirGuruG.reduce((s, g) => s + g._count, 0);
    const guruHadirPct = totalGuru ? Math.round((hadirGuru / totalGuru) * 100) : 0;

    const kelompokSet: Record<string, Set<number>> = {};
    for (const g of gurus) {
      const ks = new Set<string>();
      for (const m of g.mapelDiampu) ks.add(m.kelompok as string);
      for (const mh of g.mapelHistory) if (mh.mapel?.kelompok) ks.add(mh.mapel.kelompok as string);
      if (ks.size === 0) (kelompokSet["lainnya"] ??= new Set()).add(g.id);
      else for (const k of ks) (kelompokSet[k] ??= new Set()).add(g.id);
    }
    const deptCounts = Object.entries(kelompokSet).map(([key, set]) => ({ key, value: set.size })).sort((a, b) => b.value - a.value);
    const maxDept = Math.max(1, ...deptCounts.map((d) => d.value));
    const depts = deptCounts.map((d, i) => ({ key: d.key, value: d.value, pct: Math.round((d.value / maxDept) * 100), color: PALETTE[i % PALETTE.length] }));

    // Agenda
    const [ujianUpcoming, sppThisMonth, periodeAktif] = await Promise.all([
      prisma.ujian.findMany({ where: { sekolahId, mulai: { gte: now } }, orderBy: { mulai: "asc" }, take: 4, select: { judul: true, mulai: true, mapel: true } }),
      prisma.tagihanSpp.count({ where: { sekolahId, tahun: thisYear, bulan: thisMonth } }),
      prisma.periode.findFirst({ where: { tahunAjaran: { sekolahId }, aktif: true, tanggalSelesai: { gte: today } }, select: { nama: true, tanggalSelesai: true } }),
    ]);
    const agendaItems: { d: Date; raw: AgendaRaw }[] = [];
    for (const u of ujianUpcoming) if (u.mulai) agendaItems.push({ d: u.mulai, raw: { kind: "ujian", dateISO: u.mulai.toISOString(), judul: u.judul, mapel: u.mapel } });
    if (sppThisMonth > 0) {
      const endMonth = new Date(thisYear, thisMonth, 0, 23, 59, 0);
      if (endMonth >= now) agendaItems.push({ d: endMonth, raw: { kind: "spp", dateISO: endMonth.toISOString() } });
    }
    if (periodeAktif?.tanggalSelesai) agendaItems.push({ d: periodeAktif.tanggalSelesai, raw: { kind: "periode", dateISO: periodeAktif.tanggalSelesai.toISOString(), nama: periodeAktif.nama } });
    agendaItems.sort((a, b) => a.d.getTime() - b.d.getTime());
    const agendaRaw: AgendaRaw[] = agendaItems.slice(0, 4).map((x) => x.raw);

    // To-do
    const [sppDue, ppdbBaru, kasusMonth, ujianAktif, perpusOverdue] = await Promise.all([
      prisma.tagihanSpp.count({ where: { sekolahId, status: { not: "lunas" }, ...dueFilter } }),
      prisma.pendaftaranPpdb.count({ where: { sekolahId, status: "baru", deletedAt: null } }),
      prisma.kasusSiswa.count({ where: { sekolahId, tanggal: { gte: startOfMonth } } }),
      prisma.ujian.count({ where: { sekolahId, aktif: true } }),
      prisma.pinjamanBuku.count({ where: { sekolahId, tanggalKembali: null, tanggalPinjam: { lt: new Date(Date.now() - 7 * 86400000) } } }),
    ]);
    const todosRaw: { kind: TodoKind; count: number }[] = (
      [
        { kind: "spp" as const, count: sppDue },
        { kind: "ppdb" as const, count: ppdbBaru },
        { kind: "bk" as const, count: kasusMonth },
        { kind: "ujian" as const, count: ujianAktif },
        { kind: "perpus" as const, count: perpusOverdue },
      ]
    ).filter((x) => x.count > 0).slice(0, 3);

    // Aktivitas
    const logs = await prisma.auditLog.findMany({
      where: { sekolahId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { userName: true, aksi: true, entitas: true, detail: true, createdAt: true },
    });
    const activitiesRaw = logs.map((l) => ({ userName: l.userName, aksi: l.aksi, entitas: l.entitas, detail: l.detail ?? null, createdAtISO: l.createdAt.toISOString() }));

    // Kehadiran siswa hari ini
    const hadirSiswaG = await prisma.kehadiranSiswa.groupBy({ by: ["status"], where: { sekolahId, tanggal: today }, _count: true });
    const hadirSiswa = hadirSiswaG.find((g) => g.status === "hadir")?._count ?? 0;
    const markedSiswa = hadirSiswaG.reduce((s, g) => s + g._count, 0);
    const kehadiranPct = markedSiswa > 0 ? Math.round((hadirSiswa / markedSiswa) * 100) : null;

    return {
      startMin: parseHM(setting?.jamMasuk, 420),
      endMin: parseHM(setting?.jamPulang, 870),
      tahun: ta?.tahun ?? null,
      siswa: { total: totalSiswa, L, P, pctL, pctP, growth, balanced: Math.abs(pctL - 50) <= 5, jenjang },
      guru: { total: totalGuru, hadir: hadirGuru, markedGuru, guruHadirPct, waliCount, depts },
      agendaRaw,
      todosRaw,
      activitiesRaw,
      kehadiranPct,
      sppDue,
    };
  },
  ["beranda-raw-v1"],
  { revalidate: 60, tags: ["beranda"] },
);

// ── Wrapper: terjemahkan + hitung yang bergantung waktu (live) ───────────────────
export async function getBerandaData(sekolahId: number, userName: string, t: T, locale: string) {
  const raw = await getBerandaRaw(sekolahId);
  const now = Date.now();
  const monthName = new Intl.DateTimeFormat(locale, { month: "long" });
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "long" });

  const jenjang: Jenjang[] = raw.siswa.jenjang.map((j) => ({ nama: `${t("ak.classPrefix")} ${j.tingkat}`, L: j.L, P: j.P, total: j.total }));
  const depts: Dept[] = raw.guru.depts.map((d) => ({ label: t(KEL_KEY[d.key] ?? "ak.kelNone"), value: d.value, pct: d.pct, color: d.color }));

  const agenda: AgendaEvt[] = raw.agendaRaw.map((e) => {
    const date = new Date(e.dateISO);
    const days = Math.max(0, Math.ceil((date.getTime() - now) / 86400000));
    const jam = date.getHours().toString().padStart(2, "0") + "." + date.getMinutes().toString().padStart(2, "0");
    const meta = e.kind === "ujian" ? (e.mapel ? t("ak.agUjianMapel", { mapel: e.mapel }) : t("ak.agUjian")) : e.kind === "spp" ? t("ak.agSppMeta") : t("ak.agKalender");
    const title = e.kind === "ujian" ? e.judul : e.kind === "spp" ? t("ak.agSppTitle", { bulan: monthName.format(date) }) : t("ak.agPeriodeTitle", { nama: e.nama });
    return { title, days, soon: days <= 3, when: `${weekdayName.format(date)} · ${jam} · ${meta}` };
  });

  const todos: TodoItem[] = raw.todosRaw.map((td) => ({
    title: t(TODO_TITLE[td.kind], { n: td.count }),
    sub: t(TODO_SUB[td.kind]),
    ...TODO_META[td.kind],
  }));

  const activities: Activity[] = raw.activitiesRaw.map((l, i) => {
    const verb = AKSI_KEY[l.aksi] ? t(AKSI_KEY[l.aksi]) : l.aksi;
    const ent = ENT_KEY[l.entitas] ? t(ENT_KEY[l.entitas]) : l.entitas;
    return {
      initials: initials(l.userName),
      name: l.userName,
      rest: l.aksi === "login" ? verb : `${verb} ${ent}`,
      ctx: l.detail ?? "",
      time: relWaktu(new Date(l.createdAtISO), t),
      color: TAV[i % TAV.length],
    };
  });

  return {
    heading: buildHeading(userName, t, raw.startMin, raw.endMin),
    tahun: raw.tahun,
    siswa: { total: raw.siswa.total, L: raw.siswa.L, P: raw.siswa.P, pctL: raw.siswa.pctL, pctP: raw.siswa.pctP, growth: raw.siswa.growth, balanced: raw.siswa.balanced, jenjang },
    guru: { total: raw.guru.total, hadir: raw.guru.hadir, markedGuru: raw.guru.markedGuru, guruHadirPct: raw.guru.guruHadirPct, waliCount: raw.guru.waliCount, depts },
    agenda,
    todos,
    activities,
    kehadiranPct: raw.kehadiranPct,
    counts: { sppDue: raw.sppDue, agendaCount: agenda.length },
  };
}
