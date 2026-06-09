import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const inisial = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "··";

const COLORS = ["lav", "peach", "mint", "pink", "sky", "sun"];
export const cardColor = (id: number) => COLORS[id % COLORS.length];

export type Jenjang = { nama: string; count: number; pct: number; rombel: number; l: number; p: number };
export type Bday = { id: number; nama: string; inisial: string; kelas: string; diff: number; dateISO: string };
export type GameQ = { kind: string; vars: Record<string, string | number>; options: { v: number; correct: boolean }[] };
export type SiswaPulse = {
  total: number;
  growthMonth: number;
  jenjang: Jenjang[];
  birthdays: Bday[];
  alerts: { alpa: number; noFoto: number; nikIncomplete: number; sppNunggak: number };
  quick: { semua: number; aktif: number; lulus: number; pindah: number; alumni: number; L: number; P: number; bdayMonth: number; perluData: number };
  game: GameQ[];
};

function shuffle3(correct: number): { v: number; correct: boolean }[] {
  const span = Math.max(8, Math.round(correct * 0.08));
  const opts = new Set<number>([correct]);
  let guard = 0;
  while (opts.size < 3 && guard++ < 20) {
    const delta = (Math.floor(guard / 2) + 1) * span * (guard % 2 === 0 ? 1 : -1);
    const v = correct + delta;
    if (v > 0) opts.add(v);
  }
  return [...opts].sort((a, b) => a - b).map((v) => ({ v, correct: v === correct }));
}

