import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE = "https://wilayah.id/api";

export async function GET(req: NextRequest) {
  const provinsiId = req.nextUrl.searchParams.get("provinsiId");
  if (!provinsiId) return NextResponse.json([]);

  // Coba dari DB dulu
  const existing = await prisma.refKabupaten.findMany({
    where: { provinsiId },
    orderBy: { nama: "asc" },
    select: { kode: true, nama: true },
  });
  if (existing.length > 0) return NextResponse.json(existing);

  // Fetch dari API lalu cache
  try {
    const res = await fetch(`${BASE}/regencies/${provinsiId}.json`);
    const json = await res.json();
    const data: { code: string; name: string }[] = json?.data ?? json;
    if (!Array.isArray(data)) return NextResponse.json([]);
    await prisma.refKabupaten.createMany({
      data: data.map((k) => ({ kode: k.code, provinsiId, nama: k.name })),
      skipDuplicates: true,
    });
    return NextResponse.json(data.map((k) => ({ kode: k.code, nama: k.name })));
  } catch {
    return NextResponse.json([]);
  }
}
