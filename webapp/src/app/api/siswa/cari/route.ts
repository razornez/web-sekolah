import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isStaff } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await auth();
  // Hanya staf (bukan siswa/ortu) yang boleh mencari direktori siswa via API ini.
  if (!session?.user?.sekolahId || !isStaff(session.user.role)) {
    return NextResponse.json([]);
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const rows = await prisma.siswa.findMany({
    where: {
      sekolahId: session.user.sekolahId,
      deletedAt: null,
      OR: [
        { namaLengkap: { contains: q, mode: "insensitive" } },
        { nisn: { contains: q } },
      ],
    },
    select: { id: true, namaLengkap: true, nisn: true },
    take: 8,
    orderBy: { namaLengkap: "asc" },
  });
  return NextResponse.json(rows);
}