/** Bagian "Pulse" yang berat — di-cache per sekolah (revalidate 5 menit). */
export const getSiswaPulse = (sekolahId: number) =>
  unstable_cache(
    async (): Promise<SiswaPulse> => {
      const now = new Date();
      const mo = now.getMonth();
      const monthAgo = new Date(now); monthAgo.setMonth(mo - 1);
      const since14 = new Date(now); since14.setDate(now.getDate() - 14);

      const [statusG, genderG, aktifRows, sppBelum, alpaG, masukBulanIni] = await Promise.all([
        prisma.siswa.groupBy({ by: ["status"], where: { sekolahId, deletedAt: null }, _count: { _all: true } }),
        prisma.siswa.groupBy({ by: ["jenisKelamin"], where: { sekolahId, deletedAt: null, status: "aktif" }, _count: { _all: true } }),
        prisma.siswa.findMany({
          where: { sekolahId, deletedAt: null, status: "aktif" },
          select: {
            id: true, namaLengkap: true, jenisKelamin: true, tanggalLahir: true, foto: true, nik: true,
            anggotaRombel: { take: 1, orderBy: { id: "desc" }, select: { rombelId: true, rombel: { select: { nama: true, tingkat: { select: { nama: true, urutan: true } } } } } },
          },
        }),
        prisma.tagihanSpp.groupBy({ by: ["siswaId"], where: { sekolahId, status: "belum" }, _count: { _all: true } }),
        prisma.kehadiranSiswa.groupBy({ by: ["siswaId"], where: { sekolahId, status: "alpa", tanggal: { gte: since14 } }, _count: { _all: true } }),
        prisma.siswa.count({ where: { sekolahId, deletedAt: null, status: "aktif", createdAt: { gte: monthAgo } } }),
      ]);

      const sc = (s: string) => statusG.find((g) => g.status === s)?._count._all ?? 0;
      const aktif = sc("aktif");

      // komposisi per tingkat
      const tmap = new Map<string, { nama: string; urutan: number; count: number; l: number; p: number; rombels: Set<number> }>();
      let noFoto = 0, nikIncomplete = 0, bdayMonth = 0;
      const bdayCand: Bday[] = [];
      for (const s of aktifRows) {
        if (!s.foto) noFoto++;
        if (!s.nik || s.nik.replace(/\D/g, "").length < 16) nikIncomplete++;
        const t = s.anggotaRombel[0]?.rombel?.tingkat;
        if (t) {
          const e = tmap.get(t.nama) ?? { nama: t.nama, urutan: t.urutan, count: 0, l: 0, p: 0, rombels: new Set() };
          e.count++;
          if (s.jenisKelamin === "L") e.l++; else if (s.jenisKelamin === "P") e.p++;
          const rid = s.anggotaRombel[0]?.rombelId; if (rid) e.rombels.add(rid);
          tmap.set(t.nama, e);
        }
        if (s.tanggalLahir) {
          const b = new Date(s.tanggalLahir);
          if (b.getMonth() === mo) bdayMonth++;
          const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
          const diff = Math.floor((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
          if (diff >= 0 && diff < 7) {
            bdayCand.push({ id: s.id, nama: s.namaLengkap, inisial: inisial(s.namaLengkap), kelas: s.anggotaRombel[0]?.rombel?.nama ?? "—", diff, dateISO: next.toISOString() });
          }
        }
      }
      const jenjangArr = [...tmap.values()].sort((a, b) => a.urutan - b.urutan);
      const jenjang: Jenjang[] = jenjangArr.map((e) => ({ nama: e.nama, count: e.count, pct: aktif ? Math.round((e.count / aktif) * 100) : 0, rombel: e.rombels.size, l: e.l, p: e.p }));
      const birthdays = bdayCand.sort((a, b) => a.diff - b.diff).slice(0, 5);

      const L = genderG.find((g) => g.jenisKelamin === "L")?._count._all ?? 0;
      const P = genderG.find((g) => g.jenisKelamin === "P")?._count._all ?? 0;
      const sppNunggak = sppBelum.filter((b) => b._count._all >= 2).length;
      const alpa = alpaG.filter((a) => a._count._all >= 3).length;
      const perluData = noFoto + nikIncomplete; // pendekatan: data wajib belum lengkap

      // mini-game dari data nyata — teks diformat di client (i18n)
      const game: GameQ[] = [];
      const k11 = jenjang.find((j) => /11|XI(?!I)/i.test(j.nama));
      if (k11) game.push({ kind: "k11", vars: { kelas: k11.nama, n: k11.count, pct: k11.pct, total: aktif }, options: shuffle3(k11.count) });
      game.push({ kind: "bday", vars: { n: bdayMonth }, options: shuffle3(bdayMonth) });
      game.push({ kind: "foto", vars: { n: noFoto }, options: shuffle3(noFoto) });
      game.push({ kind: "perempuan", vars: { n: P, total: aktif, pct: aktif ? Math.round((P / aktif) * 100) : 0 }, options: shuffle3(P) });
      if (sppNunggak > 0) game.push({ kind: "spp", vars: { n: sppNunggak }, options: shuffle3(sppNunggak) });

      return {
        total: aktif, growthMonth: masukBulanIni, jenjang, birthdays,
        alerts: { alpa, noFoto, nikIncomplete, sppNunggak },
        quick: { semua: aktif + sc("lulus") + sc("pindah") + sc("keluar") + sc("alumni"), aktif, lulus: sc("lulus"), pindah: sc("pindah"), alumni: sc("alumni"), L, P, bdayMonth, perluData },
        game,
      };
    },
    [`siswa-pulse-${sekolahId}`],
    { revalidate: 300, tags: [`siswa-${sekolahId}`] },
  )();

export type SiswaCard = {
  id: number; nama: string; nisn: string; kelas: string; jk: "L" | "P" | null;
  status: string; color: string; bdayToday: boolean;
  tags: { label: string; tone: string }[];
  rata: number | null; hadir: number | null; sppOk: boolean | null;
};
export type SiswaGallery = { cards: SiswaCard[]; totalFiltered: number; totalPages: number };

/** Daftar siswa terfilter + statistik mini per kartu (batched untuk halaman terlihat). */
export async function getSiswaGallery(
  sekolahId: number,
  opts: { q: string; status: string; jenjang: string; gender: string; flag: string; page: number; per: number },
): Promise<SiswaGallery> {
  const where: Prisma.SiswaWhereInput = {
    sekolahId, deletedAt: null,
    ...(opts.q ? { OR: [{ namaLengkap: { contains: opts.q, mode: "insensitive" } }, { nisn: { contains: opts.q } }, { nis: { contains: opts.q } }] } : {}),
    ...(opts.status ? { status: opts.status as Prisma.EnumStatusSiswaFilter["equals"] } : {}),
    ...(opts.gender === "L" || opts.gender === "P" ? { jenisKelamin: opts.gender } : {}),
    ...(opts.flag === "perlu" ? { OR: [{ foto: null }, { nik: null }] } : {}),
    ...(opts.jenjang ? { anggotaRombel: { some: { rombel: { tingkat: { nama: opts.jenjang } } } } } : {}),
  };
  const [totalFiltered, rows] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({
      where, orderBy: { namaLengkap: "asc" }, skip: (opts.page - 1) * opts.per, take: opts.per,
      select: {
        id: true, namaLengkap: true, nisn: true, jenisKelamin: true, status: true, tanggalLahir: true,
        anggotaRombel: { take: 1, orderBy: { id: "desc" }, select: { rombel: { select: { nama: true } } } },
        beasiswa: { take: 1, select: { id: true } },
        prestasi: { take: 1, select: { tingkat: true } },
      },
    }),
  ]);
  const ids = rows.map((r) => r.id);
  const [rataG, hadirG, sppG] = ids.length
    ? await Promise.all([
        prisma.nilaiRapor.groupBy({ by: ["siswaId"], where: { siswaId: { in: ids }, nilaiAkhir: { not: null } }, _avg: { nilaiAkhir: true } }),
        prisma.kehadiranSiswa.groupBy({ by: ["siswaId", "status"], where: { siswaId: { in: ids } }, _count: { _all: true } }),
        prisma.tagihanSpp.groupBy({ by: ["siswaId"], where: { siswaId: { in: ids }, status: "belum" }, _count: { _all: true } }),
      ])
    : [[], [], []];

  const rataMap = new Map<number, number>();
  for (const r of rataG as { siswaId: number; _avg: { nilaiAkhir: number | null } }[]) if (r._avg.nilaiAkhir != null) rataMap.set(r.siswaId, Math.round(r._avg.nilaiAkhir));
  const hadirTot = new Map<number, { hadir: number; total: number }>();
  for (const h of hadirG as { siswaId: number; status: string; _count: { _all: number } }[]) {
    const e = hadirTot.get(h.siswaId) ?? { hadir: 0, total: 0 };
    e.total += h._count._all;
    if (h.status === "hadir" || h.status === "terlambat") e.hadir += h._count._all;
    hadirTot.set(h.siswaId, e);
  }
  const sppNunggakSet = new Set((sppG as { siswaId: number; _count: { _all: number } }[]).filter((s) => s._count._all >= 1).map((s) => s.siswaId));

  const now = new Date(), mo = now.getMonth(), day = now.getDate();
  const cards: SiswaCard[] = rows.map((s) => {
    const ht = hadirTot.get(s.id);
    const tags: { label: string; tone: string }[] = [];
    if (s.status === "aktif") tags.push({ label: "Aktif", tone: "mint" });
    if (s.beasiswa.length) tags.push({ label: "Beasiswa", tone: "lav" });
    if (s.prestasi.length) tags.push({ label: `🏆 ${s.prestasi[0].tingkat ?? "Prestasi"}`, tone: "sun" });
    const b = s.tanggalLahir ? new Date(s.tanggalLahir) : null;
    return {
      id: s.id, nama: s.namaLengkap, nisn: s.nisn ?? "—", kelas: s.anggotaRombel[0]?.rombel?.nama ?? "—",
      jk: s.jenisKelamin, status: s.status, color: cardColor(s.id),
      bdayToday: !!b && b.getMonth() === mo && b.getDate() === day,
      tags: tags.slice(0, 3),
      rata: rataMap.get(s.id) ?? null,
      hadir: ht && ht.total > 0 ? Math.round((ht.hadir / ht.total) * 100) : null,
      sppOk: sppNunggakSet.size || ids.length ? !sppNunggakSet.has(s.id) : null,
    };
  });
  return { cards, totalFiltered, totalPages: Math.max(1, Math.ceil(totalFiltered / opts.per)) };
}
