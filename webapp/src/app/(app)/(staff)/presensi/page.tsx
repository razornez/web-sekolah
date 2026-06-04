import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { AttendanceDot } from "./_components/AttendanceDot";

// ─── helpers ────────────────────────────────────────────────────────────────

const HARI_ORDER = ["Senin","Selasa","Rabu","Kamis","Jumat"] as const;
const HARI_DOW: Record<string, number> = { Minggu:0,Senin:1,Selasa:2,Rabu:3,Kamis:4,Jumat:5,Sabtu:6 };

const MAPEL_COLORS = [
  "bg-blue-50 border-blue-300 text-blue-900",
  "bg-emerald-50 border-emerald-300 text-emerald-900",
  "bg-purple-50 border-purple-300 text-purple-900",
  "bg-amber-50 border-amber-300 text-amber-900",
  "bg-rose-50 border-rose-300 text-rose-900",
  "bg-cyan-50 border-cyan-300 text-cyan-900",
  "bg-orange-50 border-orange-300 text-orange-900",
  "bg-teal-50 border-teal-300 text-teal-900",
  "bg-indigo-50 border-indigo-300 text-indigo-900",
  "bg-pink-50 border-pink-300 text-pink-900",
];

function hashColor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return MAPEL_COLORS[h % MAPEL_COLORS.length];
}

// ─── UTC-safe date helpers ────────────────────────────────────────────────────
// Semua operasi tanggal pakai UTC agar konsisten dengan data DB (Prisma @db.Date
// selalu mengembalikan UTC midnight). Menghindari timezone shift di server UTC+7.

/** UTC midnight untuk tanggal yang diberikan */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Monday (UTC midnight) dari minggu yang mengandung d */
function getMonday(d: Date): Date {
  const base = utcMidnight(d);
  const dow = base.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = dow === 0 ? -6 : 1 - dow;
  return new Date(base.getTime() + diff * 86400000);
}

/** Tambah n hari (UTC-safe, 86400000ms per hari) */
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

