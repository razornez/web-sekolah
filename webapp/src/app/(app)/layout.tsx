import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/session";

const STAFF_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/siswa", label: "Data Siswa" },
  { href: "/guru", label: "Data Guru" },
  { href: "/rombel", label: "Rombel / Kelas" },
  { href: "/mapel", label: "Mata Pelajaran" },
  { href: "/nilai", label: "Nilai / Rapor" },
  { href: "/p5", label: "Projek P5" },
  { href: "/presensi", label: "Presensi" },
  { href: "/bk", label: "BK / Pelanggaran" },
  { href: "/perpustakaan", label: "Perpustakaan" },
  { href: "/sarpras", label: "Sarpras" },
  { href: "/surat", label: "Surat" },
  { href: "/spp", label: "SPP / Keuangan" },
  { href: "/ppdb", label: "PPDB" },
  { href: "/kelulusan", label: "Kelulusan" },
  { href: "/osis", label: "Pemilihan OSIS" },
];
const PORTAL_NAV = [
  { href: "/portal", label: "Portal Saya" },
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
  const nav = isStaff(user.role) ? STAFF_NAV : PORTAL_NAV;

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
