/**
 * Seed data presensi siswa — bervariasi tapi mostly hadir.
 * Run: node prisma/seed-presensi.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HARI_DOW = { Minggu:0,Senin:1,Selasa:2,Rabu:3,Kamis:4,Jumat:5,Sabtu:6 };

// Hash deterministik (siswaId + tanggal → status)
function hashNum(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Profil kehadiran per siswa: beberapa rajin, beberapa sering absen
function getSiswaProfile(siswaId) {
  const r = hashNum(`profile-${siswaId}`) % 100;
  if (r < 10) return "rajin";     // hadir 95%
  if (r < 25) return "baik";      // hadir 88%
  if (r < 60) return "normal";    // hadir 83%
  if (r < 80) return "sesekali";  // hadir 73%
  if (r < 93) return "sering";    // hadir 62%
  return "bermasalah";            // hadir 45%
}

// Distribusi status berdasarkan profil
const PROFILE_DIST = {
  rajin:       [95, 2,  1,  1,  1],   // hadir,terlambat,izin,sakit,alpa
  baik:        [88, 4,  2,  3,  3],
  normal:      [83, 5,  3,  5,  4],
  sesekali:    [73, 5,  6,  8,  8],
  sering:      [62, 5,  8, 12, 13],
  bermasalah:  [45, 5, 12, 15, 23],
};

const STATUS_KEYS = ["hadir","terlambat","izin","sakit","alpa"];

function getStatus(siswaId, dateStr) {
  const profile = getSiswaProfile(siswaId);
  const dist = PROFILE_DIST[profile];
  const h = hashNum(`${siswaId}-${dateStr}`) % 100;
  let cum = 0;
  for (let i = 0; i < dist.length; i++) {
    cum += dist[i];
    if (h < cum) return STATUS_KEYS[i];
  }
  return "hadir";
}

function occurrenceDates(hariNama, from, to) {
  const target = HARI_DOW[hariNama] ?? 1;
  const dates = [];
  const cur = new Date(from);
  cur.setHours(0,0,0,0);
  while (cur.getDay() !== target) cur.setDate(cur.getDate() + 1);
  while (cur <= to) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

function isoDate(d) { return d.toISOString().slice(0,10); }

async function main() {
  const sekolahId = 2; // SEKOLAH NUSANTARA
  const today = new Date();
  today.setHours(0,0,0,0);

  // Cari periode aktif
  const periode = await prisma.periode.findFirst({
    where: { aktif: true, tahunAjaran: { sekolahId } },
    select: { tanggalMulai: true, tanggalSelesai: true, nama: true },
  });

  let semStart, semEnd;
  if (periode?.tanggalMulai && periode?.tanggalSelesai) {
    semStart = periode.tanggalMulai;
    semEnd = periode.tanggalSelesai < today ? periode.tanggalSelesai : today;
    console.log(`Periode: ${periode.nama} (${isoDate(semStart)} – ${isoDate(semEnd)})`);
  } else {
    const ta = await prisma.tahunAjaran.findFirst({ where: { sekolahId, aktif: true } });
    const yr = ta ? parseInt(ta.tahun.slice(0,4)) : today.getFullYear() - (today.getMonth() < 6 ? 1 : 0);
    semStart = new Date(yr, 6, 14);
    const semMax = new Date(semStart); semMax.setDate(semMax.getDate() + 16*7);
    semEnd = semMax < today ? semMax : today;
    console.log(`Fallback: ${isoDate(semStart)} – ${isoDate(semEnd)}`);
  }

  // Semua jadwal dengan rombel + anggota
  const jadwalList = await prisma.jadwalGuru.findMany({
    where: { sekolahId, rombelId: { not: null } },
    include: {
      hari: { select: { nama: true } },
      rombel: {
        include: {
          anggota: { select: { siswaId: true } },
        },
      },
    },
  });

  console.log(`Jadwal ditemukan: ${jadwalList.length}`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const jadwal of jadwalList) {
    if (!jadwal.rombel) continue;
    const anggota = jadwal.rombel.anggota;
    if (anggota.length === 0) continue;

    const dates = occurrenceDates(jadwal.hari.nama, semStart, semEnd);
    if (dates.length === 0) continue;

    console.log(`\n  ${jadwal.mapel ?? "?"} – ${jadwal.rombel.nama} (${jadwal.hari.nama}, ${dates.length} pertemuan, ${anggota.length} siswa)`);

    // Cek yang sudah ada
    const siswaIds = anggota.map(a => a.siswaId);
    const existing = await prisma.kehadiranSiswa.findMany({
      where: {
        sekolahId,
        siswaId: { in: siswaIds },
        tanggal: { gte: dates[0], lte: dates[dates.length - 1] },
      },
      select: { siswaId: true, tanggal: true },
    });
    const existingSet = new Set(existing.map(e => `${e.siswaId}-${isoDate(e.tanggal)}`));

    // Batch upsert
    const toCreate = [];
    for (const date of dates) {
      const dateStr = isoDate(date);
      for (const { siswaId } of anggota) {
        const key = `${siswaId}-${dateStr}`;
        if (existingSet.has(key)) { totalSkipped++; continue; }
        toCreate.push({
          sekolahId,
          siswaId,
          tanggal: date,
          status: getStatus(siswaId, dateStr),
        });
      }
    }

    if (toCreate.length === 0) {
      console.log(`    → semua sudah ada (${existingSet.size} records)`);
      continue;
    }

    // Batch insert per 500
    const BATCH = 500;
    for (let i = 0; i < toCreate.length; i += BATCH) {
      await prisma.kehadiranSiswa.createMany({
        data: toCreate.slice(i, i + BATCH),
        skipDuplicates: true,
      });
    }
    totalCreated += toCreate.length;
    console.log(`    → dibuat ${toCreate.length} records`);
  }

  console.log(`\n✓ Selesai: ${totalCreated} records baru, ${totalSkipped} dilewati (sudah ada)`);

  // Statistik
  const stats = await prisma.kehadiranSiswa.groupBy({
    by: ["status"],
    where: { sekolahId },
    _count: { _all: true },
    orderBy: { status: "asc" },
  });
  console.log("\nDistribusi kehadiran:");
  for (const s of stats) console.log(`  ${s.status}: ${s._count._all.toLocaleString()}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
