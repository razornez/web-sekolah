// Seed: foto dummy (DiceBear, avatar ilustrasi — bukan wajah asli), koordinat rumah/sekolah,
// + lengkapi P5 & catatan wali untuk siswa showcase. Idempotent.
// Jalankan: node --env-file=.env prisma/seed-foto-geo.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SEKOLAH_ID = 2;
const SHOWCASE = 146;
// Titik sekolah (Bandung). Siswa disebar ~0.3–5 km di sekitarnya.
const SCHOOL = { lat: -6.9175, lng: 107.6191 };
const dicebear = (nama, jk) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(nama)}&radius=12&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

async function main() {
  // 1. Koordinat sekolah
  await prisma.sekolah.update({ where: { id: SEKOLAH_ID }, data: { lat: SCHOOL.lat, lng: SCHOOL.lng } });

  // 2. Foto + koordinat rumah utk semua siswa aktif
  const siswa = await prisma.siswa.findMany({ where: { sekolahId: SEKOLAH_ID, status: "aktif" }, select: { id: true, namaLengkap: true, jenisKelamin: true, foto: true, lat: true } });
  let foto = 0, geo = 0;
  for (const s of siswa) {
    const data = {};
    if (!s.foto) { data.foto = dicebear(s.namaLengkap, s.jenisKelamin); foto++; }
    if (s.lat == null) {
      data.lat = SCHOOL.lat + (Math.random() - 0.5) * 0.08; // ±~4.4 km
      data.lng = SCHOOL.lng + (Math.random() - 0.5) * 0.08;
      geo++;
    }
    if (Object.keys(data).length) await prisma.siswa.update({ where: { id: s.id }, data });
  }
  console.log(`foto di-set: ${foto} | koordinat di-set: ${geo} | total siswa: ${siswa.length}`);

  // 3. Showcase 146: lengkapi P5 + catatan wali kalau kosong
  const p5count = await prisma.penilaianP5.count({ where: { siswaId: SHOWCASE } });
  if (p5count === 0) {
    const projek = await prisma.projekP5.findMany({ where: { sekolahId: SEKOLAH_ID }, take: 2, include: { target: { include: { elemen: true }, take: 4 } } });
    const PRED = ["BSH", "SAB", "MB", "SB"];
    let made = 0;
    for (const pr of projek) {
      const elemenIds = pr.target.map((t) => t.elemenId);
      const uniq = [...new Set(elemenIds)].slice(0, 4);
      for (let i = 0; i < uniq.length; i++) {
        try {
          await prisma.penilaianP5.create({ data: { projekP5Id: pr.id, siswaId: SHOWCASE, elemenId: uniq[i], predikat: PRED[i % PRED.length] } });
          made++;
        } catch { /* unique skip */ }
      }
    }
    console.log(`P5 showcase dibuat: ${made}`);
  } else console.log(`P5 showcase sudah ada: ${p5count}`);

  const lastNilai = await prisma.nilaiRapor.findFirst({ where: { siswaId: SHOWCASE, nilaiAkhir: { not: null } }, orderBy: { periodeId: "desc" }, select: { periodeId: true } });
  if (lastNilai) {
    const exist = await prisma.raporCatatan.findFirst({ where: { siswaId: SHOWCASE, periodeId: lastNilai.periodeId } });
    if (!exist) {
      await prisma.raporCatatan.create({ data: { sekolahId: SEKOLAH_ID, siswaId: SHOWCASE, periodeId: lastNilai.periodeId, catatan: "Ananda menunjukkan kemajuan luar biasa, terutama pada bidang sains. Kepribadian tenang dan empatik menjadikannya teladan. Saran: pertahankan konsistensi belajar dan lebih aktif berdiskusi untuk melatih komunikasi publik.", sikap: "Sangat Baik" } });
      console.log("Catatan wali showcase dibuat.");
    } else console.log("Catatan wali showcase sudah ada.");
  }
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
