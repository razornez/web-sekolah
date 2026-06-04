"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

export type JadwalFormState = {
  ok: boolean;
  error?: string;
  conflicts?: {
    type: "guru" | "rombel";
    label: string; // nama guru atau nama rombel
    existing: { mapel: string | null; jamMulai: string | null; jamSelesai: string | null };
  }[];
};

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

// Cek apakah dua rentang waktu overlap: [s1,e1) vs [s2,e2)
// String "HH:MM" bisa dibandingkan lexicographic karena format konsisten
function timeOverlap(
  s1: string | null, e1: string | null,
  s2: string | null, e2: string | null,
): boolean {
  if (!s1 || !e1 || !s2 || !e2) return s1 === s2; // tanpa jam selesai, cek exact
  return s1 < e2 && s2 < e1;
}

export async function saveJadwal(
  _prev: JadwalFormState,
  formData: FormData,
): Promise<JadwalFormState> {
  const sekolahId = await requireStaff();

  const guruId = Number(formData.get("guruId"));
  const namaHari = String(formData.get("hariNama") ?? "");
  const jamMulai = str(formData.get("jamMulai"));
  const jamSelesai = str(formData.get("jamSelesai"));
  const mapel = str(formData.get("mapel"));
  const rombelId = Number(formData.get("rombelId")) || null;

  if (!guruId) return { ok: false, error: "Guru wajib dipilih." };
  if (!HARI.includes(namaHari)) return { ok: false, error: "Hari tidak valid." };

  const guru = await prisma.guru.findFirst({
    where: { id: guruId, sekolahId },
    select: { id: true, namaGuru: true },
  });
  if (!guru) return { ok: false, error: "Guru tidak ditemukan." };

  // Find or create Hari
  let hari = await prisma.hari.findFirst({ where: { sekolahId, nama: namaHari }, select: { id: true } });
  if (!hari) {
    hari = await prisma.hari.create({
      data: { sekolahId, nama: namaHari, urutan: HARI.indexOf(namaHari) + 1 },
      select: { id: true },
    });
  }

  // --- Cek konflik ---
  const existing = await prisma.jadwalGuru.findMany({
    where: {
      sekolahId,
      hariId: hari.id,
      OR: [
        { guruId },
        ...(rombelId ? [{ rombelId }] : []),
      ],
    },
    select: {
      id: true, guruId: true, rombelId: true,
      mapel: true, jamMulai: true, jamSelesai: true,
      guru: { select: { namaGuru: true } },
      rombel: { select: { nama: true } },
    },
  });

  const conflicts: JadwalFormState["conflicts"] = [];

  for (const ex of existing) {
    if (!timeOverlap(jamMulai, jamSelesai, ex.jamMulai, ex.jamSelesai)) continue;

    if (ex.guruId === guruId) {
      conflicts.push({
        type: "guru",
        label: guru.namaGuru,
        existing: { mapel: ex.mapel, jamMulai: ex.jamMulai, jamSelesai: ex.jamSelesai },
      });
    }
    if (rombelId && ex.rombelId === rombelId) {
      conflicts.push({
        type: "rombel",
        label: ex.rombel?.nama ?? String(rombelId),
        existing: { mapel: ex.mapel, jamMulai: ex.jamMulai, jamSelesai: ex.jamSelesai },
      });
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, error: "Jadwal bentrok terdeteksi.", conflicts };
  }

  // --- Simpan ---
  await prisma.jadwalGuru.create({
    data: { sekolahId, guruId, hariId: hari.id, rombelId, mapel, jamMulai, jamSelesai },
  });
  revalidatePath("/jadwal");
  return { ok: true };
}

export async function deleteJadwal(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.jadwalGuru.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/jadwal");
}

export const deleteJadwalAction = deleteJadwal;
