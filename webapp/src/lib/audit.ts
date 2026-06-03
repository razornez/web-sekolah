import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type AuditAksi = "create" | "update" | "delete";

interface AuditOptions {
  aksi: AuditAksi;
  entitas: string;
  entitasId?: string | number | null;
  detail?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

/**
 * Catat satu entri audit log.
 * Selalu best-effort — error tidak dilempar ke caller agar tidak mengganggu aksi utama.
 */
export async function auditLog(opts: AuditOptions): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user) return;
    const { id, name, role, sekolahId } = session.user;
    await prisma.auditLog.create({
      data: {
        sekolahId: sekolahId ?? null,
        userId: id,
        userName: name ?? "unknown",
        role,
        aksi: opts.aksi,
        entitas: opts.entitas,
        entitasId: opts.entitasId != null ? String(opts.entitasId) : null,
        detail: opts.detail ?? null,
        meta: opts.meta ?? undefined,
      },
    });
  } catch {
    // best-effort; jangan lempar error ke caller
  }
}
