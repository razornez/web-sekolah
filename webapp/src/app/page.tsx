import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Smart School — Sistem Informasi Sekolah Modern",
  description:
    "Platform manajemen sekolah all-in-one: siswa, nilai, presensi, keuangan, PPDB, rapor digital. Multi-sekolah, dwibahasa, responsif.",
};

const MODULES = [
  "👨‍🎓 Siswa", "👩‍🏫 Guru", "🏫 Rombel", "📚 Mapel", "📊 Nilai", "📝 Rapor",
  "🗓 Presensi", "💰 SPP", "📥 PPDB", "📖 Perpustakaan", "🏛 Sarpras", "⚖️ BK",
  "🎯 Ekstrakurikuler", "📣 Pengumuman", "🧪 P5", "🗳 OSIS", "🎓 Kelulusan", "📋 Audit",
];

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tApp = await getTranslations("app");
  const session = await auth();
  const loggedIn = !!session?.user;

  const features = [
    { icon: "👨‍🎓", title: t("f1Title"), desc: t("f1Desc"), color: "from-blue-500 to-indigo-500" },
    { icon: "📝", title: t("f2Title"), desc: t("f2Desc"), color: "from-violet-500 to-purple-500" },
    { icon: "🗓", title: t("f3Title"), desc: t("f3Desc"), color: "from-emerald-500 to-teal-500" },
    { icon: "💰", title: t("f4Title"), desc: t("f4Desc"), color: "from-amber-500 to-orange-500" },
    { icon: "📥", title: t("f5Title"), desc: t("f5Desc"), color: "from-rose-500 to-pink-500" },
    { icon: "📖", title: t("f6Title"), desc: t("f6Desc"), color: "from-cyan-500 to-sky-500" },
  ];
  const why = [
    { title: t("why1Title"), desc: t("why1Desc") },
    { title: t("why2Title"), desc: t("why2Desc") },
    { title: t("why3Title"), desc: t("why3Desc") },
    { title: t("why4Title"), desc: t("why4Desc") },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">🏫</span> {tApp("brand")}
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#fitur" className="hover:text-gray-900">{t("navFitur")}</a>
            <a href="#modul" className="hover:text-gray-900">{t("navModul")}</a>
            <a href="#kenapa" className="hover:text-gray-900">{t("whyTitle")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {loggedIn ? t("navDashboard") : t("navMasuk")}
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200">
            ✨ {t("heroBadge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-300 sm:text-lg">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={loggedIn ? "/dashboard" : "/login"}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-gray-100">
              {t("heroCtaPrimary")} →
            </Link>
            <a href="#fitur" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {t("heroCtaSecondary")}
            </a>
          </div>
          <p className="mt-5 text-xs text-gray-400">{t("heroNote")}</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
          {[
            { n: "Multi", l: t("statSekolah") },
            { n: "1.000+", l: t("statSiswa") },
            { n: "24", l: t("statModul") },
            { n: "2", l: t("statBahasa") },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-black text-indigo-600">{s.n}</div>
              <div className="mt-1 text-xs font-medium text-gray-500">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("featuresTitle")}</h2>
          <p className="mt-3 text-gray-500">{t("featuresSubtitle")}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-2xl shadow-sm`}>
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules showcase ── */}
      <section id="modul" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("modulesTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">{t("modulesSubtitle")}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {MODULES.map((m) => (
              <span key={m} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section id="kenapa" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("whyTitle")}</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((w) => (
            <div key={w.title} className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
              <div className="text-xl font-bold">{w.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mt-3 text-indigo-100">{t("ctaSubtitle")}</p>
          <Link href={loggedIn ? "/dashboard" : "/login"}
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5">
            {t("ctaButton")} →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 text-lg font-bold">🏫 {tApp("brand")}</div>
              <p className="mt-3 text-sm text-gray-500">{t("footerTagline")}</p>
            </div>
            <div className="flex gap-16">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("footerProduk")}</div>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><a href="#fitur" className="hover:text-gray-900">{t("navFitur")}</a></li>
                  <li><a href="#modul" className="hover:text-gray-900">{t("navModul")}</a></li>
                  <li><Link href="/login" className="hover:text-gray-900">{t("navMasuk")}</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("footerLegal")}</div>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><Link href="/privacy" className="hover:text-gray-900">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-gray-900">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} {tApp("brand")}. {t("footerHak")}.
          </div>
        </div>
      </footer>
    </div>
  );
}
