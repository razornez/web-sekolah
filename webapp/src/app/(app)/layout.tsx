import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/session";
import { canAccess, type ModuleKey } from "@/lib/permissions";
import { AppShell } from "./AppShell";

const STAFF_NAV: { href: string; label: string; key?: ModuleKey }[] = [
  { href: "/dashboard",        label: "Dashboard" },
  { href: "/pengumuman",       label: "Pengumuman",         key: "pengumuman" },
  { href: "/siswa",            label: "Data Siswa",          key: "siswa" },
  { href: "/prestasi",         label: "Prestasi & Beasiswa", key: "siswa" },
  { href: "/mutasi",           label: "Mutasi Siswa",        key: "siswa" },
  { href: "/kenaikan-kelas",   label: "Kenaikan Kelas",      key: "rombel" },
  { href: "/guru",             label: "Data Guru",           key: "guru" },
  { href: "/rombel",           label: "Rombel / Kelas",      key: "rombel" },
  { href: "/mapel",            label: "Mata Pelajaran",      key: "mapel" },
  { href: "/nilai",            label: "Nilai / Rapor",       key: "nilai" },
  { href: "/nilai/entri",      label: "Entri Nilai Harian",  key: "nilai" },
  { href: "/p5",               label: "Projek P5",           key: "p5" },
  { href: "/jurnal",           label: "Jurnal Mengajar",     key: "jurnal" },
  { href: "/jadwal",           label: "Jadwal Mengajar",     key: "jadwal" },
  { href: "/elearning",        label: "E-Learning",          key: "elearning" },
  { href: "/tugas",            label: "Tugas",               key: "tugas" },
  { href: "/ujian",            label: "Ujian Online",        key: "ujian" },
  { href: "/presensi",         label: "Presensi",            key: "presensi" },
  { href: "/ekstrakurikuler",  label: "Ekstrakurikuler",     key: "ekstrakurikuler" },
  { href: "/bk",               label: "BK / Pelanggaran",   key: "bk" },
  { href: "/perpustakaan",     label: "Perpustakaan",        key: "perpustakaan" },
  { href: "/sarpras",          label: "Sarpras",             key: "sarpras" },
  { href: "/surat",            label: "Surat",               key: "surat" },
  { href: "/spp",              label: "SPP / Keuangan",      key: "spp" },
  { href: "/ppdb",             label: "PPDB",                key: "ppdb" },
  { href: "/kelulusan",        label: "Kelulusan",           key: "kelulusan" },
  { href: "/osis",             label: "Pemilihan OSIS",      key: "osis" },
  { href: "/audit",            label: "Audit Log",           key: "audit" },
  { href: "/pengaturan",       label: "⚙ Pengaturan",       key: "pengaturan" },
];

const PORTAL_NAV = [
  { href: "/portal",      label: "Portal Saya" },
  { href: "/tugas-saya",  label: "Tugas Saya" },
  { href: "/ujian-saya",  label: "Ujian Saya" },
  { href: "/vote",        label: "Pemilihan OSIS" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;

  const nav = isStaff(user.role)
    ? STAFF_NAV.filter((n) => !n.key || canAccess(user.role, n.key))
    : PORTAL_NAV;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      nav={nav}
      user={{ name: user.name, role: user.role }}
      signOutAction={handleSignOut}
    >
      {children}
    </AppShell>
  );
}
