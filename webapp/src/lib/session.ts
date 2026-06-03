import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** Ambil user dari sesi; redirect ke /login jika belum login. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Ambil sekolahId (tenant) user aktif. Superadmin (sekolahId null) belum
 * memilih sekolah → diarahkan ke dashboard. Semua query data harus tenant-scoped.
 */
export async function getSekolahId(): Promise<number> {
  const user = await getCurrentUser();
  if (user.sekolahId == null) {
    redirect("/dashboard?error=pilih-sekolah");
  }
  return user.sekolahId;
}

// Role end-user (bukan staf back-office). Sisanya dianggap staf.
const END_USER_ROLES = ["siswa", "ortu"];

export function isStaff(role: string): boolean {
  return role !== "superadmin" && !END_USER_ROLES.includes(role);
}

/**
 * Guard back-office: hanya staf. Siswa/ortu diarahkan ke /portal.
 * Mengembalikan sekolahId (tenant) sekaligus.
 */
export async function requireStaff(): Promise<number> {
  const user = await getCurrentUser();
  if (END_USER_ROLES.includes(user.role)) redirect("/portal");
  if (user.sekolahId == null) redirect("/dashboard?error=pilih-sekolah");
  return user.sekolahId;
}
