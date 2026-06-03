import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE = "https://wilayah.id/api";

export async function GET(req: NextRequest) {
  const kabupatenId = req.nextUrl.searchParams.get("kabupatenId");
  if (!kabupatenId) return NextResponse.json([]);

  // Cek apakah sudah di-cache
  const kab = await prisma.refKabupaten.findUnique({ where: { kode: kabupatenId }, select: { seeded: true } });
  if (kab?.seeded) {
    const rows = await prisma.refKecamatan.findMany({ where: { kabupatenId }, orderBy: { nama: "asc" }, select: { kode: true, nama: true } });
    return NextResponse.json(rows);
  }

  try {
    const res = await fetch(`${BASE}/districts/${kabupatenId}.json`);
    const json = await res.json();
    const data: { code: string; name: string }[] = json?.data ?? json;
    if (!Array.isArray(data)) return NextResponse.json([]);
    await prisma.$transaction([
      prisma.refKecamatan.createMany({ data: data.map((k) => ({ kode: k.code, kabupatenId, nama: k.name })), skipDuplicates: true }),
      prisma.refKabupaten.update({ where: { kode: kabupatenId }, data: { seeded: true } }),
    ]);
    return NextResponse.json(data.map((k) => ({ kode: k.code, nama: k.name })));
  } catch {
    return NextResponse.json([]);
  }
}
