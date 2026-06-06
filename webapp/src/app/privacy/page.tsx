import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Smart School",
  description: "Kebijakan privasi & perlindungan data Smart School.",
};

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const tApp = await getTranslations("app");
  const sections = [
    { title: t("privacyS1Title"), body: t("privacyS1") },
    { title: t("privacyS2Title"), body: t("privacyS2") },
    { title: t("privacyS3Title"), body: t("privacyS3") },
    { title: t("privacyS4Title"), body: t("privacyS4") },
    { title: t("privacyS5Title"), body: t("privacyS5") },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">{t("backToLogin")}</Link>
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{t("privacyTitle")}</h1>
          <p className="mt-1 text-xs text-gray-400">{t("privacyUpdated")}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{t("privacyIntro")}</p>
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
          © {new Date().getFullYear()} {tApp("brand")} · <Link href="/terms" className="hover:underline">{t("termsTitle")}</Link>
        </p>
      </div>
    </main>
  );
}