/** Format "YYYY-MM-DD" dari UTC date — konsisten dengan Prisma @db.Date */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtShort(d: Date) {
  // toLocaleDateString menggunakan local time; UTC+7 July 18 00:00Z = July 18 07:00 local ✓
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function fmtWithYear(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Semua kemunculan hariNama (UTC midnight) antara [from, to] */
function occurrenceDates(hariNama: string, from: Date, to: Date): Date[] {
  const target = HARI_DOW[hariNama] ?? 1;
  const dates: Date[] = [];
  let cur = utcMidnight(from);
  while (cur.getUTCDay() !== target) cur = new Date(cur.getTime() + 86400000);
  while (cur <= to) {
    dates.push(cur);
    cur = new Date(cur.getTime() + 7 * 86400000);
  }
  return dates;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function PresensiPage({
  searchParams,
}: {
  searchParams: Promise<{ jadwalId?: string; week?: string }>;
}) {
  const sekolahId = await requireModule("presensi");
  const sp = await searchParams;
  const jadwalId = Number(sp.jadwalId) || 0;

  // Current week — semua UTC midnight untuk konsistensi
  const today = utcMidnight(new Date());
  const weekParam = sp.week;
  // weekParam = "YYYY-MM-DD" dari isoDate (UTC), parse langsung sebagai UTC midnight
  const monday = weekParam ? utcMidnight(new Date(weekParam)) : getMonday(today);
  const friday = addDays(monday, 4);
  const prevMonday = isoDate(addDays(monday, -7));
  const nextMonday = isoDate(addDays(monday, 7));
  const isCurrentWeek = isoDate(monday) === isoDate(getMonday(today));

  // ── Detail view ──────────────────────────────────────────────────────────
  if (jadwalId > 0) {
    const jadwal = await prisma.jadwalGuru.findFirst({
      where: { id: jadwalId, sekolahId },
      include: {
        guru: { select: { namaGuru: true } },
        hari: { select: { nama: true } },
        rombel: { select: { id: true, nama: true, tahunAjaranId: true } },
      },
    });
    if (!jadwal) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-4xl">🔍</div>
          <p className="mt-3 font-semibold text-red-800">Jadwal tidak ditemukan</p>
          <p className="mt-1 text-sm text-red-600">jadwalId={jadwalId} tidak ada atau bukan milik sekolah ini.</p>
          <Link href="/presensi" className="mt-4 inline-block rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100">← Kembali ke Kalender</Link>
        </div>
      );
    }
    if (!jadwal.rombel) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link href="/presensi" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">← Kalender</Link>
            <h1 className="text-xl font-bold text-gray-900">{jadwal.mapel ?? "—"}</h1>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <div className="text-5xl">🏫</div>
            <p className="mt-3 font-semibold text-amber-800">Jadwal belum memiliki kelas / rombel</p>
            <p className="mt-1 text-sm text-amber-700">
              Jadwal <strong>{jadwal.mapel}</strong> ({jadwal.hari.nama} · {jadwal.jamMulai}–{jadwal.jamSelesai}){" "}
              oleh <strong>{jadwal.guru.namaGuru}</strong> belum dikaitkan ke rombel manapun.
            </p>
            <p className="mt-2 text-sm text-amber-600">Presensi memerlukan daftar siswa dari rombel.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/jadwal" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                ✏️ Edit Jadwal → Tambahkan Kelas
              </Link>
              <Link href="/presensi" className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100">
                ← Kembali
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Students
    const anggota = await prisma.anggotaRombel.findMany({
      where: { rombelId: jadwal.rombel.id },
      orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
      include: { siswa: { select: { id: true, namaLengkap: true } } },
    });

    // Semester boundaries dari Periode aktif
    const periodeAktif = await prisma.periode.findFirst({
      where: { aktif: true, tahunAjaran: { sekolahId } },
      select: { tanggalMulai: true, tanggalSelesai: true, nama: true },
    });

    let semStart: Date;
    let semEnd: Date;

    if (periodeAktif?.tanggalMulai && periodeAktif?.tanggalSelesai) {
      // Gunakan FULL rentang periode — masa depan tampil sebagai lingkaran abu-abu
      semStart = periodeAktif.tanggalMulai;
      semEnd = periodeAktif.tanggalSelesai;
    } else {
      // Fallback: Juli 14 tahun aktif + 16 minggu
      const ta = await prisma.tahunAjaran.findFirst({ where: { sekolahId, aktif: true }, select: { tahun: true } });
      const yr = ta ? parseInt(ta.tahun.slice(0, 4)) : today.getFullYear() - (today.getMonth() < 6 ? 1 : 0);
      semStart = new Date(yr, 6, 14);
      semEnd = addDays(semStart, 16 * 7);
    }

    // Semua kemunculan jadwal dalam semester — jumlah kolom = jumlah pertemuan sesuai kalender akademik
    const dates = occurrenceDates(jadwal.hari.nama, semStart, semEnd);

    // Current week's Monday for highlight
    const thisMonday = getMonday(today);
    const thisFriday = addDays(thisMonday, 4);

    // Fetch all attendance for these students on these dates
    const siswaIds = anggota.map((a) => a.siswa.id);
    const kehadiran = await prisma.kehadiranSiswa.findMany({
      where: {
        sekolahId,
        siswaId: { in: siswaIds },
        tanggal: { gte: dates[0] ?? today, lte: dates[dates.length - 1] ?? today },
      },
      select: { siswaId: true, tanggal: true, status: true },
    });

    // Build lookup: key = "siswaId-YYYY-MM-DD"
    const lookup = new Map<string, string>();
    for (const k of kehadiran) {
      lookup.set(`${k.siswaId}-${isoDate(k.tanggal)}`, k.status);
    }

    // Attendance stats — hanya hitung hari yang sudah lewat (bukan masa depan)
    const pastDates = dates.filter((d) => d <= today);
    const totalCells = anggota.length * pastDates.length;
    const hadirCount = kehadiran.filter((k) => k.status === "hadir" || k.status === "terlambat").length;
    const alpaCount = kehadiran.filter((k) => k.status === "alpa").length;
    const belumCount = totalCells - kehadiran.length;
    const totalPertemuan = dates.length; // seluruh semester termasuk masa depan

    // Persentase kehadiran
    const pctHadir = totalCells > 0 ? Math.round((hadirCount / totalCells) * 100) : 0;
    const izinCount = kehadiran.filter(k => k.status === "izin").length;
    const sakitCount = kehadiran.filter(k => k.status === "sakit").length;
    const terlambatCount = kehadiran.filter(k => k.status === "terlambat").length;

    return (
      <div className="space-y-4 w-full">
        {/* Hero header card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Link href="/presensi" className="mt-0.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">
                  ← Kalender
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white">{jadwal.mapel ?? "—"}</h1>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/80">{jadwal.rombel.nama}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/80">{jadwal.hari.nama} · {jadwal.jamMulai}–{jadwal.jamSelesai}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/80">{jadwal.guru.namaGuru}</span>
                  </div>
                  {dates[0] && (
                    <p className="mt-1 text-xs text-white/50">
                      {dates[0].toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {" "}–{" "}
                      {dates[dates.length - 1]?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {" "}· {anggota.length} siswa · {totalPertemuan} pertemuan
                      {totalPertemuan > pastDates.length && ` (${totalPertemuan - pastDates.length} mendatang)`}
                    </p>
                  )}
                </div>
              </div>

              {/* Persentase kehadiran */}
              <div className="text-right">
                <div className={`text-4xl font-black leading-none ${pctHadir >= 80 ? "text-emerald-400" : pctHadir >= 60 ? "text-amber-400" : "text-red-400"}`}>
                  {pctHadir}%
                </div>
                <div className="text-xs text-white/50 mt-0.5">kehadiran</div>
                <div className="mt-2 h-2 w-24 rounded-full bg-white/20 overflow-hidden ml-auto">
                  <div className={`h-2 rounded-full ${pctHadir >= 80 ? "bg-emerald-400" : pctHadir >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${pctHadir}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-5 divide-x divide-gray-100 border-t border-gray-100">
            {[
              { label: "Hadir",     count: hadirCount,     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
              { label: "Terlambat", count: terlambatCount, bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
              { label: "Izin",      count: izinCount,      bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400" },
              { label: "Sakit",     count: sakitCount,     bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
              { label: "Alpa",      count: alpaCount,      bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} px-3 py-2.5 text-center`}>
                <div className={`text-xl font-black ${s.text} leading-none`}>{s.count}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <span className="text-[10px] text-gray-500">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend + hint */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
          {[
            { color: "bg-emerald-500", label: "Hadir" },
            { color: "bg-amber-400",   label: "Terlambat" },
            { color: "bg-sky-400",     label: "Izin" },
            { color: "bg-violet-400",  label: "Sakit" },
            { color: "bg-red-500",     label: "Alpa" },
            { color: "border-2 border-amber-400 bg-amber-50 animate-pulse", label: "Belum → klik = Hadir" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 shrink-0 rounded-full ${l.color}`} />
              <span>{l.label}</span>
            </div>
          ))}
          <span className="text-gray-400 ml-auto">· Klik dot berwarna → ganti status</span>
        </div>

        {belumCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span><strong>{belumCount}</strong> sel belum diisi — klik dot kuning untuk tandai hadir, atau klik dot berwarna untuk pilih status lain.</span>
          </div>
        )}

        {/* Attendance grid — w-fit shrink ke lebar tabel, overflow-x-auto kalau lebih lebar dari layar */}
        <div className="w-fit max-w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(700, 200 + dates.length * 36) }}>
            <thead>
              {/* Baris 1: Group by BULAN — jauh lebih jelas dari group-by-minggu */}
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-900 px-4 py-2.5 text-left text-xs font-semibold text-white min-w-[200px]">
                  Siswa
                </th>
                {(() => {
                  const groups: { label: string; count: number; hasThisWeek: boolean }[] = [];
                  let curKey = "";
                  for (const d of dates) {
                    // Key = "YYYY-MM" (bulan + tahun)
                    const key = isoDate(d).slice(0, 7);
                    const isCur = d >= thisMonday && d <= thisFriday;
                    if (key !== curKey) {
                      curKey = key;
                      const monthLabel = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
                      groups.push({ label: monthLabel, count: 1, hasThisWeek: isCur });
                    } else {
                      groups[groups.length - 1].count++;
                      if (isCur) groups[groups.length - 1].hasThisWeek = true;
                    }
                  }
                  return groups.map((g, i) => (
                    <th key={i} colSpan={g.count}
                      className={`border-b border-r border-gray-200 px-2 py-1.5 text-center text-[10px] font-bold whitespace-nowrap ${
                        g.hasThisWeek ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}>
                      {g.label}
                    </th>
                  ));
                })()}
              </tr>
              {/* Baris 2: Tanggal sebenarnya dari jadwal (mis. Kam 18) */}
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-800 px-4 py-1.5 text-[10px] text-gray-400 font-medium text-left">
                  No · Nama
                </th>
                {dates.map((d) => {
                  const isToday = isoDate(d) === isoDate(today);
                  const isThisWeek = d >= thisMonday && d <= thisFriday;
                  const isFuture = d > today;
                  const dayName = d.toLocaleDateString("id-ID", { weekday: "short" }).slice(0, 3);
                  return (
                    <th key={isoDate(d)}
                      className={`border-b border-r border-gray-700 py-1.5 px-0.5 text-center text-[10px] font-medium whitespace-nowrap ${
                        isToday ? "bg-indigo-500 text-white font-bold" :
                        isThisWeek ? "bg-indigo-700 text-indigo-100" :
                        isFuture ? "bg-gray-700 text-gray-500" : "bg-gray-800 text-gray-300"
                      }`}
                      style={{ width: 36 }}
                      title={d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    >
                      <div className="text-[9px] opacity-70">{dayName}</div>
                      <div className="font-bold text-[11px]">{d.getUTCDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {anggota.map((a, rowIdx) => (
                <tr key={a.siswa.id} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="sticky left-0 z-10 border-b border-r border-gray-100 px-4 py-2 bg-inherit">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-600">
                        {a.nomorAbsen ?? (rowIdx + 1)}
                      </div>
                      <Link href={`/siswa/${a.siswa.id}`} className="truncate text-xs font-medium text-gray-800 hover:underline">
                        {a.siswa.namaLengkap}
                      </Link>
                    </div>
                  </td>
                  {dates.map((d) => {
                    const dateStr = isoDate(d);
                    const status = (lookup.get(`${a.siswa.id}-${dateStr}`) ?? null) as Parameters<typeof AttendanceDot>[0]["status"];
                    const isFuture = d > today;
                    const isThisWeek = d >= thisMonday && d <= thisFriday;
                    return (
                      <td key={dateStr}
                        className={`border-b border-r border-gray-100 p-0.5 text-center align-middle ${
                          isThisWeek ? "bg-indigo-50/40" : ""
                        }`}
                        style={{ width: 36 }}>
                        <div className="flex items-center justify-center">
                          <AttendanceDot
                            siswaId={a.siswa.id}
                            tanggal={dateStr}
                            status={status}
                            isFuture={isFuture}
                            size="sm"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {anggota.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <div className="text-3xl">👥</div>
              <p className="mt-2 text-sm">Rombel ini belum punya anggota.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Week calendar view ────────────────────────────────────────────────────

  // Fetch semua jadwal untuk sekolah ini
  const allJadwal = await prisma.jadwalGuru.findMany({
    where: { sekolahId },
    include: {
      guru: { select: { id: true, namaGuru: true } },
      hari: { select: { nama: true, urutan: true } },
      rombel: { select: { id: true, nama: true } },
    },
    orderBy: [{ hari: { urutan: "asc" } }, { jamMulai: "asc" }],
  });

  // Group jadwal by hari name
  const byHari: Record<string, typeof allJadwal> = {};
  for (const j of allJadwal) {
    (byHari[j.hari.nama] ??= []).push(j);
  }

  // Color map per mapel
  const allMapel = [...new Set(allJadwal.map((j) => j.mapel ?? ""))];
  const colorMap: Record<string, string> = {};
  allMapel.forEach((m, i) => { colorMap[m] = MAPEL_COLORS[i % MAPEL_COLORS.length]; });

  // Today's attendance counts per rombel (for today's date)
  const todayStr = isoDate(today);
  const todayJadwal = byHari[HARI_ORDER.find((h) => getMonday(today) && true) ?? ""];
  const todayHariName = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][today.getDay()];
  const todaySlots = byHari[todayHariName] ?? [];
  const todayRombelIds = [...new Set(todaySlots.map((j) => j.rombel?.id).filter(Boolean) as number[])];

  // Fetch today's attendance counts
  const [memberCounts, todayDone] = await Promise.all([
    todayRombelIds.length > 0
      ? prisma.anggotaRombel.groupBy({ by: ["rombelId"], where: { rombelId: { in: todayRombelIds } }, _count: { _all: true } })
      : Promise.resolve([]),
    todayRombelIds.length > 0
      ? prisma.kehadiranSiswa.findMany({
          where: { sekolahId, tanggal: today, siswa: { anggotaRombel: { some: { rombelId: { in: todayRombelIds } } } } },
          select: { siswaId: true, siswa: { select: { anggotaRombel: { where: { rombelId: { in: todayRombelIds } }, select: { rombelId: true } } } } },
        })
      : Promise.resolve([]),
  ]);

  const totalPerRombel = new Map(memberCounts.map((m) => [m.rombelId, m._count._all]));
  const donePerRombel = new Map<number, number>();
  for (const rec of todayDone) {
    for (const ar of rec.siswa.anggotaRombel) {
      donePerRombel.set(ar.rombelId, (donePerRombel.get(ar.rombelId) ?? 0) + 1);
    }
  }

  const isThisWeek = isoDate(monday) === isoDate(getMonday(today));
  // Tampilkan rentang minggu dengan tahun — jika span dua tahun tampilkan keduanya
  const rangeLabel = monday.getFullYear() === friday.getFullYear()
    ? `${fmtShort(monday)} – ${fmtWithYear(friday)}`
    : `${fmtWithYear(monday)} – ${fmtWithYear(friday)}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Presensi Siswa</h1>
          <p className="text-sm text-gray-500">
            {isThisWeek ? "Minggu Ini · " : ""}{rangeLabel}
          </p>
        </div>
        {/* Week nav */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <Link href={`/presensi?week=${prevMonday}`} className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">←</Link>
          {!isThisWeek && (
            <Link href="/presensi" className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">Minggu Ini</Link>
          )}
          <Link href={`/presensi?week=${nextMonday}`} className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">→</Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-5 gap-3">
        {HARI_ORDER.map((hariNama, idx) => {
          const date = addDays(monday, idx);
          const dateStr = isoDate(date);
          const isToday = dateStr === todayStr;
          const isPast = date < today;
          const isFuture = date > today;
          const slots = byHari[hariNama] ?? [];

          return (
            <div key={hariNama}
              className={`flex flex-col rounded-2xl border overflow-hidden transition-all ${
                isToday
                  ? "border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200"
                  : isFuture
                  ? "border-gray-100 opacity-70"
                  : "border-gray-200"
              }`}
            >
              {/* Day header */}
              <div className={`px-3 py-2.5 text-center ${
                isToday ? "bg-indigo-600 text-white" : isFuture ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-gray-700"
              }`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-indigo-100" : ""}`}>
                  {hariNama}
                </div>
                <div className={`mt-0.5 text-lg font-black leading-none ${isToday ? "text-white" : ""}`}>
                  {date.getDate()}
                </div>
                <div className={`text-[10px] ${isToday ? "text-indigo-200" : "text-gray-400"}`}>
                  {date.toLocaleDateString("id-ID", { month: "short" })}
                </div>
                {isToday && (
                  <div className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    HARI INI
                  </div>
                )}
              </div>

              {/* Slots */}
              <div className="flex-1 space-y-2 bg-white p-2">
                {slots.length === 0 ? (
                  <div className="flex h-16 items-center justify-center text-xs text-gray-300">
                    —
                  </div>
                ) : (
                  slots.map((j) => {
                    const rombelId = j.rombel?.id;
                    const total = rombelId ? (totalPerRombel.get(rombelId) ?? 0) : 0;
                    const done = rombelId ? (donePerRombel.get(rombelId) ?? 0) : 0;
                    const belum = total - done;
                    const allDone = isToday && total > 0 && belum === 0;
                    const hasUndone = isToday && belum > 0;

                    return (
                      <Link key={j.id} href={`/presensi?jadwalId=${j.id}`}
                        className={`block rounded-xl border p-2.5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                          colorMap[j.mapel ?? ""] ?? MAPEL_COLORS[0]
                        }`}
                      >
                        {/* Time */}
                        <div className="font-mono text-[10px] font-medium opacity-60">
                          {j.jamMulai ?? "—"}–{j.jamSelesai ?? "—"}
                        </div>
                        {/* Mapel */}
                        <div className="mt-0.5 font-bold text-xs leading-tight line-clamp-2">
                          {j.mapel ?? "—"}
                        </div>
                        {/* Rombel */}
                        {j.rombel && (
                          <div className="mt-1 text-[10px] opacity-70 font-medium">
                            {j.rombel.nama}
                          </div>
                        )}
                        {/* Attendance status badge (only today) */}
                        {isToday && total > 0 && (
                          <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            allDone ? "bg-emerald-500 text-white" :
                            hasUndone ? "bg-amber-400 text-white animate-pulse" :
                            "bg-white/50 text-current"
                          }`}>
                            {allDone ? "✓ Selesai" : `${belum} blm`}
                          </div>
                        )}
                        {/* Guru */}
                        <div className="mt-1 text-[10px] opacity-50 truncate">
                          {j.guru.namaGuru.split(" ").slice(-2).join(" ")}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allJadwal.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-4xl">📅</div>
          <p className="mt-3 text-sm text-gray-500">Belum ada jadwal mengajar yang tersedia.</p>
          <Link href="/jadwal" className="mt-3 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">
            Buat Jadwal
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Keterangan dot:</span>
        {[
          { color: "bg-emerald-500", label: "Hadir" },
          { color: "bg-amber-400",   label: "Terlambat" },
          { color: "bg-sky-400",     label: "Izin" },
          { color: "bg-violet-400",  label: "Sakit" },
          { color: "bg-red-500",     label: "Alpa" },
          { color: "border-2 border-amber-400 bg-amber-50 animate-pulse", label: "Belum diisi (klik → Hadir)" },
          { color: "bg-gray-100 border border-dashed border-gray-300", label: "Belum terjadwal" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-3.5 w-3.5 shrink-0 rounded-full ${l.color}`} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
