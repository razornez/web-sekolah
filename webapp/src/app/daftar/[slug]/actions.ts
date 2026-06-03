"use server";

import { StatusPpdb } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pendaftaranPpdbSchema } from "@/lib/validations";

/** Submit PPDB dari form PUBLIK (tanpa login). Tenant via slug sekolah. */
export async function submitPendaftaran(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  const sekolah = await prisma.sekolah.findUnique({ where: { slug }, select: { id: true } });
  if (!sekolah) redirect(`/daftar/${slug}?error=1`);

  const parsed = pendaftaranPpdbSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/daftar/${slug}?error=1`);
  const d = parsed.data;

  // Validasi jalur milik sekolah ini (jika dipilih)
  let jalurId = d.jalurId;
  if (jalurId) {
    const j = await prisma.jalurPpdb.findFirst({ where: { id: jalurId, sekolahId: sekolah.id }, select: { id: true } });
    if (!j) jalurId = null;
  }

  await prisma.pendaftaranPpdb.create({
    data: {
      sekolahId: sekolah.id,
      jalurId,
      namaLengkap: d.namaLengkap,
      jenisKelamin: d.jenisKelamin,
      nisn: d.nisn,
      tempatLahir: d.tempatLahir,
      tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : null,
      asalSekolah: d.asalSekolah,
      noHp: d.noHp,
      status: StatusPpdb.baru,
    },
  });
  redirect(`/daftar/${slug}?ok=1`);
}
