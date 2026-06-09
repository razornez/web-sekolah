import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Map nama mapel → bidang (untuk chip filter & ikon). */
export function bidangOf(mapel: string | null | undefined): string {
  const n = (mapel ?? "").toLowerCase();
  if (/matematika|fisika|kimia|biologi|ipa|informatika/.test(n)) return "MIPA";
  if (/bahasa|inggris|indonesia|sastra|arab|jepang|sunda|jawa|mandarin/.test(n)) return "Bahasa";
  if (/sejarah|geografi|ekonomi|sosiologi|pkn|pancasila|ips/.test(n)) return "IPS";
  if (/seni|musik|budaya|prakarya|kewirausahaan/.test(n)) return "Seni";
  if (/agama|budi pekerti|tahfizh/.test(n)) return "Agama";
  if (/jasmani|olahraga|penjas|pjok/.test(n)) return "PJOK";
  return "TU";
}
const yearsSince = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 31557600000)) : 0);
const cap = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export type GuruCard = {
  id: number; nama: string; inisial: string; foto: string | null;
  role: string; bidang: string; status: string;
  isKepsek: boolean; isWali: boolean; waliKelas: string | null; hasSertif: boolean; isS2: boolean;
  kelasCount: number; masaKerja: number;
  beban: number; bebanStatus: "ringan" | "sehat" | "pas" | "berlebih";
  jurnalPct: number | null; hadirPct: number | null; evalRate: number | null;
};
export type SpotlightItem = { id: number; nama: string; inisial: string; foto: string | null; role: string; thn: number; kind: string; extra: string };
export type GuruPulse = {
  total: number;
  comp: { key: string; count: number; pct: number }[];
  alerts: { beban: number; jurnal: number; ultah: number; sertifikasi: number };
  flip: { rasioGuru: number; rasioSiswa: number; sertifPct: number; bebanAvg: number };
  chips: { bidang: { key: string; count: number }[]; wali: number; s2: number; beban: number };
  spotlight: SpotlightItem[];
};

const inisial = (n: string) => n.replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|S\.?Si|S\.?Ag|S\.?S|S\.?T|S\.?Or|S\.?Hum|M\.?Hum|M\.?Sc|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "G";
const roleOf = (jab: string | null, mapel: string | null) => (jab && jab !== "Guru Mapel" ? jab : mapel ? `Guru ${mapel}` : "Guru");
const statusKey = (s: string | null) => { const u = (s ?? "").toUpperCase(); return u === "PNS" || u === "GTT" || u === "GTY" || u === "PPPK" ? u : u ? "HONORER" : "GTT"; };
const bebanStat = (b: number): GuruCard["bebanStatus"] => (b > 28 ? "berlebih" : b >= 24 ? "pas" : b >= 16 ? "sehat" : "ringan");

/** Bagian Pulse PTK — di-cache per sekolah (revalidate 60 dtk, locale-independent). */
export const getGuruPulse = (sekolahId: number) =>
  unstable_cache(
    async (): Promise<GuruPulse> => {
      const now = new Date();
      const guru = await prisma.guru.findMany({
        where: { sekolahId, deletedAt: null },
        select: {
          id: true, namaGuru: true, foto: true, jenisJabatan: true, statusGuru: true, tanggalLahir: true, tmt: true,
          mapelDiampu: { select: { namaMapel: true }, take: 1 },
          pendidikan: { select: { jenjang: true } },
          _count: { select: { jadwalGuru: true, sertifikasi: true, rombelWali: true } },
          penghargaan: { select: { nama: true }, take: 1, orderBy: { tahun: "desc" } },
          jurnalGuru: { select: { tanggal: true }, take: 1, orderBy: { tanggal: "desc" } },
          rekapKinerja: { select: { skorAkhir: true }, take: 1, orderBy: { periodeId: "desc" } },
          sertifikasi: { select: { tahunExpired: true } },
        },
        orderBy: { id: "asc" },
      });
      const totalSiswa = await prisma.siswa.count({ where: { sekolahId, deletedAt: null, status: "aktif" } });
      const total = guru.length;

      const compMap = new Map<string, number>();
      for (const g of guru) compMap.set(statusKey(g.statusGuru), (compMap.get(statusKey(g.statusGuru)) ?? 0) + 1);
      const comp = ["PNS", "GTT", "GTY", "PPPK", "HONORER"].filter((k) => compMap.get(k)).map((k) => ({ key: k, count: compMap.get(k)!, pct: Math.round((compMap.get(k)! / (total || 1)) * 100) }));

      const bulan = now.getMonth();
      const alerts = {
        beban: guru.filter((g) => g._count.jadwalGuru > 28).length,
        jurnal: guru.filter((g) => { const j = g.jurnalGuru[0]?.tanggal; return !j || (now.getTime() - j.getTime()) / 86400000 > 3; }).length,
        ultah: guru.filter((g) => g.tanggalLahir && g.tanggalLahir.getMonth() === bulan).length,
        sertifikasi: guru.filter((g) => g.sertifikasi.some((s) => s.tahunExpired != null && s.tahunExpired <= now.getFullYear())).length,
      };
      const bersertif = guru.filter((g) => g._count.sertifikasi > 0).length;
      const bebanTotal = guru.reduce((a, g) => a + g._count.jadwalGuru, 0);
      const flip = {
        rasioGuru: 1,
        rasioSiswa: total ? Math.round(totalSiswa / total) : 0,
        sertifPct: total ? Math.round((bersertif / total) * 100) : 0,
        bebanAvg: total ? Math.round(bebanTotal / total) : 0,
      };

      const bidangMap = new Map<string, number>();
      for (const g of guru) { const b = bidangOf(g.mapelDiampu[0]?.namaMapel ?? null); bidangMap.set(b, (bidangMap.get(b) ?? 0) + 1); }
      const chips = {
        bidang: ["MIPA", "Bahasa", "IPS", "Seni", "PJOK", "Agama", "TU"].filter((k) => bidangMap.get(k)).map((k) => ({ key: k, count: bidangMap.get(k)! })),
        wali: guru.filter((g) => g._count.rombelWali > 0).length,
        s2: guru.filter((g) => g.pendidikan.some((p) => p.jenjang === "S2" || p.jenjang === "S3")).length,
        beban: guru.filter((g) => g._count.jadwalGuru > 28).length,
      };

      const spotlight: SpotlightItem[] = guru.map((g) => {
        const thn = yearsSince(g.tmt);
        const evalHigh = (g.rekapKinerja[0]?.skorAkhir ?? 0) >= 90;
        let kind = "default", extra = "";
        if (g.penghargaan[0]) { kind = "penghargaan"; extra = g.penghargaan[0].nama; }
        else if (evalHigh) { kind = "eval"; extra = (g.rekapKinerja[0]!.skorAkhir / 20).toFixed(1); }
        else if (g._count.rombelWali > 0) { kind = "wali"; extra = String(g._count.rombelWali); }
        return { id: g.id, nama: g.namaGuru, inisial: inisial(g.namaGuru), foto: g.foto, role: roleOf(g.jenisJabatan, g.mapelDiampu[0]?.namaMapel ?? null), thn, kind, extra };
      }).filter((s) => s.thn > 0 || s.kind !== "default").sort(() => 0).slice(0, 8);

      return { total, comp, alerts, flip, chips, spotlight };
    },
    [`guru-pulse-${sekolahId}`],
    { revalidate: 60, tags: [`guru-${sekolahId}`] },
  )();

