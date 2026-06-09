import { prisma } from "@/lib/prisma";
import { zodiakFromDate, numerologi, bmi, type Zodiak, type Bmi } from "../_lib/persona";

export const inisial = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "··";

const RADAR_AXES = [
  { key: "Sains", kw: ["fisika", "kimia", "biologi", "ipa", "alam"] },
  { key: "Matematika", kw: ["matematika", "mtk"] },
  { key: "Bahasa", kw: ["bahasa", "inggris", "indonesia", "sastra", "arab"] },
  { key: "Sosial", kw: ["sosial", "ips", "ekonomi", "geografi", "sejarah", "sosiologi", "pkn", "pancasila"] },
  { key: "Seni", kw: ["seni", "musik", "budaya", "prakarya"] },
  { key: "Olahraga", kw: ["jasmani", "olahraga", "penjas", "pjok", "kesehatan"] },
];
function axisOf(nama: string): string | null {
  const n = nama.toLowerCase();
  for (const a of RADAR_AXES) if (a.kw.some((k) => n.includes(k))) return a.key;
  return null;
}

export type DetailRapor = { periodeId: number; taId: number; periode: string; tahun: string; urutan: number; avg: number; items: { mapel: string; nilai: number; kkm: number; deskripsi: string | null }[] };
const MIPA_AX = ["Sains", "Matematika"], BASOS_AX = ["Bahasa", "Sosial"];
const shortTA = (t: string) => t.split("/").map((y) => y.slice(2)).join("/");
export type SiswaDetail = {
  id: number; nama: string; inisial: string; nisn: string; nis: string; noInduk: string;
  jk: "L" | "P" | null; status: string; foto: string | null;
  kelas: string; tingkat: string; fase: string | null; waliKelas: string | null; absen: number | null;
  ttl: string; alamat: string | null; transportasi: string | null; tinggalDengan: string | null;
  tinggi: number; berat: number;
  prestasiCount: number; beasiswa: string | null;
  metrics: { rata: number | null; hadirPct: number | null; rank: number | null; rankTotal: number | null; sppStatus: string; bmi: Bmi | null; pelanggaran: number };
  distanceKm: number | null;
  geo: { sLat: number; sLng: number; schLat: number; schLng: number } | null;
  kasus: { count: number; poin: number; list: { nama: string; poin: number; tanggal: string }[] };
  zodiak: Zodiak | null; numero: { angka: number; sifat: string; tags: string[] } | null;
  line: { label: string; mipa: number | null; basos: number | null; kelas: number | null }[];
  lineInsight: { delta: number; naik: boolean; tahun: number } | null;
  lineLegend: { mipa: number | null; basos: number | null; kelas: number | null };
  strongest: { nama: string; nilai: number }[];
  radar: { axis: string; value: number }[];
  radarTags: string[];
  journey: { year: string; semester: string; rombel: string; absen: number | null; rata: number | null; status: "past" | "current" | "future"; note: string }[];
  rapor: DetailRapor[];
  heatmap: { date: string; status: string }[];
  hadirStats: { hadir: number; izin: number; sakit: number; alpa: number };
  spp: { bulan: number; status: string; nominal: number }[];
  prestasi: { nama: string; tingkat: string | null; tahun: string | null }[];
  parents: { tipe: string; nama: string; pekerjaan: string | null; pendidikan: string | null; penghasilan: string | null; noHp: string | null }[];
};

const BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const fmtTgl = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`;
/** Tahun mulai dari string TA "2024/2025" → 2024 (untuk urutan kronologis, bukan urut id). */
const yrOf = (t?: string | null) => parseInt((t ?? "").slice(0, 4), 10) || 0;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getSiswaDetail(id: number, sekolahId: number): Promise<SiswaDetail | null> {
  const s = await prisma.siswa.findFirst({
    where: { id, sekolahId, deletedAt: null },
    include: {
      anggotaRombel: { orderBy: { id: "desc" }, include: { rombel: { include: { tingkat: true, tahunAjaran: true, waliGuru: { select: { namaGuru: true } } } } } },
      orangTuaWali: { orderBy: { id: "asc" } },
      prestasi: { orderBy: [{ tanggal: "desc" }, { id: "desc" }] },
      beasiswa: { orderBy: { id: "desc" } },
      tagihanSpp: { include: { jenis: { select: { nama: true } } }, orderBy: [{ tahun: "desc" }, { bulan: "asc" }] },
      nilaiRapor: { where: { nilaiAkhir: { not: null } }, include: { mapel: { select: { namaMapel: true, kkm: true } }, periode: { select: { nama: true, urutan: true, tahunAjaranId: true, tahunAjaran: { select: { tahun: true } } } } } },
    },
  });
  if (!s) return null;

  // "Kelas sekarang" = anggota di TA aktif; fallback ke tahun terbaru, lalu id terbaru.
  const cur = s.anggotaRombel.find((ar) => ar.rombel?.tahunAjaran?.aktif)
    ?? [...s.anggotaRombel].sort((a, b) => yrOf(b.rombel?.tahunAjaran?.tahun) - yrOf(a.rombel?.tahunAjaran?.tahun))[0];
  const curRombelId = cur?.rombelId ?? null;
  const tinggi = Number(s.tinggiBadan) || 0;
  const berat = Number(s.beratBadan) || 0;

  // ── kehadiran (heatmap + stats) ──
  const since = new Date(); since.setDate(since.getDate() - 364);
  const [kehadiran, hadirGroups, rankRows] = await Promise.all([
    prisma.kehadiranSiswa.findMany({ where: { siswaId: id, tanggal: { gte: since } }, select: { tanggal: true, status: true }, orderBy: { tanggal: "asc" } }),
    prisma.kehadiranSiswa.groupBy({ by: ["status"], where: { siswaId: id }, _count: { _all: true } }),
    curRombelId
      ? prisma.nilaiRapor.groupBy({ by: ["siswaId"], where: { nilaiAkhir: { not: null }, siswa: { anggotaRombel: { some: { rombelId: curRombelId } } } }, _avg: { nilaiAkhir: true } })
      : Promise.resolve([] as { siswaId: number; _avg: { nilaiAkhir: number | null } }[]),
  ]);

  const stuRombelIds = s.anggotaRombel.map((a) => a.rombelId);
  const stuPeriodeIds = [...new Set(s.nilaiRapor.map((n) => n.periodeId))];
  const [sekolahCoord, kasusRows, tingkatList, cohort] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { lat: true, lng: true } }),
    prisma.kasusSiswa.findMany({ where: { siswaId: id }, orderBy: { tanggal: "desc" }, select: { namaKasus: true, poin: true, tanggal: true } }),
    prisma.tingkat.findMany({ where: { sekolahId }, select: { nama: true, urutan: true }, orderBy: { urutan: "asc" } }),
    stuRombelIds.length ? prisma.anggotaRombel.findMany({ where: { rombelId: { in: stuRombelIds } }, select: { siswaId: true } }) : Promise.resolve([] as { siswaId: number }[]),
  ]);
  // Rata-rata kelas (cohort) per periode — untuk garis pembanding di grafik
  const cohortIds = [...new Set(cohort.map((c) => c.siswaId))];
  const classAvgRows = cohortIds.length && stuPeriodeIds.length
    ? await prisma.nilaiRapor.groupBy({ by: ["periodeId"], where: { siswaId: { in: cohortIds }, periodeId: { in: stuPeriodeIds }, nilaiAkhir: { not: null } }, _avg: { nilaiAkhir: true } })
    : [];
  const classAvgByPeriode = new Map(classAvgRows.map((r) => [r.periodeId, r._avg.nilaiAkhir != null ? Math.round(r._avg.nilaiAkhir) : null]));
  const kasusPoin = kasusRows.reduce((a, b) => a + b.poin, 0);
  const hasGeo = s.lat != null && s.lng != null && sekolahCoord?.lat != null && sekolahCoord?.lng != null;
  const distanceKm = hasGeo ? Math.round(haversineKm(s.lat!, s.lng!, sekolahCoord!.lat!, sekolahCoord!.lng!) * 10) / 10 : null;
  const geo = hasGeo ? { sLat: s.lat!, sLng: s.lng!, schLat: sekolahCoord!.lat!, schLng: sekolahCoord!.lng! } : null;

  const hg = (st: string) => hadirGroups.find((g) => g.status === st)?._count._all ?? 0;
  const hadirStats = { hadir: hg("hadir") + hg("terlambat"), izin: hg("izin"), sakit: hg("sakit"), alpa: hg("alpa") };
  const totalHadir = hadirStats.hadir + hadirStats.izin + hadirStats.sakit + hadirStats.alpa;
  const hadirPct = totalHadir > 0 ? Math.round((hadirStats.hadir / totalHadir) * 100) : null;
  const heatmap = kehadiran.map((k) => ({ date: k.tanggal.toISOString().slice(0, 10), status: k.status }));

  // ── nilai: rata², rapor per periode, line, radar ──
  const allNilai = s.nilaiRapor;
  const rata = allNilai.length ? Math.round(allNilai.reduce((a, b) => a + (b.nilaiAkhir ?? 0), 0) / allNilai.length) : null;

  const perPeriode = new Map<number, DetailRapor>();
  const axisAgg = new Map<string, { sum: number; n: number }>();
  for (const n of allNilai) {
    const key = n.periodeId;
    const e = perPeriode.get(key) ?? { periodeId: key, taId: n.periode.tahunAjaranId, periode: n.periode.nama, tahun: n.periode.tahunAjaran?.tahun ?? "", urutan: (yrOf(n.periode.tahunAjaran?.tahun) * 10) + n.periode.urutan, avg: 0, items: [] };
    e.items.push({ mapel: n.mapel.namaMapel, nilai: n.nilaiAkhir ?? 0, kkm: n.mapel.kkm, deskripsi: n.deskripsiCapaian });
    perPeriode.set(key, e);
    const ax = axisOf(n.mapel.namaMapel);
    if (ax) { const a = axisAgg.get(ax) ?? { sum: 0, n: 0 }; a.sum += n.nilaiAkhir ?? 0; a.n++; axisAgg.set(ax, a); }
  }
  const rapor = [...perPeriode.values()].map((r) => ({ ...r, avg: r.items.length ? Math.round(r.items.reduce((a, b) => a + b.nilai, 0) / r.items.length) : 0 })).sort((a, b) => b.urutan - a.urutan);

  // grafik tren: 3 seri (MIPA, Bahasa & Sosial, Rata-rata kelas) untuk ≤4 semester terbaru
  const grpAvg = (items: { mapel: string; nilai: number }[], axes: string[]) => {
    const vs = items.filter((it) => { const a = axisOf(it.mapel); return a != null && axes.includes(a); }).map((it) => it.nilai);
    return vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : null;
  };
  const fAvg = (r: { items: { nilai: number }[] }) => r.items.length ? r.items.reduce((a, b) => a + b.nilai, 0) / r.items.length : 0;
  const lineRows = [...rapor].sort((a, b) => a.urutan - b.urutan).slice(-4);
  const line = lineRows.map((r) => ({ label: `${r.periode.replace(/Semester\s*/i, "")} ${shortTA(r.tahun)}`.trim(), mipa: grpAvg(r.items, MIPA_AX), basos: grpAvg(r.items, BASOS_AX), kelas: classAvgByPeriode.get(r.periodeId) ?? null }));
  const lineLegend = line.length ? { mipa: line[line.length - 1].mipa, basos: line[line.length - 1].basos, kelas: line[line.length - 1].kelas } : { mipa: null, basos: null, kelas: null };
  const lineInsight = lineRows.length >= 2
    ? { delta: Math.round((fAvg(lineRows[lineRows.length - 1]) - fAvg(lineRows[0])) * 10) / 10, naik: fAvg(lineRows[lineRows.length - 1]) >= fAvg(lineRows[0]), tahun: new Set(lineRows.map((r) => r.tahun)).size }
    : null;
  const strongest = (rapor[0]?.items ?? []).slice().sort((a, b) => b.nilai - a.nilai).slice(0, 3).map((it) => ({ nama: it.mapel, nilai: it.nilai }));

  const radar = RADAR_AXES.map((a) => { const v = axisAgg.get(a.key); return { axis: a.key, value: v && v.n ? Math.round(v.sum / v.n) : 0 }; });
  const axVal = (k: string) => radar.find((r) => r.axis === k)?.value ?? 0;
  const radarTags: string[] = [];
  if (Math.max(axVal("Sains"), axVal("Matematika")) >= 85) radarTags.push("STEM dominan");
  if (axVal("Bahasa") >= 85) radarTags.push("Verbal kuat");
  if (axVal("Sains") >= 88) radarTags.push("Jalur olimpiade sains");
  if (axVal("Seni") >= 85) radarTags.push("Kreatif");
  if (axVal("Olahraga") >= 85) radarTags.push("Atletis");
  if (axVal("Sosial") >= 85 && radarTags.length < 2) radarTags.push("Peka sosial");
  if (!radarTags.length) radarTags.push("Profil seimbang");

  // ── peringkat ──
  let rank: number | null = null, rankTotal: number | null = null;
  if (rankRows.length) {
    const sorted = rankRows.filter((r) => r._avg.nilaiAkhir != null).sort((a, b) => (b._avg.nilaiAkhir ?? 0) - (a._avg.nilaiAkhir ?? 0));
    rankTotal = sorted.length;
    const i = sorted.findIndex((r) => r.siswaId === id);
    rank = i >= 0 ? i + 1 : null;
  }

  // ── SPP (tahun terbaru yang ada) ──
  const sppYear = s.tagihanSpp.length ? Math.max(...s.tagihanSpp.map((t) => t.tahun)) : new Date().getFullYear();
  const sppRows = s.tagihanSpp.filter((t) => t.tahun === sppYear);
  const spp = sppRows.map((t) => ({ bulan: t.bulan, status: t.status, nominal: t.nominal }));
  const sppNunggak = sppRows.filter((t) => t.status === "belum").length;
  const sppStatus = sppRows.length === 0 ? "—" : sppNunggak === 0 ? "Lunas" : `${sppNunggak} bln`;

  // ── journey: 1 node per SEMESTER (dari rapor) + proyeksi s/d Lulus ──
  type JNode = { year: string; semester: string; rombel: string; absen: number | null; rata: number | null; status: "past" | "current" | "future"; note: string };
  const rombelByTA = new Map<number, { nama: string; absen: number | null }>();
  for (const ar of s.anggotaRombel) if (ar.rombel?.tahunAjaranId != null) rombelByTA.set(ar.rombel.tahunAjaranId, { nama: ar.rombel.nama, absen: ar.nomorAbsen });
  const semAsc = [...rapor].sort((a, b) => a.urutan - b.urutan);
  const past: JNode[] = semAsc.map((r, i) => {
    const rb = rombelByTA.get(r.taId);
    return { year: r.tahun, semester: r.periode.replace(/Semester\s*/i, ""), rombel: rb?.nama ?? cur?.rombel?.nama ?? "—", absen: rb?.absen ?? null, rata: Math.round(fAvg(r) * 10) / 10, status: i === semAsc.length - 1 ? "current" : "past", note: "" };
  });
  const future: JNode[] = [];
  const curUrut = cur?.rombel?.tingkat?.urutan ?? null;
  const maxUrut = tingkatList.length ? tingkatList[tingkatList.length - 1].urutan : null;
  const curYearStart = yrOf(cur?.rombel?.tahunAjaran?.tahun);
  const lastSem = past[past.length - 1]?.semester ?? "Genap";
  if (curUrut != null && maxUrut != null && curYearStart) {
    const steps: { urut: number; sem: string }[] = [];
    if (/ganjil/i.test(lastSem)) steps.push({ urut: curUrut, sem: "Genap" });
    for (let u = curUrut + 1; u <= maxUrut; u++) { steps.push({ urut: u, sem: "Ganjil" }); steps.push({ urut: u, sem: "Genap" }); }
    steps.forEach((st, k) => {
      const yearStart = curYearStart + (st.urut - curUrut);
      const isLulus = k === steps.length - 1;
      const gradeNama = tingkatList.find((tk) => tk.urutan === st.urut)?.nama ?? "";
      future.push({ year: `${yearStart}/${yearStart + 1}`, semester: st.sem, rombel: isLulus ? "Lulus 🎓" : gradeNama, absen: null, rata: null, status: "future", note: isLulus ? `Juni ${yearStart + 1}` : "" });
    });
  }
  const journey = [...past, ...future];

  // ── parents ──
  const parents = s.orangTuaWali.map((o) => ({ tipe: o.tipe, nama: o.nama, pekerjaan: o.pekerjaan, pendidikan: o.pendidikan, penghasilan: o.penghasilan, noHp: o.noHp ?? null }));

  const tl = s.tanggalLahir ? new Date(s.tanggalLahir) : null;

  return {
    id: s.id, nama: s.namaLengkap, inisial: inisial(s.namaLengkap), nisn: s.nisn ?? "—", nis: s.nis ?? "—", noInduk: s.noInduk ?? "—",
    jk: s.jenisKelamin, status: s.status, foto: s.foto,
    kelas: cur?.rombel?.nama ?? "—", tingkat: cur?.rombel?.tingkat?.nama ?? "—", fase: cur?.rombel?.tingkat?.fase ?? null,
    waliKelas: cur?.rombel?.waliGuru?.namaGuru ?? null, absen: cur?.nomorAbsen ?? null,
    ttl: `${s.tempatLahir ?? "—"}${tl ? `, ${fmtTgl(tl)}` : ""}`, alamat: s.alamat, transportasi: s.transportasi, tinggalDengan: s.tinggalDengan,
    tinggi, berat,
    prestasiCount: s.prestasi.length, beasiswa: s.beasiswa[0]?.nama ?? null,
    metrics: { rata, hadirPct, rank, rankTotal, sppStatus, bmi: bmi(tinggi, berat), pelanggaran: kasusPoin },
    distanceKm, geo, kasus: { count: kasusRows.length, poin: kasusPoin, list: kasusRows.slice(0, 5).map((k) => ({ nama: k.namaKasus, poin: k.poin, tanggal: k.tanggal.toISOString() })) },
    zodiak: tl ? zodiakFromDate(tl) : null, numero: tl ? numerologi(tl) : null,
    line, lineInsight, lineLegend, strongest, radar, radarTags, journey, rapor,
    heatmap, hadirStats,
    spp, prestasi: s.prestasi.map((p) => ({ nama: p.namaPrestasi, tingkat: p.tingkat, tahun: p.tahun })), parents,
  };
}
