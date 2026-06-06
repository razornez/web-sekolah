import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Smart School",
  description: "Syarat & ketentuan penggunaan Smart School.",
};

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const tApp = await getTranslations("app");
  const sections = [
    { title: t("termsS1Title"), body: t("termsS1") },
    { title: t("termsS2Title"), body: t("termsS2") },
    { title: t("termsS3Title"), body: t("termsS3") },
    { title: t("termsS4Title"), body: t("termsS4") },
    { title: t("termsS5Title"), body: t("termsS5") },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">{t("backToLogin")}</Link>
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{t("termsTitle")}</h1>
          <p className="mt-1 text-xs text-gray-400">{t("termsUpdated")}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{t("termsIntro")}</p>
          <div className="mt-6 space-y-5">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-sm font-bold text-gray-900">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {tApp("brand")} · <Link href="/privacy" className="hover:underline">{t("privacyTitle")}</Link>
        </p>
      </div>
    </main>
  );
}