export type GalleryFilters = { q: string; bidang: string; status: string; role: string; page: number; tampil: string };

export async function getGuruGallery(sekolahId: number, f: GalleryFilters, perPage = 12) {
  const where: import("@prisma/client").Prisma.GuruWhereInput = {
    sekolahId, deletedAt: f.tampil === "nonaktif" ? { not: null } : null,
    ...(f.q ? { OR: [{ namaGuru: { contains: f.q, mode: "insensitive" } }, { nip: { contains: f.q } }, { nuptk: { contains: f.q } }] } : {}),
    ...(f.status ? { statusGuru: { equals: f.status, mode: "insensitive" } } : {}),
    ...(f.role === "wali" ? { rombelWali: { some: {} } } : {}),
    ...(f.role === "s2" ? { pendidikan: { some: { jenjang: { in: ["S2", "S3"] } } } } : {}),
    ...(f.bidang ? { mapelDiampu: { some: {} } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.guru.count({ where }),
    prisma.guru.findMany({
      where, orderBy: { namaGuru: "asc" }, skip: (f.page - 1) * perPage, take: perPage,
      select: {
        id: true, namaGuru: true, foto: true, jenisJabatan: true, statusGuru: true, tmt: true,
        mapelDiampu: { select: { namaMapel: true } },
        pendidikan: { select: { jenjang: true } },
        rombelWali: { select: { nama: true } },
        _count: { select: { jadwalGuru: true, jurnalGuru: true, sertifikasi: true } },
        rekapKinerja: { select: { skorAkhir: true }, take: 1, orderBy: { periodeId: "desc" } },
        jadwalGuru: { select: { rombelId: true } },
      },
    }),
  ]);
  const ids = rows.map((r) => r.id);
  const hadirAgg = ids.length ? await prisma.kehadiranGuru.groupBy({ by: ["guruId", "status"], where: { guruId: { in: ids } }, _count: { _all: true } }) : [];
  const hadirByGuru = new Map<number, { ok: number; total: number }>();
  for (const h of hadirAgg) {
    const e = hadirByGuru.get(h.guruId) ?? { ok: 0, total: 0 };
    e.total += h._count._all; if (h.status === "hadir" || h.status === "terlambat") e.ok += h._count._all;
    hadirByGuru.set(h.guruId, e);
  }

  let cards: GuruCard[] = rows.map((g) => {
    const mapel = g.mapelDiampu[0]?.namaMapel ?? null;
    const beban = g._count.jadwalGuru;
    const kelasCount = new Set(g.jadwalGuru.map((j) => j.rombelId).filter((x) => x != null)).size || g.rombelWali.length;
    const h = hadirByGuru.get(g.id);
    const skor = g.rekapKinerja[0]?.skorAkhir ?? null;
    return {
      id: g.id, nama: g.namaGuru, inisial: inisial(g.namaGuru), foto: g.foto,
      role: roleOf(g.jenisJabatan, mapel), bidang: bidangOf(mapel), status: statusKey(g.statusGuru),
      isKepsek: /kepala sekolah/i.test(g.jenisJabatan ?? ""), isWali: g.rombelWali.length > 0, waliKelas: g.rombelWali[0]?.nama ?? null,
      hasSertif: g._count.sertifikasi > 0, isS2: g.pendidikan.some((p) => p.jenjang === "S2" || p.jenjang === "S3"),
      kelasCount, masaKerja: yearsSince(g.tmt),
      beban, bebanStatus: bebanStat(beban),
      jurnalPct: beban > 0 ? cap((g._count.jurnalGuru / (beban * 4)) * 100) : null,
      hadirPct: h && h.total ? cap((h.ok / h.total) * 100) : null,
      evalRate: skor != null ? Math.round((skor / 20) * 10) / 10 : null,
    };
  });
  if (f.bidang) cards = cards.filter((c) => c.bidang === f.bidang);
  return { total, totalPage: Math.max(1, Math.ceil(total / perPage)), cards };
}
