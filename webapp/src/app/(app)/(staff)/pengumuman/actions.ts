"use server";

import { PengumumanTarget, type KirimChannel, PenerimaTipe } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { auditLog } from "@/lib/audit";

const TARGETS: PengumumanTarget[] = ["semua", "staf", "siswa", "ortu"];
const KATEGORIS = ["umum", "akademik", "keuangan", "kegiatan", "penting", "staf", "lainnya"];
const CHANNELS: KirimChannel[] = ["wa", "email", "sms", "app"];

export type PengumumanFormState = { ok: boolean; message?: string };

/** Jumlah penerima nyata untuk target tertentu (untuk tujuan kiriman). */
async function audienceCount(sekolahId: number, target: PengumumanTarget): Promise<number> {
  if (target === "siswa") return prisma.siswa.count({ where: { sekolahId, status: "aktif" } });
  if (target === "ortu") return prisma.orangTuaWali.count({ where: { siswa: { sekolahId } } });
  if (target === "staf") return prisma.guru.count({ where: { sekolahId, deletedAt: null } });
  const [s, o, g] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
    prisma.orangTuaWali.count({ where: { siswa: { sekolahId } } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
  ]);
  return s + o + g;
}

function parseSchedule(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) || d.getTime() <= Date.now() ? null : d;
}

export async function createPengumuman(
  _prev: PengumumanFormState,
  formData: FormData,
): Promise<PengumumanFormState> {
  const sekolahId = await requireModule("pengumuman");
  const user = await getCurrentUser();
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul wajib diisi." };
  if (!isi || isi === "<p></p>") return { ok: false, message: "Isi pengumuman wajib diisi." };

  const targetRaw = String(formData.get("target") ?? "semua") as PengumumanTarget;
  const target = TARGETS.includes(targetRaw) ? targetRaw : "semua";
  const kategoriRaw = String(formData.get("kategori") ?? "umum");
  const kategori = KATEGORIS.includes(kategoriRaw) ? kategoriRaw : "umum";
  const pinned = formData.get("pinned") === "on";
  const prioritas = formData.get("prioritas") === "on";
  const butuhBalasan = formData.get("butuhBalasan") === "on";
  const scheduledAt = parseSchedule(String(formData.get("scheduledAt") ?? ""));
  const channels = formData.getAll("channels").map(String).filter((c): c is KirimChannel => (CHANNELS as string[]).includes(c));
  const reminderHoursRaw = Number(formData.get("reminderHours"));
  const reminderHours = Number.isFinite(reminderHoursRaw) && reminderHoursRaw > 0 ? Math.floor(reminderHoursRaw) : null;

  const tujuan = channels.length ? await audienceCount(sekolahId, target) : 0;

  const p = await prisma.pengumuman.create({
    data: {
      sekolahId, judul, isi, target, kategori, pinned, prioritas, butuhBalasan,
      scheduledAt, reminderHours, createdById: user.id,
      publishedAt: scheduledAt ? null : new Date(),
      channels,
      kiriman: channels.length ? { create: channels.map((channel) => ({ channel, tujuan })) } : undefined,
    },
  });
  await auditLog({ aksi: "create", entitas: "pengumuman", entitasId: p.id, detail: `Tambah pengumuman: ${judul}` });
  revalidatePath("/pengumuman");
  redirect("/pengumuman");
}

/** Catat baca per-penerima (best-effort, idempotent). Dipanggil dari portal/detail siswa/ortu. */
export async function markPengumumanRead(id: number): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (user.sekolahId == null) return;
    const ok = await prisma.pengumuman.findFirst({ where: { id, sekolahId: user.sekolahId }, select: { id: true } });
    if (!ok) return;
    const tipe: PenerimaTipe = user.role === "siswa" ? "siswa" : user.role === "ortu" ? "ortu" : "guru";
    await prisma.pengumumanBaca.upsert({
      where: { pengumumanId_userId: { pengumumanId: id, userId: user.id } },
      create: { pengumumanId: id, userId: user.id, tipe },
      update: {},
    });
  } catch { /* best-effort */ }
}

/** Tandai 1 channel kiriman sebagai terkirim (mis. setelah staf share WA). */
export async function logKirim(id: number, channel: KirimChannel): Promise<void> {
  try {
    const sekolahId = await requireModule("pengumuman");
    const ok = await prisma.pengumuman.findFirst({ where: { id, sekolahId }, select: { id: true, target: true } });
    if (!ok || !(CHANNELS as string[]).includes(channel)) return;
    const tujuan = await audienceCount(sekolahId, ok.target);
    await prisma.pengumumanKirim.create({ data: { pengumumanId: id, channel, status: "terkirim", tujuan, terkirim: tujuan, sentAt: new Date() } });
    revalidatePath("/pengumuman");
  } catch { /* best-effort */ }
}

export async function updatePengumuman(
  _prev: PengumumanFormState,
  formData: FormData,
): Promise<PengumumanFormState> {
  const sekolahId = await requireModule("pengumuman");
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, message: "ID tidak valid." };
  const existing = await prisma.pengumuman.findFirst({ where: { id, sekolahId }, select: { id: true } });
  if (!existing) return { ok: false, message: "Pengumuman tidak ditemukan." };

  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul wajib diisi." };
  if (!isi || isi === "<p></p>") return { ok: false, message: "Isi wajib diisi." };

  const targetRaw = String(formData.get("target") ?? "semua") as PengumumanTarget;
  const target = TARGETS.includes(targetRaw) ? targetRaw : "semua";
  const kategoriRaw = String(formData.get("kategori") ?? "umum");
  const kategori = KATEGORIS.includes(kategoriRaw) ? kategoriRaw : "umum";
  const pinned = formData.get("pinned") === "on";
  const prioritas = formData.get("prioritas") === "on";
  const butuhBalasan = formData.get("butuhBalasan") === "on";

  await prisma.pengumuman.update({ where: { id }, data: { judul, isi, target, kategori, pinned, prioritas, butuhBalasan } });
  await auditLog({ aksi: "update", entitas: "pengumuman", entitasId: id, detail: `Update pengumuman: ${judul}` });
  revalidatePath("/pengumuman");
  revalidatePath(`/pengumuman/${id}`);
  redirect(`/pengumuman/${id}`);
}

export async function deletePengumuman(formData: FormData) {
  const sekolahId = await requireModule("pengumuman");
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.pengumuman.deleteMany({ where: { id, sekolahId } });
  await auditLog({ aksi: "delete", entitas: "pengumuman", entitasId: id, detail: `Hapus pengumuman #${id}` });
  revalidatePath("/pengumuman");
}

/** Increment view count — dipanggil client-side dari detail page (scoped ke tenant) */
export async function incrementView(id: number) {
  try {
    const user = await getCurrentUser();
    if (user.sekolahId == null) return;
    // updateMany dgn {id, sekolahId} agar tidak bisa bump view sekolah lain
    await prisma.pengumuman.updateMany({
      where: { id, sekolahId: user.sekolahId },
      data: { viewCount: { increment: 1 } },
    });
  } catch { /* best-effort */ }
}
