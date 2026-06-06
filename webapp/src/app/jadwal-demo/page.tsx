import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "Jadwalkan Demo — Smart School",
  description: "Jadwalkan demo Smart School bersama tim kami.",
};

export default async function JadwalDemoPage() {
  const t = await getTranslations("landing");
  const tApp = await getTranslations("app");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-900">🏫 {tApp("brand")}</Link>
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("jdTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("jdSubtitle")}</p>
        </div>
        <DemoForm />
        {/* Alternatif: coba instan */}
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
          <p className="text-sm text-indigo-800">{t("jdAtauInstan")}</p>
          <Link href="/daftar-sekolah" className="mt-2 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {t("jdCobaInstan")} →
          </Link>
        </div>
      </div>
    </main>
  );
}
