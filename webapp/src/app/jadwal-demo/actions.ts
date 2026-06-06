"use server";

import { prisma } from "@/lib/prisma";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export type DemoState = { ok: boolean; error?: string };

/** Lead "Jadwalkan Demo" — simpan ke pendaftaran_sekolah (tipe jadwal_demo). */
export async function kirimJadwalDemo(_prev: DemoState, formData: FormData): Promise<DemoState> {
  const namaPic = str(formData.get("nama"));
  const namaSekolah = str(formData.get("namaSekolah"));
  const email = str(formData.get("email"));
  const telepon = str(formData.get("telepon"));
  if (!namaPic || !namaSekolah || (!email && !telepon)) return { ok: false, error: "required" };

  const tgl = str(formData.get("tanggal"));
  const jam = str(formData.get("jam"));
  let jadwalAt: Date | null = null;
  if (tgl) {
    const d = new Date(`${tgl}T${jam ?? "09:00"}:00`);
    if (!isNaN(d.getTime())) jadwalAt = d;
  }

  try {
    await prisma.pendaftaranSekolah.create({
      data: {
        namaSekolah, namaPic, email, telepon,
        catatan: str(formData.get("catatan")),
        tipe: "jadwal_demo",
        jadwalAt,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
