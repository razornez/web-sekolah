import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Jenjang, Kurikulum } from "@prisma/client";

/** Lama masa demo (jam) sebelum data otomatis dihapus. */
export const DEMO_DURATION_HOURS = 24;

const JENJANG_VALUES: Jenjang[] = ["PAUD", "TK", "SD", "MI", "SMP", "MTS", "SMA", "MA", "SMK"];

/** Map label form → enum Jenjang + daftar tingkat default. */
function mapJenjang(label: string): { jenjang: Jenjang; tingkat: string[] } {
  const l = (label || "").toUpperCase();
  if (l.includes("PAUD") || l.includes("TK")) return { jenjang: "TK", tingkat: ["A", "B"] };
  if (l.includes("SD") || l.includes("MI")) return { jenjang: "SD", tingkat: ["1", "2", "3", "4", "5", "6"] };
  if (l.includes("SMP") || l.includes("MTS")) return { jenjang: "SMP", tingkat: ["VII", "VIII", "IX"] };
  if (l.includes("SMK")) return { jenjang: "SMK", tingkat: ["X", "XI", "XII"] };
  return { jenjang: "SMA", tingkat: ["X", "XI", "XII"] };
}

/** Slug unik dari nama sekolah (a-z0-9-), tambah angka bila bentrok. */
async function uniqueSlug(nama: string): Promise<string> {
  const base =
    nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "sekolah";
  let slug = base;
  let n = 1;
  // batasi iterasi
  while (n < 100) {
    const exists = await prisma.sekolah.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${n}`;
    n++;
  }
  return `${base}-${Date.now()}`;
}

export type ProvisionInput = {
  namaSekolah: string;
  jenjangLabel: string;
  namaPic: string;
  username: string;
  password: string;
  email?: string | null;
  telepon?: string | null;
  kurikulum?: Kurikulum;
};

export type ProvisionResult = { sekolahId: number; slug: string; username: string };

/**
 * Buat tenant DEMO baru + akun admin + master data minimal agar langsung bisa dipakai.
 * Sekolah ditandai isDemo=true, demoExpiresAt = now + 24 jam.
 */
export async function provisionDemoSekolah(input: ProvisionInput): Promise<ProvisionResult> {
  const { jenjang, tingkat } = mapJenjang(input.jenjangLabel);
  const slug = await uniqueSlug(input.namaSekolah);
  const username = input.username.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const expires = new Date(Date.now() + DEMO_DURATION_HOURS * 60 * 60 * 1000);

  // Tahun ajaran berjalan, mis. "2025/2026" berdasarkan bulan (Juli = awal TA)
  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const tahun = `${startYear}/${startYear + 1}`;

  return prisma.$transaction(async (tx) => {
    const sekolah = await tx.sekolah.create({
      data: {
        nama: input.namaSekolah.trim(),
        jenjang: JENJANG_VALUES.includes(jenjang) ? jenjang : "SMA",
        kurikulumDefault: input.kurikulum ?? "MERDEKA",
        slug,
        email: input.email ?? null,
        telepon: input.telepon ?? null,
        isDemo: true,
        demoExpiresAt: expires,
      },
      select: { id: true },
    });

    // Akun admin
    await tx.user.create({
      data: {
        sekolahId: sekolah.id,
        username,
        namaLengkap: input.namaPic.trim(),
        email: input.email ?? null,
        role: "admin",
        passwordHash,
        isActive: true,
      },
    });

    // Master minimal: Tingkat, Hari, Tahun Ajaran + 2 Periode (Ganjil aktif)
    await tx.tingkat.createMany({
      data: tingkat.map((nama, i) => ({ sekolahId: sekolah.id, nama, urutan: i + 1 })),
    });
    await tx.hari.createMany({
      data: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((nama, i) => ({ sekolahId: sekolah.id, nama, urutan: i + 1 })),
    });
    const ta = await tx.tahunAjaran.create({
      data: { sekolahId: sekolah.id, tahun, aktif: true },
      select: { id: true },
    });
    await tx.periode.createMany({
      data: [
        { tahunAjaranId: ta.id, nama: "Semester Ganjil", urutan: 1, aktif: true,
          tanggalMulai: new Date(Date.UTC(startYear, 6, 1)), tanggalSelesai: new Date(Date.UTC(startYear, 11, 31)) },
        { tahunAjaranId: ta.id, nama: "Semester Genap", urutan: 2, aktif: false,
          tanggalMulai: new Date(Date.UTC(startYear + 1, 0, 1)), tanggalSelesai: new Date(Date.UTC(startYear + 1, 5, 30)) },
      ],
    });

    return { sekolahId: sekolah.id, slug, username };
  });
}
