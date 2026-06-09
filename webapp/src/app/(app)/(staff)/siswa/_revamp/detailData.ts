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

export type DetailRapor = { periode: string; tahun: string; urutan: number; avg: number; items: { mapel: string; nilai: number; kkm: number; deskripsi: string | null }[] };
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
  line: { label: string; avg: number }[];
  radar: { axis: string; value: number }[];
  journey: { rombel: string; tahun: string; absen: number | null; current: boolean; rata: number | null }[];
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

  const [sekolahCoord, kasusRows] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { lat: true, lng: true } }),
    prisma.kasusSiswa.findMany({ where: { siswaId: id }, orderBy: { tanggal: "desc" }, select: { namaKasus: true, poin: true, tanggal: true } }),
  ]);
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
    const e = perPeriode.get(key) ?? { periode: n.periode.nama, tahun: n.periode.tahunAjaran?.tahun ?? "", urutan: (yrOf(n.periode.tahunAjaran?.tahun) * 10) + n.periode.urutan, avg: 0, items: [] };
    e.items.push({ mapel: n.mapel.namaMapel, nilai: n.nilaiAkhir ?? 0, kkm: n.mapel.kkm, deskripsi: n.deskripsiCapaian });
    perPeriode.set(key, e);
    const ax = axisOf(n.mapel.namaMapel);
    if (ax) { const a = axisAgg.get(ax) ?? { sum: 0, n: 0 }; a.sum += n.nilaiAkhir ?? 0; a.n++; axisAgg.set(ax, a); }
  }
  const rapor = [...perPeriode.values()].map((r) => ({ ...r, avg: r.items.length ? Math.round(r.items.reduce((a, b) => a + b.nilai, 0) / r.items.length) : 0 })).sort((a, b) => b.urutan - a.urutan);
  const line = [...rapor].sort((a, b) => a.urutan - b.urutan).slice(-4).map((r) => ({ label: `${r.periode.split(" ")[0]} ${r.tahun.split("/")[0] ?? ""}`.trim(), avg: r.avg }));
  const radar = RADAR_AXES.map((a) => { const v = axisAgg.get(a.key); return { axis: a.key, value: v && v.n ? Math.round(v.sum / v.n) : 0 }; });

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

  // ── journey (+ rata² nyata per tahun ajaran dari rapor) ──
  const rataByTahun = new Map<string, { sum: number; n: number }>();
  for (const r of rapor) if (r.avg > 0) { const a = rataByTahun.get(r.tahun) ?? { sum: 0, n: 0 }; a.sum += r.avg; a.n++; rataByTahun.set(r.tahun, a); }
  const journey = s.anggotaRombel.map((ar) => {
    const tahun = ar.rombel?.tahunAjaran?.tahun ?? "";
    const ra = rataByTahun.get(tahun);
    return { rombel: ar.rombel.nama, tahun, absen: ar.nomorAbsen, current: ar.rombelId === curRombelId, rata: ra && ra.n ? Math.round(ra.sum / ra.n) : null };
  }).sort((a, b) => yrOf(a.tahun) - yrOf(b.tahun));

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
    line, radar, journey, rapor,
    heatmap, hadirStats,
    spp, prestasi: s.prestasi.map((p) => ({ nama: p.namaPrestasi, tingkat: p.tingkat, tahun: p.tahun })), parents,
  };
}
