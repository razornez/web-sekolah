"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NavMenu } from "./NavMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type NavItem = { href: string; label: string };
type User = { name?: string | null; role: string };

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  operator: "bg-orange-100 text-orange-700",
  kepsek: "bg-purple-100 text-purple-700",
  guru: "bg-blue-100 text-blue-700",
  bendahara: "bg-green-100 text-green-700",
  bk: "bg-amber-100 text-amber-700",
  perpustakaan: "bg-teal-100 text-teal-700",
  siswa: "bg-indigo-100 text-indigo-700",
  ortu: "bg-pink-100 text-pink-700",
};

export function AppShell({
  nav,
  user,
  signOutAction,
  children,
}: {
  nav: NavItem[];
  user: User;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");
  const tApp = useTranslations("app");
  const tRoles = useTranslations("roles");
  const roleLabel = (role: string) => {
    try { return tRoles(role as never); } catch { return role; }
  };

  // Tutup sidebar saat navigasi (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  // Tutup saat ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const initials = user.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300
          lg:static lg:w-60 lg:translate-x-0 lg:shadow-sm
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between bg-gradient-to-br from-gray-900 to-gray-700 px-5 py-4">
          <div>
            <div className="text-base font-bold text-white">🏫 {tApp("brand")}</div>
            <div className="mt-0.5 text-[11px] text-gray-400">{tApp("tagline")}</div>
          </div>
          {/* Close btn (mobile only) */}
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <NavMenu nav={nav} />

        {/* User info */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
              <div>
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
          {/* Language switcher */}
          <div className="mt-2 flex justify-center">
            <LanguageSwitcher />
          </div>
          <form action={signOutAction}>
            <button className="mt-2 w-full cursor-pointer rounded-lg py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              ↩ {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
            aria-label="Buka menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-gray-900">🏫 {tApp("brand")}</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher compact />
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>
              {roleLabel(user.role)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
