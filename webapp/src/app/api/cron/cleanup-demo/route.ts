import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron cleanup — hapus sekolah DEMO yang sudah kedaluwarsa (>24 jam).
 * Hanya menghapus isDemo=true & demoExpiresAt < now. Sekolah showcase
 * (isDemo=false, mis. id 1 & 2) TIDAK pernah tersentuh.
 *
 * Keamanan: wajib header  x-cron-secret: <CRON_SECRET>  (atau ?key=).
 * Panggil dari scheduler eksternal (cron VPS / Vercel Cron), mis. tiap jam:
 *   curl -H "x-cron-secret: $CRON_SECRET" https://domain/api/cron/cleanup-demo
 */
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Default aman: kalau secret belum di-set, tolak (cegah trigger tak sengaja).
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });

  const provided = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("key");
  if (provided !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const expired = await prisma.sekolah.findMany({
    where: { isDemo: true, demoExpiresAt: { lt: new Date() } },
    select: { id: true, nama: true, slug: true },
  });

  let deleted = 0;
  for (const s of expired) {
    // delete() cascade ke seluruh data anak (58 relasi onDelete: Cascade)
    await prisma.sekolah.delete({ where: { id: s.id } }).then(() => { deleted++; }).catch(() => {});
  }

  return NextResponse.json(
    { ok: true, deleted, schools: expired.map((s) => s.slug), at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
