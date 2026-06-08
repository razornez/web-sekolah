import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Ambil user dari sesi — di-cache per request (React cache).
 * Middleware sudah guard redirect ke /login, jadi di sini cukup return null jika tidak ada.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
});

/**
 * Ambil sekolahId (tenant) user aktif.
 */
export async function getSekolahId(): Promise<number> {
  const user = await getCurrentUser();
  if (user.sekolahId == null) {
    redirect("/dashboard?error=pilih-sekolah");
  }
  return user.sekolahId;
}

// Role end-user (bukan staf back-office)
const END_USER_ROLES = ["siswa", "ortu"];

export function isStaff(role: string): boolean {
  return role !== "superadmin" && !END_USER_ROLES.includes(role);
}

/**
 * Guard back-office: hanya staf. Siswa/ortu diarahkan ke /portal.
 * Superadmin diarahkan ke /admin (tidak punya sekolahId).
 * Mengembalikan sekolahId (tenant) sekaligus.
 */
export async function requireStaff(): Promise<number> {
  const user = await getCurrentUser();
  if (END_USER_ROLES.includes(user.role)) redirect("/portal");
  if (user.role === "superadmin") redirect("/admin");
  if (user.sekolahId == null) redirect("/dashboard?error=pilih-sekolah");
  return user.sekolahId;
}
