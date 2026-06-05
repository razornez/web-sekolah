"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { catchDeleteError } from "@/lib/deleteError";
import { auditLog } from "@/lib/audit";

// ── Tahun Ajaran ────────────────────────────────────────────────────────────

export async function saveTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const tahun = (formData.get("tahun") as string ?? "").trim();
  if (!tahun) return;

  if (id) {
    await prisma.tahunAjaran.updateMany({ where: { id, sekolahId }, data: { tahun } });
    await auditLog({ aksi: "update", entitas: "tahun_ajaran", entitasId: id, detail: `Update tahun ajaran: ${tahun}` });
  } else {
    const ta = await prisma.tahunAjaran.create({ data: { sekolahId, tahun } });
    await auditLog({ aksi: "create", entitas: "tahun_ajaran", entitasId: ta.id, detail: `Tambah tahun ajaran: ${tahun}` });
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
  await auditLog({ aksi: "update", entitas: "tahun_ajaran", entitasId: id, detail: `Set tahun ajaran aktif #${id}` });
  revalidatePath("/pengaturan/akademik");
}

export async function deleteTahunAjaran(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  const rombelCount = await prisma.rombel.count({ where: { tahunAjaranId: id, sekolahId } });
  if (rombelCount > 0) {
    return { ok: false, error: `Tahun ajaran ini memiliki ${rombelCount} rombel. Hapus semua rombel terkait terlebih dahulu.` };
  }
  try {
    await prisma.tahunAjaran.deleteMany({ where: { id, sekolahId } });
    await auditLog({ aksi: "delete", entitas: "tahun_ajaran", entitasId: id, detail: `Hapus tahun ajaran #${id}` });
    revalidatePath("/pengaturan/akademik");
    return { ok: true };
  } catch (e) {
    return catchDeleteError(e, "Tahun Ajaran");
  }
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
    await auditLog({ aksi: "update", entitas: "periode", entitasId: id, detail: `Update periode: ${nama}` });
  } else {
    const p = await prisma.periode.create({ data: { ...data, tahunAjaranId, jenis: "semester" } });
    await auditLog({ aksi: "create", entitas: "periode", entitasId: p.id, detail: `Tambah periode: ${nama}` });
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
  await auditLog({ aksi: "update", entitas: "periode", entitasId: id, detail: `Set periode aktif #${id}` });
  revalidatePath("/pengaturan/akademik");
}

export async function deletePeriode(formData: FormData) {
  const sekolahId = await requireStaff();
  const id = Number(formData.get("id"));
  if (!id) return;
  const nilaiCount = await prisma.nilaiRapor.count({ where: { periodeId: id } });
  if (nilaiCount > 0) {
    return { ok: false, error: `Periode ini memiliki ${nilaiCount.toLocaleString("id-ID")} data nilai rapor. Tidak bisa dihapus selama masih ada nilai terkait.` };
  }
  try {
    await prisma.periode.deleteMany({ where: { id, tahunAjaran: { sekolahId } } });
    await auditLog({ aksi: "delete", entitas: "periode", entitasId: id, detail: `Hapus periode #${id}` });
    revalidatePath("/pengaturan/akademik");
    return { ok: true };
  } catch (e) {
    return catchDeleteError(e, "Periode");
  }
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
  await auditLog({ aksi: "update", entitas: "periode", entitasId: id, detail: `Update tanggal periode #${id}` });
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

  // Pakai Date.UTC agar tidak ada timezone shift (new Date(y,m,d) = local midnight,
  // di UTC+7 = Dec 19 17:00 UTC → PostgreSQL simpan sebagai Dec 19, bukan Dec 20)
  const TEMPLATE = [
    {
      nama: "Semester Ganjil", urutan: 1,
      mulai: new Date(Date.UTC(y1, 6, 15)),    // 15 Juli
      selesai: new Date(Date.UTC(y1, 11, 20)), // 20 Desember
    },
    {
      nama: "Semester Genap", urutan: 2,
      mulai: new Date(Date.UTC(y2, 0, 6)),     // 6 Januari
      selesai: new Date(Date.UTC(y2, 5, 20)),  // 20 Juni
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
  await auditLog({ aksi: "update", entitas: "periode", entitasId: tahunAjaranId, detail: `Auto-isi kalender tahun ajaran #${tahunAjaranId}` });
  revalidatePath("/pengaturan/akademik");
}
