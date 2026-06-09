import { prisma } from "@/lib/prisma";

export type EditReader = { id: string; nama: string; inisial: string; tipe: string; readAtISO: string };
export type PengumumanEdit = {
  id: number;
  judul: string;
  isi: string;
  kategori: string;
  target: string;
  pinned: boolean;
  prioritas: boolean;
  butuhBalasan: boolean;
  channels: string[];
  reminderHours: number | null;
  createdAtISO: string;
  author: string | null;
  readCount: number;
  recipientTotal: number;
  readByTipe: { siswa: number; ortu: number; guru: number };
  recentReaders: EditReader[];
};

async function recipientTotal(sekolahId: number, target: string): Promise<number> {
  if (target === "siswa") return prisma.siswa.count({ where: { sekolahId, status: "aktif" } });
  if (target === "ortu") return prisma.orangTuaWali.count({ where: { siswa: { sekolahId } } });
  if (target === "staf") return prisma.guru.count({ where: { sekolahId, deletedAt: null } });
  const [s, o, g] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
    prisma.orangTuaWali.count({ where: { siswa: { sekolahId } } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
  ]);
  return s + o + g;
}

const inisial = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "··";

/** Data lengkap untuk halaman Edit Pengumuman: konten + analytics nyata. */
export async function getPengumumanEdit(id: number, sekolahId: number): Promise<PengumumanEdit | null> {
  const p = await prisma.pengumuman.findFirst({
    where: { id, sekolahId },
    select: {
      id: true, judul: true, isi: true, kategori: true, target: true,
      pinned: true, prioritas: true, butuhBalasan: true, channels: true,
      reminderHours: true, createdAt: true, author: { select: { namaLengkap: true } },
    },
  });
  if (!p) return null;

  const [tipeGroups, recent, recTotal] = await Promise.all([
    prisma.pengumumanBaca.groupBy({ by: ["tipe"], where: { pengumumanId: id }, _count: { _all: true } }),
    prisma.pengumumanBaca.findMany({ where: { pengumumanId: id }, orderBy: { readAt: "desc" }, take: 5, select: { userId: true, tipe: true, readAt: true } }),
    recipientTotal(sekolahId, p.target),
  ]);

  const readByTipe = { siswa: 0, ortu: 0, guru: 0 };
  for (const g of tipeGroups) readByTipe[g.tipe] = g._count._all;
  const readCount = readByTipe.siswa + readByTipe.ortu + readByTipe.guru;

  const ids = recent.map((r) => r.userId).filter((x): x is string => !!x);
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, namaLengkap: true } }) : [];
  const nameMap = new Map(users.map((u) => [u.id, u.namaLengkap]));
  const recentReaders: EditReader[] = recent.map((r) => {
    const nama = (r.userId && nameMap.get(r.userId)) || "Pengguna";
    return { id: r.userId ?? "", nama, inisial: inisial(nama), tipe: r.tipe, readAtISO: r.readAt.toISOString() };
  });

  return {
    id: p.id, judul: p.judul, isi: p.isi, kategori: p.kategori, target: p.target,
    pinned: p.pinned, prioritas: p.prioritas, butuhBalasan: p.butuhBalasan,
    channels: p.channels, reminderHours: p.reminderHours,
    createdAtISO: p.createdAt.toISOString(), author: p.author?.namaLengkap ?? null,
    readCount, recipientTotal: recTotal, readByTipe, recentReaders,
  };
}
