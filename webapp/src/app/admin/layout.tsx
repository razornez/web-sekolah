import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Platform Admin</p>
          <p className="mt-0.5 text-sm font-medium text-gray-900">{user.name}</p>
        </div>
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Manajemen</p>
          <NavItem href="/admin/tenant">Tenant / Sekolah</NavItem>
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Email</p>
          <NavItem href="/admin/email/config">Konfigurasi</NavItem>
          <NavItem href="/admin/email/template">Template</NavItem>
          <NavItem href="/admin/email/log">Log Pengiriman</NavItem>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      {children}
    </Link>
  );
}
