"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

// ── Tahun Ajaran ────────────────────────────────────────────────────────────

export async function saveTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const tahun = (formData.get("tahun") as string ?? "").trim();
  if (!tahun) return;

  if (id) {
    await prisma.tahunAjaran.updateMany({ where: { id, sekolahId }, data: { tahun } });
  } else {
    await prisma.tahunAjaran.create({ data: { sekolahId, tahun } });
  }
  revalidatePath("/pengaturan/akademik");
}

export async function setTahunAjaranAktif(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.$transaction([
    prisma.tahunAjaran.updateMany({ where: { sekolahId }, data: { aktif: false } }),
    prisma.tahunAjaran.updateMany({ where: { id, sekolahId }, data: { aktif: true } }),
  ]);
  revalidatePath("/pengaturan/akademik");
}

export async function deleteTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  // Cek apakah ada rombel yang pakai TA ini
  const count = await prisma.rombel.count({ where: { tahunAjaranId: id, sekolahId } });
  if (count > 0) return; // jangan hapus kalau sudah dipakai
  await prisma.tahunAjaran.deleteMany({ where: { id, sekolahId } });
  revalidatePath("/pengaturan/akademik");
}

// ── Periode ─────────────────────────────────────────────────────────────────

export async function savePeriode(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  const nama = (formData.get("nama") as string ?? "").trim();
  const urutan = Number(formData.get("urutan")) || 1;
  const tanggalMulaiStr = (formData.get("tanggalMulai") as string ?? "").trim();
  const tanggalSelesaiStr = (formData.get("tanggalSelesai") as string ?? "").trim();

  if (!tahunAjaranId || !nama) return;

  // Verify ownership
  const ta = await prisma.tahunAjaran.findFirst({ where: { id: tahunAjaranId, sekolahId }, select: { id: true } });
  if (!ta) return;

  const data = {
    nama,
    urutan,
    tanggalMulai: tanggalMulaiStr ? new Date(tanggalMulaiStr) : null,
    tanggalSelesai: tanggalSelesaiStr ? new Date(tanggalSelesaiStr) : null,
  };

  if (id) {
    await prisma.periode.updateMany({ where: { id, tahunAjaranId }, data });
  } else {
    await prisma.periode.create({ data: { ...data, tahunAjaranId, jenis: "semester" } });
  }
  revalidatePath("/pengaturan/akademik");
}

export async function setPeriodeAktif(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  if (!id || !tahunAjaranId) return;

  // Verify ownership
  const ta = await prisma.tahunAjaran.findFirst({ where: { id: tahunAjaranId, sekolahId }, select: { id: true } });
  if (!ta) return;

  await prisma.$transaction([
    // Non-aktifkan semua periode di sekolah ini
    prisma.periode.updateMany({
      where: { tahunAjaran: { sekolahId } },
      data: { aktif: false },
    }),
    // Aktifkan yang dipilih
    prisma.periode.updateMany({ where: { id, tahunAjaranId }, data: { aktif: true } }),
    // Aktifkan juga TA-nya
    prisma.tahunAjaran.updateMany({ where: { sekolahId }, data: { aktif: false } }),
    prisma.tahunAjaran.updateMany({ where: { id: tahunAjaranId, sekolahId }, data: { aktif: true } }),
  ]);
  revalidatePath("/pengaturan/akademik");
}

export async function deletePeriode(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  const count = await prisma.nilaiRapor.count({ where: { periodeId: id } });
  if (count > 0) return;
  await prisma.periode.deleteMany({ where: { id, tahunAjaran: { sekolahId } } });
  revalidatePath("/pengaturan/akademik");
}

/** Update tanggal mulai/selesai periode yang sudah ada */
export async function updatePeriodeTanggal(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  const tanggalMulaiStr = (formData.get("tanggalMulai") as string ?? "").trim();
  const tanggalSelesaiStr = (formData.get("tanggalSelesai") as string ?? "").trim();
  if (!id) return;

  const existing = await prisma.periode.findFirst({
    where: { id, tahunAjaran: { sekolahId } }, select: { id: true },
  });
  if (!existing) return;

  await prisma.periode.update({
    where: { id },
    data: {
      tanggalMulai: tanggalMulaiStr ? new Date(tanggalMulaiStr) : null,
      tanggalSelesai: tanggalSelesaiStr ? new Date(tanggalSelesaiStr) : null,
    },
  });
  revalidatePath("/pengaturan/akademik");
}

/**
 * Auto-isi kalender tipikal Indonesia per TahunAjaran:
 * Semester Ganjil: 15 Juli s.d. 20 Desember (tahun pertama)
 * Semester Genap:  6 Januari s.d. 20 Juni (tahun kedua)
 * Jika periode sudah ada, hanya update tanggal yang kosong.
 */
export async function autoIsiKalender(formData: FormData) {
  const sekolahId = await requireStaff();
  const tahunAjaranId = Number(formData.get("tahunAjaranId"));
  if (!tahunAjaranId) return;

  const ta = await prisma.tahunAjaran.findFirst({
    where: { id: tahunAjaranId, sekolahId },
    include: { periode: { orderBy: { urutan: "asc" } } },
  });
  if (!ta) return;

  // Parse "2024/2025" → year1=2024, year2=2025
  const [y1, y2] = ta.tahun.split("/").map(Number);
  if (!y1 || !y2) return;

  const TEMPLATE = [
    {
      nama: "Semester Ganjil", urutan: 1,
      mulai: new Date(y1, 6, 15),   // 15 Juli
      selesai: new Date(y1, 11, 20), // 20 Desember
    },
    {
      nama: "Semester Genap", urutan: 2,
      mulai: new Date(y2, 0, 6),    // 6 Januari
      selesai: new Date(y2, 5, 20), // 20 Juni
    },
  ];

  for (const tmpl of TEMPLATE) {
    const existing = ta.periode.find((p) =>
      p.nama.toLowerCase().includes(tmpl.nama.toLowerCase().split(" ")[1]) ||
      p.urutan === tmpl.urutan,
    );

    if (existing) {
      // Update tanggal hanya kalau masih kosong
      if (!existing.tanggalMulai || !existing.tanggalSelesai) {
        await prisma.periode.update({
          where: { id: existing.id },
          data: {
            tanggalMulai: existing.tanggalMulai ?? tmpl.mulai,
            tanggalSelesai: existing.tanggalSelesai ?? tmpl.selesai,
          },
        });
      }
    } else {
      // Buat baru
      await prisma.periode.create({
        data: {
          tahunAjaranId,
          nama: tmpl.nama,
          urutan: tmpl.urutan,
          jenis: "semester",
          tanggalMulai: tmpl.mulai,
          tanggalSelesai: tmpl.selesai,
        },
      });
    }
  }
  revalidatePath("/pengaturan/akademik");
}
