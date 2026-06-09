import { prisma } from "@/lib/prisma";
import { bidangOf } from "./listData";

const yearsSince = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 31557600000)) : 0);
const cap = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
const inisial = (n: string) => n.replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|S\.?Si|S\.?Ag|S\.?S|S\.?T|S\.?Or|S\.?Hum|M\.?Hum|M\.?Sc|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "G";
const roleOf = (jab: string | null, mapel: string | null) => (jab && jab !== "Guru Mapel" ? jab : mapel ? `Guru ${mapel}` : "Guru");

export type KarirNode = { year: string; sort: number; type: "current" | "cert" | "award" | "education" | "cpns"; title: string; sub: string };
export type JadwalSlot = { hari: string; urut: number; jamMulai: string; jamSelesai: string; mapel: string; kelas: string | null; wali: boolean };
export type GuruDetail = {
  id: number; nama: string; inisial: string; foto: string | null; role: string; bidang: string;
  status: string; golongan: string | null; jk: "L" | "P"; nip: string; nuptk: string; email: string | null; noTelp: string | null; alamat: string | null;
  masaKerja: number; pendidikanTop: string | null; sertifTahun: number | null;
  isKepsek: boolean;
  strip: { beban: number; bebanStatus: string; jurnalPct: number | null; siswaDiampu: number; evalRate: number | null; nilaiKelas: number | null; penghargaan: number; jurnalSesi: number };
  impact: { siswa: number; nilai: number | null; penghargaan: number; penghargaanTop: string | null; masaKerja: number; angkatan: number };
  karir: KarirNode[];
  jadwal: JadwalSlot[];
  mapel: { nama: string; kelas: number; jam: number }[];
  waliKelas: string | null; waliSiswa: number;
  prestasiSiswa: { nama: string; kelas: string | null; prestasi: string }[];
  heatmap: string[]; jurnalRecent: { tanggal: string; kelas: string; mapel: string; materi: string }[];
  akun: { username: string; aktif: boolean; lastLogin: string | null } | null;
  sertifikasi: { jenis: string; nama: string; tahun: number; expired: number | null; predikat: string | null; status: "ok" | "soon" | "expired" }[];
  sertifWarn: number;
};

const bebanStat = (b: number) => (b > 28 ? "berlebih" : b >= 24 ? "pas" : b >= 16 ? "sehat" : "ringan");

