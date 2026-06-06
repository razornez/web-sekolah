import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint — untuk uptime monitor / load balancer.
 * GET /api/health → 200 { status: "ok", db: "up" } | 503 jika DB down.
 * Tidak membutuhkan auth (hanya cek liveness, tidak membocorkan data).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Query super-ringan untuk memastikan koneksi DB hidup
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "up", time: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "error", db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
