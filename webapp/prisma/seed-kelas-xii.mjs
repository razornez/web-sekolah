/**
 * Lengkapi lifecycle: buat rombel kelas XII + enroll siswa aktif yang belum punya kelas.
 * Idempotent: skip jika XII sudah ada. Run: node prisma/seed-kelas-xii.mjs
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const SID = 2;

function namaToKode(n) { return n.trim().toUpperCase().replace(/\s+/g, "-"); }

async function main() {
  const ta = await p.tahunAjaran.findFirst({ where: { sekolahId: SID, aktif: true }, select: { id: true, tahun: true } });
  const tingkatXII = await p.tingkat.findFirst({ where: { sekolahId: SID, nama: "XII" }, select: { id: true } });
  if (!ta || !tingkatXII) { console.log("⚠ TA aktif / tingkat XII tidak ada"); return; }

  const existingXII = await p.rombel.count({ where: { sekolahId: SID, tingkatId: tingkatXII.id } });
  if (existingXII > 0) { console.log(`✓ Rombel XII sudah ada (${existingXII}), skip pembuatan`); }

  const guru = await p.guru.findMany({ where: { sekolahId: SID, deletedAt: null }, select: { id: true }, orderBy: { namaGuru: "asc" } });

  // Siswa aktif tanpa kelas
  const enrolled = new Set((await p.anggotaRombel.findMany({ where: { rombel: { sekolahId: SID } }, select: { siswaId: true } })).map(a => a.siswaId));
  const unenrolled = await p.siswa.findMany({
    where: { sekolahId: SID, deletedAt: null, status: "aktif", id: { notIn: [...enrolled] } },
    select: { id: true, namaLengkap: true },
    orderBy: { namaLengkap: "asc" },
  });
  console.log(`Siswa aktif tanpa kelas: ${unenrolled.length}`);

  if (unenrolled.length === 0) { console.log("✓ Semua siswa sudah punya kelas"); p.$disconnect(); return; }

  // Buat rombel XII secukupnya (~36 siswa/kelas)
  const PER_CLASS = 36;
  const needClasses = Math.ceil(unenrolled.length / PER_CLASS);
  // Pola nama: XII IPA 1.. lalu XII IPS 1..
  const names = [];
  const ipaCount = Math.ceil(needClasses * 0.7);
  const ipsCount = needClasses - ipaCount;
  for (let i = 1; i <= ipaCount; i++) names.push(`XII IPA ${i}`);
  for (let i = 1; i <= ipsCount; i++) names.push(`XII IPS ${i}`);

  const createdRombel = [];
  for (let i = 0; i < names.length; i++) {
    const nama = names[i];
    let r = await p.rombel.findFirst({ where: { sekolahId: SID, nama, tahunAjaranId: ta.id }, select: { id: true } });
    if (!r) {
      r = await p.rombel.create({
        data: {
          sekolahId: SID, nama, kodeKelas: namaToKode(nama),
          tahunAjaranId: ta.id, tingkatId: tingkatXII.id,
          waliGuruId: guru.length ? guru[i % guru.length].id : null,
        },
        select: { id: true },
      });
    }
    createdRombel.push(r.id);
  }
  console.log(`✓ Rombel XII: ${createdRombel.length} kelas (${names.join(", ")})`);

  // Enroll siswa tanpa kelas → distribusi ke rombel XII
  let idx = 0;
  const perClassAbsen = {};
  for (const s of unenrolled) {
    const rombelId = createdRombel[idx % createdRombel.length];
    perClassAbsen[rombelId] = (perClassAbsen[rombelId] || 0) + 1;
    await p.anggotaRombel.create({
      data: { rombelId, siswaId: s.id, nomorAbsen: perClassAbsen[rombelId] },
    });
    idx++;
  }
  console.log(`✓ Enroll: ${unenrolled.length} siswa dimasukkan ke ${createdRombel.length} rombel XII`);

  // Ringkasan
  const totalRombel = await p.rombel.count({ where: { sekolahId: SID } });
  const stillUnenrolled = await p.siswa.count({
    where: { sekolahId: SID, deletedAt: null, status: "aktif", anggotaRombel: { none: {} } },
  });
  console.log(`\nTotal rombel: ${totalRombel} | Siswa aktif tanpa kelas: ${stillUnenrolled}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
