import { prisma } from "@/lib/prisma";

const BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const KELOMPOK_LABEL: Record<string, string> = { A: "Kelompok Mata Pelajaran Umum", B: "Kelompok Mata Pelajaran Umum (B)", C: "Mata Pelajaran Pilihan / Peminatan" };

export type RaporMapel = { no: number; nama: string; nilai: number; kkm: number; capaian: string | null };
export type RaporGroup = { label: string; items: RaporMapel[] };
export type RaporP5Projek = { tema: string; judul: string; elemen: { dimensi: string; predikat: string }[] };
export type SiswaRapor = {
  id: number;
  sekolah: { nama: string; npsn: string | null; alamat: string | null; telepon: string | null; email: string | null; kepala: string | null; nipKepala: string | null };
  identitas: { nama: string; kelas: string; nisn: string; nis: string; fase: string; semester: string; tahun: string; ttl: string; jk: string; agama: string; absen: string; waliKelas: string; nipWali: string | null };
  groups: RaporGroup[];
  rataAkhir: number;
  predikat: string;
  ekstra: { nama: string; ket: string }[];
  hadir: { sakit: number; izin: number; alpa: number };
  catatan: string | null;
  naik: boolean;
  tingkatBerikut: string;
  p5: { tema: string; tahun: string; projek: RaporP5Projek[] } | null;
  noDok: string;
};

