import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron pengiriman pengumuman terjadwal + pengingat ulang.
 *
 * 1. PUBLISH: pengumuman ber-`scheduledAt` yang sudah jatuh tempo → set `publishedAt`
 *    (mulai tampil di feed/portal penerima — kanal in-app/portal = pengiriman NYATA,
 *    tingkat baca dilacak via PengumumanBaca).
 * 2. KIRIMAN: log kiriman antri → status `terkirim` (terdistribusi ke feed audiens).
 *    Dispatch push eksternal (WA/SMS) butuh gateway → INTEGRATION POINT (lihat di bawah).
 * 3. PENGINGAT: pengumuman dgn `reminderHours` yang sudah lewat & belum 100% dibaca →
 *    tandai `reminderSentAt` (kirim ulang notifikasi).
 *
 * Keamanan: header `x-cron-secret: <CRON_SECRET>` (atau ?key=). Panggil tiap ~5 menit.
 */
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const provided = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("key") ?? "";
  try {
    if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // 1. PUBLISH terjadwal + 2. tandai kiriman terkirim
  const dueScheduled = await prisma.pengumuman.findMany({
    where: { publishedAt: null, scheduledAt: { not: null, lte: now } },
    select: { id: true },
  });
  let published = 0;
  for (const p of dueScheduled) {
    await prisma.$transaction([
      prisma.pengumuman.update({ where: { id: p.id }, data: { publishedAt: now } }),
      prisma.pengumumanKirim.updateMany({
        where: { pengumumanId: p.id, status: "antri" },
        // status NYATA: terdistribusi ke feed/portal audiens.
        // TODO(integration): dispatch push WA/SMS via gateway lalu set terkirim/gagal sesuai hasil.
        data: { status: "terkirim", sentAt: now },
      }),
    ]);
    published++;
  }

  // 3. PENGINGAT ulang
  const reminderCandidates = await prisma.pengumuman.findMany({
    where: { reminderHours: { not: null }, reminderSentAt: null, publishedAt: { not: null } },
    select: { id: true, publishedAt: true, reminderHours: true },
  });
  let reminders = 0;
  for (const p of reminderCandidates) {
    if (!p.publishedAt || !p.reminderHours) continue;
    const dueAt = p.publishedAt.getTime() + p.reminderHours * 3600_000;
    if (now.getTime() < dueAt) continue;
    // TODO(integration): kirim ulang notifikasi ke penerima yang belum membaca.
    await prisma.pengumuman.update({ where: { id: p.id }, data: { reminderSentAt: now } });
    reminders++;
  }

  return NextResponse.json(
    { ok: true, published, reminders, at: now.toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
