import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/session";

export const MODULE_KEYS = [
  "siswa", "guru", "rombel", "mapel", "nilai", "p5", "jurnal", "jadwal",
  "elearning", "presensi", "bk", "perpustakaan", "sarpras", "surat", "spp",
  "ppdb", "kelulusan", "osis", "pengumuman", "ekstrakurikuler", "tugas", "ujian", "audit",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

const ALL: ModuleKey[] = [...MODULE_KEYS];

/** Modul yang boleh diakses tiap role. Role tak terdaftar = tidak akses apa pun. */
export const ROLE_MODULES: Record<string, ModuleKey[]> = {
  admin: ALL,
  operator: ALL,
  kepsek: ALL,
  kurikulum: ["siswa", "guru", "rombel", "mapel", "nilai", "p5", "jurnal", "jadwal", "elearning", "presensi", "kelulusan", "tugas", "ujian"],
  kesiswaan: ["siswa", "rombel", "presensi", "bk", "osis", "ppdb", "kelulusan", "pengumuman", "ekstrakurikuler"],
  humas: ["ppdb", "surat", "pengumuman"],
  guru: ["siswa", "rombel", "mapel", "nilai", "p5", "jurnal", "jadwal", "elearning", "presensi", "ekstrakurikuler", "tugas", "ujian"],
  walikelas: ["siswa", "rombel", "nilai", "p5", "presensi", "kelulusan"],
  bk: ["siswa", "bk"],
  bendahara: ["spp"],
  perpustakaan: ["perpustakaan"],
  sarpras: ["sarpras"],
  resepsionis: ["surat", "ppdb"],
};

export function canAccess(role: string, key: ModuleKey): boolean {
  return ROLE_MODULES[role]?.includes(key) ?? false;
}

/**
 * Guard modul back-office spesifik. Mengembalikan sekolahId (tenant).
 * - end-user (siswa/ortu) → /portal
 * - staf tanpa izin modul → /dashboard
 */
export async function requireModule(key: ModuleKey): Promise<number> {
  const user = await getCurrentUser();
  if (!isStaff(user.role)) redirect("/portal");
  if (user.sekolahId == null) redirect("/dashboard?error=pilih-sekolah");
  if (!canAccess(user.role, key)) redirect("/dashboard?error=akses-ditolak");
  return user.sekolahId;
}
