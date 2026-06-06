"use server";

import { prisma } from "@/lib/prisma";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export type RegState = { ok: boolean; error?: string };

/**
 * Lead pendaftaran sekolah dari landing (publik, tanpa auth).
 * Menyimpan minat; aktivasi tenant diproses manual oleh platform.
 */
export async function daftarSekolah(_prev: RegState, formData: FormData): Promise<RegState> {
  const namaSekolah = str(formData.get("namaSekolah"));
  const namaPic = str(formData.get("namaPic"));
  const email = str(formData.get("email"));
  const telepon = str(formData.get("telepon"));

  // Validasi minimal: nama sekolah, PIC, dan salah satu kontak
  if (!namaSekolah || !namaPic || (!email && !telepon)) {
    return { ok: false, error: "required" };
  }

  try {
    await prisma.pendaftaranSekolah.create({
      data: {
        namaSekolah,
        jenjang: str(formData.get("jenjang")),
        jumlahSiswa: str(formData.get("jumlahSiswa")),
        namaPic,
        jabatan: str(formData.get("jabatan")),
        email,
        telepon,
        kota: str(formData.get("kota")),
        paket: str(formData.get("paket")),
        catatan: str(formData.get("catatan")),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