export async function getSiswaRapor(id: number, sekolahId: number): Promise<SiswaRapor | null> {
  const s = await prisma.siswa.findFirst({
    where: { id, sekolahId, deletedAt: null },
    include: {
      anggotaRombel: { take: 1, orderBy: { id: "desc" }, include: { rombel: { include: { tingkat: true, tahunAjaran: true, waliGuru: { select: { namaGuru: true, nip: true } } } } } },
    },
  });
  if (!s) return null;

  const [sekolah, nilai, p5rows] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true, npsn: true, alamat: true, telepon: true, email: true, kepalaSekolah: true, nipKepala: true } }),
    prisma.nilaiRapor.findMany({
      where: { siswaId: id, nilaiAkhir: { not: null } },
      include: { mapel: { select: { namaMapel: true, kelompok: true, kkm: true, noUrut: true } }, periode: { select: { id: true, nama: true, urutan: true, jenis: true, tahunAjaranId: true, tanggalMulai: true, tanggalSelesai: true, tahunAjaran: { select: { tahun: true } } } } },
    }),
    prisma.penilaianP5.findMany({ where: { siswaId: id }, include: { projekP5: { select: { tema: true, judul: true, tahunAjaran: { select: { tahun: true } } } }, elemen: { select: { nama: true } } } }),
  ]);

  // pilih periode terbaru yang punya nilai
  const byPeriode = new Map<number, typeof nilai>();
  for (const n of nilai) { const a = byPeriode.get(n.periodeId) ?? []; a.push(n); byPeriode.set(n.periodeId, a); }
  let bestId = -1, bestKey = -1;
  for (const [pid, rows] of byPeriode) { const r = rows[0]; const key = r.periode.tahunAjaranId * 100 + r.periode.urutan; if (key > bestKey) { bestKey = key; bestId = pid; } }
  const cur = bestId >= 0 ? byPeriode.get(bestId)! : [];
  const per = cur[0]?.periode;

  // grup per kelompok (A→B→C)
  const order = ["A", "B", "C"];
  const gmap = new Map<string, RaporMapel[]>();
  const sorted = [...cur].sort((a, b) => (a.mapel.noUrut ?? 99) - (b.mapel.noUrut ?? 99));
  let no = 0;
  for (const k of order) {
    for (const n of sorted) {
      if (n.mapel.kelompok !== k) continue;
      const arr = gmap.get(k) ?? [];
      arr.push({ no: ++no, nama: n.mapel.namaMapel, nilai: n.nilaiAkhir ?? 0, kkm: n.mapel.kkm, capaian: n.deskripsiCapaian });
      gmap.set(k, arr);
    }
  }
  const groups: RaporGroup[] = order.filter((k) => gmap.has(k)).map((k) => ({ label: KELOMPOK_LABEL[k], items: gmap.get(k)! }));
  const allItems = groups.flatMap((g) => g.items);
  const rataAkhir = allItems.length ? Math.round((allItems.reduce((a, b) => a + b.nilai, 0) / allItems.length) * 10) / 10 : 0;
  const predikat = rataAkhir >= 90 ? "SANGAT BAIK" : rataAkhir >= 80 ? "BAIK" : rataAkhir >= 70 ? "CUKUP" : "PERLU BIMBINGAN";

  // ekstra + catatan + kehadiran utk periode
  const [ekstraRows, catatanRow, hadirGroups] = await Promise.all([
    per ? prisma.nilaiRaporEkstra.findMany({ where: { siswaId: id, periodeId: per.id } }) : Promise.resolve([]),
    per ? prisma.raporCatatan.findFirst({ where: { siswaId: id, periodeId: per.id } }) : Promise.resolve(null),
    prisma.kehadiranSiswa.groupBy({
      by: ["status"], _count: { _all: true },
      where: { siswaId: id, ...(per?.tanggalMulai && per?.tanggalSelesai ? { tanggal: { gte: per.tanggalMulai, lte: per.tanggalSelesai } } : {}) },
    }),
  ]);
  const hg = (st: string) => hadirGroups.find((g) => g.status === st)?._count._all ?? 0;
  const hadir = { sakit: hg("sakit"), izin: hg("izin"), alpa: hg("alpa") };
  const ekstra = ekstraRows.map((e) => ({ nama: e.namaEkstra, ket: e.deskripsi ?? (e.nilai ?? "") }));

  const cur2 = s.anggotaRombel[0];
  const tingkatNama = cur2?.rombel?.tingkat?.nama ?? "—";
  const tl = s.tanggalLahir ? new Date(s.tanggalLahir) : null;
  const tahun = per?.tahunAjaran?.tahun ?? cur2?.rombel?.tahunAjaran?.tahun ?? "";
  const semester = per ? (per.jenis === "semester" ? (per.urutan % 2 === 1 ? "1 (Ganjil)" : "2 (Genap)") : per.nama) : "—";
  const naik = rataAkhir >= 70;

  // P5
  const projMap = new Map<string, RaporP5Projek>();
  for (const r of p5rows) {
    const key = r.projekP5.judul;
    const e = projMap.get(key) ?? { tema: r.projekP5.tema, judul: r.projekP5.judul, elemen: [] };
    e.elemen.push({ dimensi: r.elemen.nama, predikat: String(r.predikat) });
    projMap.set(key, e);
  }
  const p5 = p5rows.length ? { tema: "Profil Pelajar Pancasila", tahun: p5rows[0].projekP5.tahunAjaran?.tahun ?? tahun, projek: [...projMap.values()] } : null;

  return {
    id: s.id,
    sekolah: { nama: sekolah?.nama ?? "Sekolah", npsn: sekolah?.npsn ?? null, alamat: sekolah?.alamat ?? null, telepon: sekolah?.telepon ?? null, email: sekolah?.email ?? null, kepala: sekolah?.kepalaSekolah ?? null, nipKepala: sekolah?.nipKepala ?? null },
    identitas: {
      nama: s.namaLengkap.toUpperCase(), kelas: cur2?.rombel?.nama ?? "—", nisn: s.nisn ?? "—", nis: s.nis ?? "—",
      fase: cur2?.rombel?.tingkat?.fase ?? "—", semester, tahun, ttl: `${s.tempatLahir ?? "—"}${tl ? `, ${tl.getDate()} ${BULAN[tl.getMonth() + 1]} ${tl.getFullYear()}` : ""}`,
      jk: s.jenisKelamin === "P" ? "Perempuan" : s.jenisKelamin === "L" ? "Laki-laki" : "—", agama: s.agama ?? "—",
      absen: cur2?.nomorAbsen != null ? String(cur2.nomorAbsen).padStart(2, "0") : "—",
      waliKelas: cur2?.rombel?.waliGuru?.namaGuru ?? "—", nipWali: cur2?.rombel?.waliGuru?.nip ?? null,
    },
    groups, rataAkhir, predikat, ekstra, hadir, catatan: catatanRow?.catatan ?? null, naik,
    tingkatBerikut: tingkatNama, p5, noDok: `${s.nisn ?? s.id}-${(tahun || "").replace("/", "")}`,
  };
}
