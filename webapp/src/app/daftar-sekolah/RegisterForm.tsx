"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { daftarSekolah, type RegState } from "./actions";

const JENJANG = ["PAUD/TK", "SD/MI", "SMP/MTs", "SMA/MA", "SMK"];
const init: RegState = { ok: false };
const inCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export function RegisterForm() {
  const t = useTranslations("landing");
  const [state, action, pending] = useActionState(daftarSekolah, init);

  const errMsg =
    state.error === "required" ? t("regErrorRequired")
    : state.error === "username" ? t("regUsernameTaken")
    : state.error === "password" ? t("regPasswordShort")
    : state.error === "server" ? "⚠️ Terjadi kesalahan. Coba lagi."
    : null;

  return (
    <form action={action} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        {t("regDemoNote")}
      </div>

      {errMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ {errMsg}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regNamaSekolah")} *</label>
          <input name="namaSekolah" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regJenjang")}</label>
          <select name="jenjang" defaultValue="SMA/MA" className={inCls}>
            {JENJANG.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regNamaPic")} *</label>
          <input name="namaPic" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regUsername")} *</label>
          <input name="username" required minLength={3} autoComplete="username" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regPassword")} *</label>
          <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regEmail")}</label>
          <input name="email" type="email" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regTelepon")}</label>
          <input name="telepon" className={inCls} />
        </div>
      </div>

      <button disabled={pending} className="mt-6 w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
        {pending ? t("regSubmitting") : t("regSubmit")}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">
        <Link href="/login" className="hover:underline">{t("navMasuk")}</Link>
      </p>
    </form>
  );
}
