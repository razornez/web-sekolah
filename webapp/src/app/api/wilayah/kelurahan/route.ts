import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE = "https://wilayah.id/api";

export async function GET(req: NextRequest) {
  const kecamatanId = req.nextUrl.searchParams.get("kecamatanId");
  if (!kecamatanId) return NextResponse.json([]);

  const kec = await prisma.refKecamatan.findUnique({ where: { kode: kecamatanId }, select: { seeded: true } });
  if (kec?.seeded) {
    const rows = await prisma.refKelurahan.findMany({ where: { kecamatanId }, orderBy: { nama: "asc" }, select: { kode: true, nama: true, kodePos: true } });
    return NextResponse.json(rows);
  }

  try {
    const res = await fetch(`${BASE}/villages/${kecamatanId}.json`);
    const json = await res.json();
    const data: { code: string; name: string; postal_code?: string }[] = json?.data ?? json;
    if (!Array.isArray(data)) return NextResponse.json([]);
    await prisma.$transaction([
      prisma.refKelurahan.createMany({
        data: data.map((k) => ({ kode: k.code, kecamatanId, nama: k.name, kodePos: k.postal_code ?? null })),
        skipDuplicates: true,
      }),
      prisma.refKecamatan.update({ where: { kode: kecamatanId }, data: { seeded: true } }),
    ]);
    return NextResponse.json(data.map((k) => ({ kode: k.code, nama: k.name, kodePos: k.postal_code ?? null })));
  } catch {
    return NextResponse.json([]);
  }
}
