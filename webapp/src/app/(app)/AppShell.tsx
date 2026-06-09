"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarScene } from "./_akadewa/SidebarScene";

// ── Navigation Loading Overlay (dipertahankan dari versi lama) ─────────────────
const NAV_FAKTA = [
  "Indonesia punya lebih dari 250.000 sekolah aktif.",
  "Ada 54 juta lebih siswa yang belajar setiap hari.",
  "Albert Einstein pernah dianggap siswa yang lambat belajar.",
  "Finlandia melarang PR untuk siswa SD — hasilnya lebih cerdas!",
  "Otak paling aktif menyerap pelajaran sekitar pukul 10 pagi.",
  "Belajar 25 menit lalu istirahat 5 menit terbukti lebih efektif.",
  "Menulis tangan lebih baik dari mengetik untuk mengingat materi.",
  "Tidur cukup setelah belajar memperkuat memori jangka panjang.",
  "Membaca 20 menit sehari setara dengan 1,8 juta kata per tahun.",
  "Jerapah tidur hanya 1–2 jam sehari. Siswa butuh 8–10 jam! 🦒",
  "Gurita punya tiga jantung dan darah berwarna biru.",
  "Madu tidak pernah basi — arkeolog menemukan madu 3000 tahun lalu.",
];
const NAV_SIMBOL = ["2²=4", "∫dx", "π≈3.14", "√144", "∑nᵢ", "E=mc²", "a²+b²=c²", "∀x∈ℝ", "lim→∞", "F=ma", "H₂O", "DNA", "ATP", "∞", "Δ", "42", "eⁱπ+1=0"];
const NAV_FLOATERS = NAV_SIMBOL.map((s, i) => ({
  text: s,
  left: `${((i * 37 + 5) % 88) + 3}%`,
  delay: `${((i * 9) % 50) / 10}s`,
  dur: `${5 + (i % 5)}s`,
  size: [13, 16, 11, 18, 12][i % 5],
  op: [0.12, 0.08, 0.15, 0.07, 0.1][i % 5],
}));

