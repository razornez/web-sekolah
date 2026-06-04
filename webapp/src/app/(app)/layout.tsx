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
  { href: "/nilai/entri", label: "Entri Nilai Harian", key: "nilai" },
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
  { href: "/audit", label: "Audit Log", key: "audit" },
  { href: "/pengaturan", label: "⚙ Pengaturan", key: "pengaturan" },
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

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700", operator: "bg-orange-100 text-orange-700",
    kepsek: "bg-purple-100 text-purple-700", guru: "bg-blue-100 text-blue-700",
    bendahara: "bg-green-100 text-green-700", bk: "bg-amber-100 text-amber-700",
    perpustakaan: "bg-teal-100 text-teal-700", siswa: "bg-indigo-100 text-indigo-700",
    ortu: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      <aside className="flex w-60 flex-col bg-white shadow-sm">
        {/* Logo/Brand */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-5 py-5">
          <div className="text-lg font-bold text-white">🏫 Smart School</div>
          <div className="mt-0.5 text-xs text-gray-400">Sistem Informasi Sekolah</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
              <div className="flex items-center gap-1">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>{user.role}</span>
              </div>
            </div>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="mt-2 w-full rounded-lg py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              ↩ Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-6">{children}</main>
    </div>
  );
}
