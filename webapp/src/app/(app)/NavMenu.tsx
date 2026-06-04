"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {nav.map((n) => {
        // Highlight jika path sama atau sub-path (misal /siswa aktif untuk /siswa/123)
        const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href + "/")) || (n.href !== "/" && pathname === n.href);
        return (
          <Link key={n.href} href={n.href}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-gray-900 text-white font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
