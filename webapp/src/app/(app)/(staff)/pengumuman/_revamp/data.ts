import { prisma } from "@/lib/prisma";

export const KATEGORIS = ["umum", "akademik", "keuangan", "kegiatan", "penting", "staf", "lainnya"] as const;
export type Kategori = (typeof KATEGORIS)[number];
// Kategori yang punya "bin" di mini-game (yang lain tidak ditebak).
const GAME_KAT = ["umum", "akademik", "keuangan", "kegiatan", "penting"];

export function strip(html: string, n = 140): string {
  const t = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

export type PengItem = {
  id: number;
  judul: string;
  snippet: string;
  isi: string;
  kategori: string;
  target: string;
  pinned: boolean;
  prioritas: boolean;
  butuhBalasan: boolean;
  createdAtISO: string;
  scheduledAtISO: string | null;
  author: string | null;
  viewCount: number;
  readCount: number;
  readByTipe: { siswa: number; ortu: number; guru: number };
  recipientTotal: number;
  readPct: number;
  waSent: boolean;
  lampiran: string[];
};

export type GameCard = { id: number; snippet: string; kategori: string; target: string };

export type PengData = {
  schoolName: string;
  items: PengItem[];
  pinned: PengItem[];
  categoryCounts: Record<string, number>;
  total: number;
  pentingCount: number;
  audience: { semua: number; siswa: number; ortu: number; guru: number };
  gameCards: GameCard[];
  insight: {
    total: number;
    topCatKey: string | null;
    topCatCount: number;
    avgReadPct: number;
    pinnedCount: number;
    scheduledCount: number;
    emojiPct: number;
  };
};

function recipientTotal(target: string, aud: { semua: number; siswa: number; ortu: number; guru: number }): number {
  if (target === "siswa") return aud.siswa;
  if (target === "ortu") return aud.ortu;
  if (target === "staf") return aud.guru;
  return aud.semua;
}

export async function getPengumumanData(sekolahId: number): Promise<PengData> {
  const [sekolah, siswaCount, ortuCount, guruCount] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true } }),
    prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
    prisma.orangTuaWali.count({ where: { siswa: { sekolahId } } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
  ]);
  const audience = { siswa: siswaCount, ortu: ortuCount, guru: guruCount, semua: siswaCount + ortuCount + guruCount };

  const [rows, readGroups, readTipeGroups, catGroups] = await Promise.all([
    prisma.pengumuman.findMany({
      where: { sekolahId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 120,
      select: {
        id: true, judul: true, isi: true, kategori: true, target: true, pinned: true, prioritas: true,
        butuhBalasan: true, viewCount: true, createdAt: true, scheduledAt: true, lampiran: true,
        author: { select: { namaLengkap: true } },
        kiriman: { select: { channel: true, status: true } },
      },
    }),
    prisma.pengumumanBaca.groupBy({ by: ["pengumumanId"], where: { pengumuman: { sekolahId } }, _count: { _all: true } }),
    prisma.pengumumanBaca.groupBy({ by: ["pengumumanId", "tipe"], where: { pengumuman: { sekolahId } }, _count: { _all: true } }),
    prisma.pengumuman.groupBy({ by: ["kategori"], where: { sekolahId }, _count: { _all: true } }),
  ]);

  const readMap = new Map<number, number>(readGroups.map((r) => [r.pengumumanId, r._count._all]));
  const tipeMap = new Map<number, { siswa: number; ortu: number; guru: number }>();
  for (const r of readTipeGroups) {
    const e = tipeMap.get(r.pengumumanId) ?? { siswa: 0, ortu: 0, guru: 0 };
    e[r.tipe] = r._count._all;
    tipeMap.set(r.pengumumanId, e);
  }
  const items: PengItem[] = rows.map((p) => {
    const recTotal = recipientTotal(p.target, audience);
    const readCount = readMap.get(p.id) ?? 0;
    return {
      id: p.id,
      judul: p.judul,
      snippet: strip(p.isi),
      isi: p.isi,
      kategori: p.kategori,
      target: p.target,
      pinned: p.pinned,
      prioritas: p.prioritas,
      butuhBalasan: p.butuhBalasan,
      createdAtISO: p.createdAt.toISOString(),
      scheduledAtISO: p.scheduledAt ? p.scheduledAt.toISOString() : null,
      author: p.author?.namaLengkap ?? null,
      viewCount: p.viewCount,
      readCount,
      readByTipe: tipeMap.get(p.id) ?? { siswa: 0, ortu: 0, guru: 0 },
      lampiran: p.lampiran,
      recipientTotal: recTotal,
      readPct: recTotal > 0 ? Math.round((readCount / recTotal) * 100) : 0,
      waSent: p.kiriman.some((k) => k.channel === "wa" && k.status === "terkirim"),
    };
  });

  const categoryCounts: Record<string, number> = {};
  for (const c of catGroups) categoryCounts[c.kategori] = c._count._all;
  const total = catGroups.reduce((s, c) => s + c._count._all, 0);
  const pentingCount = items.filter((i) => i.pinned || i.prioritas || i.kategori === "penting").length;

  // Mini-game: kartu = pengumuman nyata (snippet pendek + kategori benar)
  const gameCards: GameCard[] = items
    .filter((i) => GAME_KAT.includes(i.kategori) && i.judul.length > 3)
    .slice(0, 16)
    .map((i) => ({ id: i.id, snippet: i.judul, kategori: i.kategori, target: i.target }));

  // Insight: agregat NYATA
  const topCat = catGroups.slice().sort((a, b) => b._count._all - a._count._all)[0] ?? null;
  const readVals = items.filter((i) => i.recipientTotal > 0).map((i) => i.readPct);
  const avgReadPct = readVals.length ? Math.round(readVals.reduce((s, v) => s + v, 0) / readVals.length) : 0;
  const emojiRe = /^\p{Extended_Pictographic}/u;
  const emojiCount = items.filter((i) => emojiRe.test(i.judul.trim())).length;
  const insight = {
    total,
    topCatKey: topCat?.kategori ?? null,
    topCatCount: topCat?._count._all ?? 0,
    avgReadPct,
    pinnedCount: items.filter((i) => i.pinned).length,
    scheduledCount: items.filter((i) => i.scheduledAtISO).length,
    emojiPct: items.length ? Math.round((emojiCount / items.length) * 100) : 0,
  };

  return {
    schoolName: sekolah?.nama ?? "Sekolah",
    items,
    pinned: items.filter((i) => i.pinned || i.prioritas || i.kategori === "penting").slice(0, 3),
    categoryCounts,
    total,
    pentingCount,
    audience,
    gameCards,
    insight,
  };
}
