import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isStaff } from "@/lib/session";
import { canAccess, type ModuleKey } from "@/lib/permissions";
import { R, PORTAL } from "@/lib/routes";
import { AppShell } from "./AppShell";
import { DemoBanner } from "@/components/DemoBanner";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Badge sidebar di-cache 120s per sekolah — kueri ini jalan di SETIAP halaman.
const cachedSiswaCount = unstable_cache(
  (sekolahId: number) => prisma.siswa.count({ where: { sekolahId, status: "aktif" } }),
  ["badge-siswa-v1"],
  { revalidate: 120, tags: ["beranda"] },
);
const cachedSppDue = unstable_cache(
  (sekolahId: number, year: number, month: number) =>
    prisma.tagihanSpp.count({ where: { sekolahId, status: { not: "lunas" }, OR: [{ tahun: { lt: year } }, { tahun: year, bulan: { lte: month } }] } }),
  ["badge-spp-v1"],
  { revalidate: 120, tags: ["beranda"] },
);

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

  // Superadmin tidak punya tenant — langsung ke panel admin
  if (user.role === "superadmin") redirect("/admin");

  // Google user yang belum melengkapi data sekolah
  if (user.needsOnboarding) redirect("/daftar-sekolah?step=complete");

  // Pastikan sekolah masih ada (demo expired + dihapus cron = sekolahId sudah tidak valid)
  if (user.sekolahId) {
    const sekolah = await prisma.sekolah.findUnique({
      where: { id: user.sekolahId },
      select: { id: true },
    });
    if (!sekolah) {
      await signOut({ redirectTo: "/login?error=sekolah-dihapus" });
    }
  }

  const t = await getTranslations("nav");

  const staff = isStaff(user.role);
  const source = staff
    ? STAFF_NAV.filter((n) => !n.key || canAccess(user.role, n.key))
    : PORTAL_NAV;

  const nav = source.map((n) => ({
    href: n.href,
    navKey: n.navKey,
    label: t(n.navKey as never),
  }));

  // Badge sidebar — angka nyata (cheap count). Hanya untuk staf bertenant.
  const badges: { siswa?: number; spp?: number } = {};
  if (staff && user.sekolahId) {
    const now = new Date();
    const [siswaCount, sppDue] = await Promise.all([
      canAccess(user.role, "siswa") ? cachedSiswaCount(user.sekolahId) : Promise.resolve(0),
      canAccess(user.role, "spp") ? cachedSppDue(user.sekolahId, now.getFullYear(), now.getMonth() + 1) : Promise.resolve(0),
    ]);
    if (siswaCount) badges.siswa = siswaCount;
    if (sppDue) badges.spp = sppDue;
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      nav={nav}
      user={{ name: user.name, role: user.role }}
      signOutAction={handleSignOut}
      badges={badges}
      isPortal={!staff}
    >
      <DemoBanner sekolahId={user.sekolahId} />
      {children}
    </AppShell>
  );
}
