import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/session";
import { canAccess, type ModuleKey } from "@/lib/permissions";

const STAFF_NAV: { href: string; label: string; key?: ModuleKey }[] = [
  { href: "/dashboard", label: "Dashboard" }, // selalu tampil utk staf
  { href: "/pengumuman", label: "Pengumuman", key: "pengumuman" },
  { href: "/siswa", label: "Data Siswa", key: "siswa" },
  { href: "/prestasi", label: "Prestasi & Beasiswa", key: "siswa" },
  { href: "/mutasi", label: "Mutasi Siswa", key: "siswa" },
  { href: "/kenaikan-kelas", label: "Kenaikan Kelas", key: "rombel" },
  { href: "/guru", label: "Data Guru", key: "guru" },
  { href: "/rombel", label: "Rombel / Kelas", key: "rombel" },
  { href: "/mapel", label: "Mata Pelajaran", key: "mapel" },
  { href: "/nilai", label: "Nilai / Rapor", key: "nilai" },
  { href: "/p5", label: "Projek P5", key: "p5" },
  { href: "/jurnal", label: "Jurnal Mengajar", key: "jurnal" },
  { href: "/jadwal", label: "Jadwal Mengajar", key: "jadwal" },
  { href: "/elearning", label: "E-Learning", key: "elearning" },
  { href: "/tugas", label: "Tugas", key: "tugas" },
  { href: "/ujian", label: "Ujian Online", key: "ujian" },
  { href: "/presensi", label: "Presensi", key: "presensi" },
  { href: "/ekstrakurikuler", label: "Ekstrakurikuler", key: "ekstrakurikuler" },
  { href: "/bk", label: "BK / Pelanggaran", key: "bk" },
  { href: "/perpustakaan", label: "Perpustakaan", key: "perpustakaan" },
  { href: "/sarpras", label: "Sarpras", key: "sarpras" },
  { href: "/surat", label: "Surat", key: "surat" },
  { href: "/spp", label: "SPP / Keuangan", key: "spp" },
  { href: "/ppdb", label: "PPDB", key: "ppdb" },
  { href: "/kelulusan", label: "Kelulusan", key: "kelulusan" },
  { href: "/osis", label: "Pemilihan OSIS", key: "osis" },
];
const PORTAL_NAV = [
  { href: "/portal", label: "Portal Saya" },
  { href: "/tugas-saya", label: "Tugas Saya" },
  { href: "/ujian-saya", label: "Ujian Saya" },
  { href: "/vote", label: "Pemilihan OSIS" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;
  const nav = isStaff(user.role)
    ? STAFF_NAV.filter((n) => !n.key || canAccess(user.role, n.key))
    : PORTAL_NAV;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4 font-semibold text-gray-900">
          Smart School
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3 text-sm">
          <div className="px-2 text-gray-900">{user.name}</div>
          <div className="px-2 text-xs text-gray-500">
            {user.role}
            {user.sekolahSlug ? ` · ${user.sekolahSlug}` : ""}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="mt-2 px-2 text-gray-500 hover:text-gray-900">
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
