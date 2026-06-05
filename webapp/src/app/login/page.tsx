import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./LoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      sekolah: formData.get("sekolah") || undefined,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4">
      {/* Language switcher pojok kanan atas */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur">
            🏫
          </div>
          <h1 className="text-2xl font-bold text-white">{tApp("brand")}</h1>
          <p className="mt-1 text-sm text-gray-300">{tApp("tagline")}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">{t("loginTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("loginSubtitle")}</p>
          </div>

          <LoginForm action={login} hasError={!!error} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {tApp("brand")} · {t("footer")}
        </p>
      </div>
    </main>
  );
}
