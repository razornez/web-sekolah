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