function NavLoadingOverlay() {
  const [fi, setFi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFi((i) => (i + 1) % NAV_FAKTA.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg,rgba(248,245,254,0.97)0%,rgba(238,235,255,0.97)50%,rgba(248,245,254,0.97)100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] z-50 overflow-hidden" style={{ background: "rgba(91,79,233,0.08)" }}>
        <div className="ss-nav-bar h-full rounded-full" style={{ background: "linear-gradient(90deg,#5B4FE9,#7E6FE8)", boxShadow: "0 0 8px rgba(91,79,233,0.6)" }} />
      </div>
      {NAV_FLOATERS.map((f, i) => (
        <span key={i} className="ss-floater" style={{ left: f.left, bottom: "-20%", fontSize: f.size, opacity: f.op, color: "#5B4FE9", animationDelay: f.delay, animationDuration: f.dur }}>{f.text}</span>
      ))}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative flex h-[72px] w-[72px] items-center justify-center">
          <div className="ss-pulse-ring absolute h-[72px] w-[72px] rounded-full border-2" style={{ borderColor: "rgba(181,168,245,0.5)" }} />
          <div className="ss-pulse-ring2 absolute h-[52px] w-[52px] rounded-full border-2" style={{ borderColor: "rgba(126,111,232,0.6)" }} />
          <div className="ss-spin h-[34px] w-[34px] rounded-full" style={{ border: "3px solid #EEEBFF", borderTopColor: "#5B4FE9" }} />
        </div>
        <p className="font-bold" style={{ fontSize: 15, color: "#4A3FD1" }}>Memuat halaman…</p>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
        style={{ width: "min(340px,80%)", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(91,79,233,0.2)", borderRadius: 12, backdropFilter: "blur(4px)", padding: "12px 16px", boxShadow: "0 2px 12px rgba(91,79,233,0.08)" }}>
        <p style={{ color: "#7E6FE8", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 5px" }}>💡 Tahukah kamu?</p>
        <p key={fi} className="ss-fact-enter" style={{ color: "#3B2FA6", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{NAV_FAKTA[fi]}</p>
      </div>
    </div>
  );
}

// ── Scene per menu. navKey tak terdaftar → pakai navKey-nya → fallback berwarna. ──
const SCENE_BY_NAV: Record<string, string> = {
  dashboard: "beranda", siswa: "siswa", guru: "guru", jadwal: "jadwal",
  presensi: "absensi", nilai: "rapor", spp: "keuangan", ujian: "ujian",
  audit: "laporan", pengaturan: "pengaturan",
  pengumuman: "pengumuman", rombel: "rombel", mapel: "mapel", bk: "bk",
  perpustakaan: "perpustakaan", ppdb: "ppdb", tugas: "tugas", prestasi: "prestasi",
  surat: "surat", sarpras: "sarpras", jurnal: "jurnal",
  portalSaya: "beranda", tugasSaya: "tugas", ujianSaya: "ujian", vote: "vote",
};

type NavItem = { href: string; navKey: string; label: string };
type User = { name?: string | null; role: string };
type Badges = { siswa?: number; spp?: number };

function fmtBadge(n: number) {
  return n >= 1000 ? n.toLocaleString("id-ID") : String(n);
}

export function AppShell({
  nav,
  user,
  signOutAction,
  badges = {},
  isPortal = false,
  children,
}: {
  nav: NavItem[];
  user: User;
  signOutAction: () => Promise<void>;
  badges?: Badges;
  isPortal?: boolean;
  children: React.ReactNode;
}) {
  const [navLoading, setNavLoad] = useState(false);
  const [popOpen, setPopOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState<{ day: string; rest: string }>({ day: "", rest: "" });
  const pathname = usePathname();
  const t = useTranslations("common");
  const tApp = useTranslations("app");
  const tRoles = useTranslations("roles");
  const profileRef = useRef<HTMLDivElement>(null);

  const roleLabel = (role: string) => {
    try { return tRoles(role as never); } catch { return role; }
  };

  // Tanggal real (client-side, hindari mismatch SSR/timezone)
  useEffect(() => {
    const now = new Date();
    const locale = document.documentElement.lang || "id";
    const id = requestAnimationFrame(() =>
      setDateLabel({
        day: String(now.getDate()),
        rest: now.toLocaleDateString(locale, { weekday: "long", month: "long", year: "numeric" }),
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Progress bar saat navigasi
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("/api")) return;
      // Hanya tampilkan overlay untuk pindah HALAMAN (pathname beda).
      // Navigasi query-only (filter/pagination di halaman sama) tidak butuh overlay
      // dan reset-nya tidak terpicu oleh pathname → jangan set agar tak nyangkut.
      const hrefPath = href.split(/[?#]/)[0];
      if (hrefPath !== pathname) setNavLoad(true);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [pathname]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { setNavLoad(false); setPopOpen(false); });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Outside-click + ESC untuk popover profil
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setPopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPopOpen(false); };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); window.removeEventListener("keydown", onKey); };
  }, [popOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && href !== "/portal" && pathname.startsWith(href + "/"));

  const initials = user.name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?";
  const badgeFor = (navKey: string): string | null => {
    if (navKey === "siswa" && badges.siswa) return fmtBadge(badges.siswa);
    if (navKey === "spp" && badges.spp) return fmtBadge(badges.spp);
    return null;
  };
  const homeHref = isPortal ? "/portal" : "/dashboard";

  return (
    <div className="ak-shell">
      {/* ───── SIDEBAR ───── */}
      <aside className="ak-side">
        <Link href={homeHref} className="ak-brand" title={tApp("brand")} aria-label={tApp("brand")}>
          <span className="ak-ring" />
          <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
            <path d="M5 17 L11 7 L17 17" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M8 13.5 Q11 12 14 13.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </svg>
        </Link>

        <div className="ak-sep" />

        {/* SEMUA menu (permission per-role dari DB) tampil sbg tile — paritas dgn sebelum revamp */}
        <nav className="ak-nav-scroll" aria-label="Menu utama">
          {nav.map((n) => {
            const active = isActive(n.href);
            const badge = badgeFor(n.navKey);
            return (
              <Link key={n.href} href={n.href} data-ak-nav={n.navKey} className={`ak-item${active ? " ak-active" : ""}`} aria-current={active ? "page" : undefined} aria-label={n.label} title={n.label}>
                <span className="ak-scene"><SidebarScene scene={SCENE_BY_NAV[n.navKey] ?? n.navKey} /></span>
                <span className="ak-label">{n.label}</span>
                {badge && <span className="ak-badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: profil + logout selalu terlihat (di luar area scroll) */}
        <div className="ak-side-foot" ref={profileRef}>
          <button type="button" className="ak-profile" onClick={() => setPopOpen((v) => !v)} title={user.name ?? ""} aria-haspopup="true" aria-expanded={popOpen}>
            {initials}
          </button>
          <form action={signOutAction}>
            <button type="submit" className="ak-logout" title={t("logout")}>↩ {t("logout")}</button>
          </form>
          {popOpen && (
            <div className="ak-pop">
              <div className="ak-pop-name">{user.name}</div>
              <span className="ak-pop-role">{roleLabel(user.role)}</span>
              <div className="ak-pop-sep" />
              <div className="flex justify-center"><LanguageSwitcher /></div>
              <div className="ak-pop-sep" />
              <form action={signOutAction}>
                <button type="submit" className="ak-pop-logout">↩ {t("logout")}</button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main className="ak-main">
        {navLoading && <NavLoadingOverlay />}

        <div className="ak-topbar">
          <Link href={isPortal ? "/portal" : "/siswa"} className="ak-cmd" aria-label={t("searchPlaceholder")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--ak-muted)" }}><circle cx="6" cy="6" r="4.5" /><path d="M9.2 9.2L12.5 12.5" /></svg>
            <span className="ak-ph">{t("searchPlaceholder")}</span>
            <span className="ak-kbd">/</span>
          </Link>
          <div className="ak-topbar-actions">
            <LanguageSwitcher compact />
            <div className="ak-datepill" suppressHydrationWarning>
              <span className="ak-dic">{dateLabel.day || "·"}</span>
              <span suppressHydrationWarning>{dateLabel.rest || " "}</span>
            </div>
            <Link href={isPortal ? "/portal" : "/pengumuman"} className="ak-iconbtn" aria-label="Pengumuman">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13 Q4 10 4 8 Q4 4 9 4 Q14 4 14 8 Q14 10 14 13 Z" /><path d="M7 15 Q9 17 11 15" /></svg>
            </Link>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
