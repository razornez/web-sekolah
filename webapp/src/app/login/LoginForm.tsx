"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "rememberedLogin";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? t("loggingIn") : t("loginButton")}
    </button>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export function LoginForm({
  action,
  hasError,
}: {
  action: (formData: FormData) => Promise<void>;
  hasError: boolean;
}) {
  const t = useTranslations("auth");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  // Keamanan (BUG-034): "Ingat saya" HANYA menyimpan kode sekolah (tenant),
  // BUKAN username/identitas akun — tidak ada kredensial yang di-prefill.
  const [defaults, setDefaults] = useState<{ sekolah: string }>({ sekolah: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { sekolah?: string };
        if (data.sekolah) { setDefaults({ sekolah: data.sekolah }); setRemember(true); }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sekolah: fd.get("sekolah") }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Username & password tidak pernah disimpan.
  }

  // Hindari flash: tunggu localStorage termuat untuk set defaultValue
  if (!loaded) {
    return <div className="h-[360px] animate-pulse rounded-lg bg-gray-50" />;
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      {hasError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{t("invalidCredentials")}</span>
        </div>
      )}

      {/* Kode Sekolah */}
      <div className="space-y-1">
        <label htmlFor="sekolah" className="text-sm font-medium text-gray-700">
          {t("schoolCode")}
        </label>
        <input
          id="sekolah"
          name="sekolah"
          defaultValue={defaults.sekolah}
          placeholder={t("schoolCodePlaceholder")}
          className={inputCls}
        />
        <p className="text-xs text-gray-400">{t("schoolCodeHint")}</p>
      </div>

      {/* Username */}
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium text-gray-700">
          {t("username")}
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          placeholder={t("usernamePlaceholder")}
          className={inputCls}
        />
      </div>

      {/* Password + show/hide */}
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            title={showPw ? t("hidePassword") : t("showPassword")}
            aria-label={showPw ? t("hidePassword") : t("showPassword")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            {showPw ? (
              // eye-off
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              // eye
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
          />
          {t("rememberMe")}
        </label>
        <Link href="/lupa-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
          {t("forgotPassword")}
        </Link>
      </div>

      <SubmitButton />
    </form>
  );
}
