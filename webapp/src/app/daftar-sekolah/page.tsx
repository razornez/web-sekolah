import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Daftar Sekolah — Smart School",
  description: "Daftarkan sekolah Anda ke Smart School.",
};

export default async function DaftarSekolahPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("regTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("regSubtitle")}</p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          <Link href="/" className="hover:underline">{t("regBackHome")}</Link>
        </p>
      </div>
    </main>
  );
}
