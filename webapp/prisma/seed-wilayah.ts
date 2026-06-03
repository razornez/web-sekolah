/**
 * Seed data wilayah Indonesia dari wilayah.id API.
 * - Provinsi (34 baris) + Kabupaten/Kota (514 baris) → seed PENUH upfront.
 * - Kecamatan + Kelurahan → lazy-cache saat pertama kali diminta (via API route).
 *
 * Jalankan: npm run seed:wilayah
 * Estimasi waktu: 1-3 menit (tergantung koneksi)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://wilayah.id/api";

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      // wilayah.id wraps: { data: [...] }
      return (Array.isArray(json) ? json : (json?.data ?? json)) as T;
    } catch (err) {
      if (i < retries - 1) { await new Promise((r) => setTimeout(r, 1000 * (i + 1))); continue; }
      throw err;
    }
  }
  throw new Error("Max retries reached");
}

async function main() {
  console.log("🗺  Seed Wilayah Indonesia mulai...");

  // ── Provinsi ─────────────────────────────────────────────────────────────
  const existing = await prisma.refProvinsi.count();
  if (existing >= 30) { console.log(`  Provinsi sudah ada (${existing} baris) — skip.`); }
  else {
    type Prov = { code: string; name: string };
    const provData = await fetchJson<Prov[]>(`${BASE}/provinces.json`);
    await prisma.refProvinsi.createMany({
      data: provData.map((p) => ({ kode: p.code, nama: p.name })),
      skipDuplicates: true,
    });
    console.log(`  ✓ Provinsi: ${provData.length} baris`);
  }

  // ── Kabupaten/Kota (satu request per provinsi, paralel 5) ─────────────────
  const provinsiAll = await prisma.refProvinsi.findMany({ select: { kode: true } });
  const existingKab = await prisma.refKabupaten.count();
  if (existingKab >= 500) { console.log(`  Kabupaten sudah ada (${existingKab} baris) — skip.`); }
  else {
    type Kab = { code: string; province_code: string; name: string };
    let totalKab = 0;
    const BATCH = 5;
    for (let i = 0; i < provinsiAll.length; i += BATCH) {
      const batch = provinsiAll.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((p) => fetchJson<Kab[]>(`${BASE}/regencies/${p.kode}.json`).then(async (data) => {
          if (!Array.isArray(data) || data.length === 0) return 0;
          await prisma.refKabupaten.createMany({ data: data.map((k) => ({ kode: k.code, provinsiId: p.kode, nama: k.name })), skipDuplicates: true });
          return data.length;
        })),
      );
      totalKab += results.reduce((s, r) => s + (r.status === "fulfilled" ? r.value : 0), 0);
      process.stdout.write(`\r  Kabupaten: ${totalKab} baris (provinsi ${Math.min(i + BATCH, provinsiAll.length)}/${provinsiAll.length})...`);
    }
    console.log(`\n  ✓ Kabupaten: ${totalKab} baris total`);
  }

  console.log("\n✅  Seed wilayah selesai!");
  console.log("   Kecamatan & kelurahan/kode pos akan di-cache otomatis saat pertama dipilih.");
  console.log("   Atau jalankan: npm run seed:wilayah:full  (untuk seed semua kecamatan+kelurahan terlebih dahulu)");
}

main()
  .catch((e) => { console.error("\n❌ Error:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
