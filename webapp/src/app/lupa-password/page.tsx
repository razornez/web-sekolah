import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function LupaPasswordPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");

  const steps = [t("forgotStep1"), t("forgotStep2"), t("forgotStep3"), t("forgotStep4")];

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-white">{t("forgotTitle")}</h1>
          <p className="mt-1 text-sm text-gray-300">{t("forgotSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl sm:p-8">
          {/* Info */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0">🛡️</span>
            <span>{t("forgotInfo")}</span>
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <Link
              href="/login"
              className="block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {tApp("brand")} · {t("footer")}
        </p>
      </div>
    </main>
  );
}
