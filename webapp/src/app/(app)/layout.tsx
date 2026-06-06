import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isStaff } from "@/lib/session";
import { canAccess, type ModuleKey } from "@/lib/permissions";
import { R, PORTAL } from "@/lib/routes";
import { AppShell } from "./AppShell";
import { DemoBanner } from "@/components/DemoBanner";

// navKey = key di messages "nav.*", icon opsional prefix
const STAFF_NAV: { href: string; navKey: string; key?: ModuleKey; icon?: string }[] = [
  { href: R.DASHBOARD,       navKey: "dashboard" },
  { href: R.PENGUMUMAN,      navKey: "pengumuman",      key: "pengumuman" },
  { href: R.SISWA,           navKey: "siswa",            key: "siswa" },
  { href: R.PRESTASI,        navKey: "prestasi",         key: "siswa" },
  { href: R.MUTASI,          navKey: "mutasi",           key: "siswa" },
  { href: R.KENAIKAN_KELAS,  navKey: "kenaikanKelas",    key: "rombel" },
  { href: R.GURU,            navKey: "guru",             key: "guru" },
  { href: R.ROMBEL,          navKey: "rombel",           key: "rombel" },
  { href: R.MAPEL,           navKey: "mapel",            key: "mapel" },
  { href: R.NILAI,           navKey: "nilai",            key: "nilai" },
  { href: R.NILAI_ENTRI,     navKey: "nilaiEntri",       key: "nilai" },
  { href: R.P5,              navKey: "p5",               key: "p5" },
  { href: R.JURNAL,          navKey: "jurnal",           key: "jurnal" },
  { href: R.JADWAL,          navKey: "jadwal",           key: "jadwal" },
  { href: R.ELEARNING,       navKey: "elearning",        key: "elearning" },
  { href: R.TUGAS,           navKey: "tugas",            key: "tugas" },
  { href: R.UJIAN,           navKey: "ujian",            key: "ujian" },
  { href: R.PRESENSI,        navKey: "presensi",         key: "presensi" },
  { href: R.EKSTRAKURIKULER, navKey: "ekstrakurikuler",  key: "ekstrakurikuler" },
  { href: R.BK,              navKey: "bk",               key: "bk" },
  { href: R.PERPUSTAKAAN,    navKey: "perpustakaan",     key: "perpustakaan" },
  { href: R.SARPRAS,         navKey: "sarpras",          key: "sarpras" },
  { href: R.SURAT,           navKey: "surat",            key: "surat" },
  { href: R.SPP,             navKey: "spp",              key: "spp" },
  { href: R.PPDB,            navKey: "ppdb",             key: "ppdb" },
  { href: R.KELULUSAN,       navKey: "kelulusan",        key: "kelulusan" },
  { href: R.OSIS,            navKey: "osis",             key: "osis" },
  { href: R.AUDIT,           navKey: "audit",            key: "audit" },
  { href: R.PENGATURAN,      navKey: "pengaturan",       key: "pengaturan", icon: "⚙ " },
];

const PORTAL_NAV: { href: string; navKey: string }[] = [
  { href: PORTAL.HOME,  navKey: "portalSaya" },
  { href: PORTAL.TUGAS, navKey: "tugasSaya" },
  { href: PORTAL.UJIAN, navKey: "ujianSaya" },
  { href: PORTAL.VOTE,  navKey: "vote" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;

  const t = await getTranslations("nav");

  const source = isStaff(user.role)
    ? STAFF_NAV.filter((n) => !n.key || canAccess(user.role, n.key))
    : PORTAL_NAV;

  const nav = source.map((n) => ({
    href: n.href,
    label: ("icon" in n && n.icon ? n.icon : "") + t(n.navKey as never),
  }));

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
      <DemoBanner sekolahId={user.sekolahId} />
      {children}
    </AppShell>
  );
}
