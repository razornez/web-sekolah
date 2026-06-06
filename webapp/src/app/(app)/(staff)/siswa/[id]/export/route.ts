import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { canAccess } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

/**
 * GDPR data export — unduh seluruh data seorang siswa sebagai JSON (data portability).
 * GET /siswa/[id]/export
 * Authz: staf dengan izin modul "siswa", tenant-scoped (sekolahId).
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); // redirect ke /login bila belum auth
  if (!isStaff(user.role) || !canAccess(user.role, "siswa") || user.sekolahId == null) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const siswaId = Number(id);
  if (!siswaId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Tenant-scoped: hanya siswa di sekolah pengguna
  const siswa = await prisma.siswa.findFirst({
    where: { id: siswaId, sekolahId: user.sekolahId },
    include: {
      anggotaRombel: { include: { rombel: { select: { nama: true, tahunAjaran: { select: { tahun: true } } } } } },
      nilaiRapor: { include: { mapel: { select: { namaMapel: true } }, periode: { select: { nama: true } } } },
      kehadiran: { select: { tanggal: true, status: true, keterangan: true } },
      tagihanSpp: { include: { jenis: { select: { nama: true } } } },
      kasus: { include: { kategori: { select: { nama: true } } } },
      orangTuaWali: true,
      penerimaPrestasiList: { include: { prestasi: { select: { nama: true, tingkat: true } } } },
      penerimaBeasiswaList: { include: { beasiswa: { select: { nama: true } } } },
    },
  });

  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await auditLog({ aksi: "update", entitas: "siswa", entitasId: siswaId, detail: `Export data GDPR: ${siswa.namaLengkap}` });

  const bundle = {
    _meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.name,
      type: "GDPR data export",
      siswaId,
    },
    siswa,
  };

  const filename = `data-siswa-${siswaId}-${siswa.nisn ?? "export"}.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
