"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@prisma/client";

const STAFF_ROLES: Role[] = [
  "admin", "operator", "kepsek", "kurikulum", "kesiswaan", "humas",
  "guru", "walikelas", "bk", "bendahara", "resepsionis", "perpustakaan", "sarpras",
];

export type UserFormState = { ok: boolean; error?: string };

/** Aktifkan / nonaktifkan akun */
export async function toggleUserActive(formData: FormData) {
  const sekolahId = await requireModule("pengaturan");
  const id = String(formData.get("id"));
  const me = await getCurrentUser();
  if (!id) return;
  if (id === me.id) return; // tidak bisa nonaktifkan diri sendiri
  const u = await prisma.user.findFirst({ where: { id, sekolahId }, select: { isActive: true } });
  if (!u) return;
  await prisma.user.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath("/pengaturan/pengguna");
}

/** Ubah role pengguna */
export async function changeUserRole(formData: FormData) {
  const sekolahId = await requireModule("pengaturan");
  const id = String(formData.get("id"));
  const role = String(formData.get("role")) as Role;
  const me = await getCurrentUser();
  if (!id || !STAFF_ROLES.includes(role)) return;
  if (id === me.id) return; // jangan ubah role sendiri (cegah lock-out)
  await prisma.user.updateMany({ where: { id, sekolahId }, data: { role } });
  revalidatePath("/pengaturan/pengguna");
}

/** Reset password → set password baru (bcrypt) */
export async function resetUserPassword(formData: FormData) {
  const sekolahId = await requireModule("pengaturan");
  const id = String(formData.get("id"));
  const newPassword = String(formData.get("newPassword") ?? "").trim();
  if (!id || newPassword.length < 6) return;
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.updateMany({
    where: { id, sekolahId },
    data: { passwordHash: hash, passwordLegacyMd5: false },
  });
  revalidatePath("/pengaturan/pengguna");
}

/** Buat akun staf baru */
export async function createStaffUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const sekolahId = await requireModule("pengaturan");
  const namaLengkap = String(formData.get("namaLengkap") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const role = String(formData.get("role")) as Role;
  const password = String(formData.get("password") ?? "").trim();

  if (!namaLengkap || !username || !STAFF_ROLES.includes(role)) {
    return { ok: false, error: "Data tidak lengkap atau role tidak valid." };
  }
  if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter." };

  const existing = await prisma.user.findFirst({ where: { sekolahId, username }, select: { id: true } });
  if (existing) return { ok: false, error: `Username "${username}" sudah dipakai.` };

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { sekolahId, namaLengkap, username, role, passwordHash: hash, isActive: true },
  });
  revalidatePath("/pengaturan/pengguna");
  return { ok: true };
}