export async function getGuruDetail(id: number, sekolahId: number): Promise<GuruDetail | null> {
  const g = await prisma.guru.findFirst({
    where: { id, sekolahId, deletedAt: null },
    include: {
      pendidikan: true, sertifikasi: { orderBy: { tahunTerbit: "desc" } }, penghargaan: { orderBy: { tahun: "desc" } },
      mapelDiampu: { select: { id: true, namaMapel: true } }, rombelWali: { select: { id: true, nama: true } },
      user: { select: { username: true, isActive: true, lastLoginAt: true } },
      rekapKinerja: { take: 1, orderBy: { periodeId: "desc" } },
      jadwalGuru: { select: { hariId: true, jamMulai: true, jamSelesai: true, mapel: true, rombelId: true, rombel: { select: { nama: true } }, hari: { select: { nama: true, urutan: true } } }, orderBy: [{ hari: { urutan: "asc" } }, { jamMulai: "asc" }] },
    },
  });
  if (!g) return null;

  const taughtRombelIds = [...new Set(g.jadwalGuru.map((j) => j.rombelId).filter((x): x is number => x != null))];
  const mapelIds = g.mapelDiampu.map((m) => m.id);
  const since = new Date(); since.setDate(since.getDate() - 364);
  const [siswaDiampu, taughtSiswa, nilaiAgg, prestasiRows, jurnalDates, jurnalRecent, waliSiswa] = await Promise.all([
    taughtRombelIds.length ? prisma.siswa.count({ where: { sekolahId, deletedAt: null, status: "aktif", anggotaRombel: { some: { rombelId: { in: taughtRombelIds } } } } }) : 0,
    taughtRombelIds.length ? prisma.anggotaRombel.findMany({ where: { rombelId: { in: taughtRombelIds } }, select: { siswaId: true } }) : Promise.resolve([] as { siswaId: number }[]),
    mapelIds.length && taughtRombelIds.length
      ? prisma.nilaiRapor.aggregate({ where: { mapelId: { in: mapelIds }, nilaiAkhir: { not: null }, siswa: { anggotaRombel: { some: { rombelId: { in: taughtRombelIds } } } } }, _avg: { nilaiAkhir: true } })
      : Promise.resolve({ _avg: { nilaiAkhir: null } }),
    taughtRombelIds.length ? prisma.siswa.findMany({ where: { sekolahId, deletedAt: null, anggotaRombel: { some: { rombelId: { in: taughtRombelIds } } }, prestasi: { some: {} } }, select: { namaLengkap: true, prestasi: { select: { namaPrestasi: true }, orderBy: { id: "desc" }, take: 1 }, anggotaRombel: { take: 1, orderBy: { id: "desc" }, select: { rombel: { select: { nama: true } } } } }, take: 5 }) : Promise.resolve([] as never[]),
    prisma.jurnalGuru.findMany({ where: { guruId: id, tanggal: { gte: since } }, select: { tanggal: true } }),
    prisma.jurnalGuru.findMany({ where: { guruId: id }, orderBy: { tanggal: "desc" }, take: 5, select: { tanggal: true, kelas: true, mapel: true, materi: true } }),
    g.rombelWali[0] ? prisma.anggotaRombel.count({ where: { rombelId: g.rombelWali[0].id } }) : 0,
  ]);
  void taughtSiswa;

  const beban = g.jadwalGuru.length;
  const jurnalCount = await prisma.jurnalGuru.count({ where: { guruId: id } });
  const jurnalPct = beban > 0 ? cap((jurnalCount / (beban * 4)) * 100) : null;
  const skor = g.rekapKinerja[0]?.skorAkhir ?? null;
  const nilaiKelas = nilaiAgg._avg.nilaiAkhir != null ? Math.round(nilaiAgg._avg.nilaiAkhir * 10) / 10 : null;
  const masaKerja = yearsSince(g.tmt);
  const pendidikanTop = [...g.pendidikan].sort((a, b) => Number(b.tahunLulus ?? 0) - Number(a.tahunLulus ?? 0))[0];
  const sertifPendidik = g.sertifikasi.find((s) => /sertifikasi pendidik/i.test(s.jenis));

  // karir timeline
  const tmtYear = g.tmt ? g.tmt.getFullYear() : null;
  const karir: KarirNode[] = [];
  if (tmtYear) karir.push({ year: `${tmtYear}—sekarang`, sort: 9999, type: "current", title: roleOf(g.jenisJabatan, g.mapelDiampu[0]?.namaMapel ?? null), sub: `${masaKerja} tahun mengabdi${g.rombelWali[0] ? ` · Wali ${g.rombelWali[0].nama}` : ""}.` });
  for (const s of g.sertifikasi) karir.push({ year: String(s.tahunTerbit), sort: s.tahunTerbit, type: /penghargaan/i.test(s.jenis) ? "award" : "cert", title: s.nama, sub: [s.penerbit, s.predikat].filter(Boolean).join(" · ") });
  for (const p of g.penghargaan) karir.push({ year: String(p.tahun), sort: p.tahun, type: "award", title: p.nama, sub: [p.pemberi, p.ranking].filter(Boolean).join(" · ") });
  for (const e of g.pendidikan) karir.push({ year: e.tahunLulus ?? "—", sort: Number(e.tahunLulus ?? 0), type: "education", title: `${e.jenjang}${e.jurusan ? ` ${e.jurusan}` : ""}`, sub: e.namaSekolah ?? "" });
  if (tmtYear) karir.push({ year: String(tmtYear), sort: tmtYear - 0.5, type: "cpns", title: "Pengangkatan", sub: `Mulai tugas di sekolah · Gol. awal ${g.golongan ?? "—"}` });
  karir.sort((a, b) => b.sort - a.sort);

  const jadwal: JadwalSlot[] = g.jadwalGuru.filter((j) => j.jamMulai && j.jamSelesai).map((j) => ({ hari: j.hari?.nama ?? "—", urut: j.hari?.urutan ?? 0, jamMulai: j.jamMulai!, jamSelesai: j.jamSelesai!, mapel: j.mapel ?? "—", kelas: j.rombel?.nama ?? null, wali: false }));

  // mapel ringkas (kelas count + jam dari jadwal)
  const mapelMap = new Map<string, { kelas: Set<string>; jam: number }>();
  for (const j of g.jadwalGuru) { const mk = j.mapel ?? "—"; const e = mapelMap.get(mk) ?? { kelas: new Set<string>(), jam: 0 }; if (j.rombel?.nama) e.kelas.add(j.rombel.nama); e.jam++; mapelMap.set(mk, e); }
  const mapel = [...mapelMap.entries()].map(([nama, v]) => ({ nama, kelas: v.kelas.size, jam: v.jam }));

  const now = new Date().getFullYear();
  const sertifikasi = g.sertifikasi.map((s) => ({ jenis: s.jenis, nama: s.nama, tahun: s.tahunTerbit, expired: s.tahunExpired, predikat: s.predikat, status: (s.tahunExpired == null ? "ok" : s.tahunExpired < now ? "expired" : s.tahunExpired <= now + 2 ? "soon" : "ok") as "ok" | "soon" | "expired" }));

  return {
    id: g.id, nama: g.namaGuru, inisial: inisial(g.namaGuru), foto: g.foto, role: roleOf(g.jenisJabatan, g.mapelDiampu[0]?.namaMapel ?? null), bidang: bidangOf(g.mapelDiampu[0]?.namaMapel ?? null),
    status: g.statusGuru ?? "GTT", golongan: g.golongan, jk: g.jenisKelamin, nip: g.nip ?? "—", nuptk: g.nuptk ?? "—", email: g.email, noTelp: g.noTelp, alamat: g.alamat,
    masaKerja, pendidikanTop: pendidikanTop ? `${pendidikanTop.jenjang} ${pendidikanTop.namaSekolah ?? ""}`.trim() : null, sertifTahun: sertifPendidik?.tahunTerbit ?? null,
    isKepsek: /kepala sekolah/i.test(g.jenisJabatan ?? ""),
    strip: { beban, bebanStatus: bebanStat(beban), jurnalPct, siswaDiampu, evalRate: skor != null ? Math.round((skor / 20) * 10) / 10 : null, nilaiKelas, penghargaan: g.penghargaan.length, jurnalSesi: jurnalCount },
    impact: { siswa: siswaDiampu, nilai: nilaiKelas, penghargaan: g.penghargaan.length, penghargaanTop: g.penghargaan[0]?.nama ?? null, masaKerja, angkatan: Math.max(1, Math.floor(masaKerja / 1)) },
    karir, jadwal, mapel,
    waliKelas: g.rombelWali[0]?.nama ?? null, waliSiswa,
    prestasiSiswa: (prestasiRows as { namaLengkap: string; prestasi: { namaPrestasi: string }[]; anggotaRombel: { rombel: { nama: string } | null }[] }[]).map((s) => ({ nama: s.namaLengkap, kelas: s.anggotaRombel[0]?.rombel?.nama ?? null, prestasi: s.prestasi[0]?.namaPrestasi ?? "—" })),
    heatmap: jurnalDates.map((j) => j.tanggal.toISOString().slice(0, 10)),
    jurnalRecent: jurnalRecent.map((j) => ({ tanggal: j.tanggal.toISOString().slice(0, 10), kelas: j.kelas ?? "—", mapel: j.mapel ?? "—", materi: j.materi ?? "—" })),
    akun: g.user ? { username: g.user.username, aktif: g.user.isActive, lastLogin: g.user.lastLoginAt?.toISOString() ?? null } : null,
    sertifikasi, sertifWarn: sertifikasi.filter((s) => s.status !== "ok").length,
  };
}
