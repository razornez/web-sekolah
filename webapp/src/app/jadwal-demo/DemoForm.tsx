"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { kirimJadwalDemo, type DemoState } from "./actions";

const init: DemoState = { ok: false };
const inCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export function DemoForm() {
  const t = useTranslations("landing");
  const [state, action, pending] = useActionState(kirimJadwalDemo, init);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-5xl">📅</div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{t("jdSuccessTitle")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("jdSuccessDesc")}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
          {t("jdSuccessHome")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {state.error === "server" ? "Terjadi kesalahan. Coba lagi." : t("jdError")}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdNama")} *</label>
          <input name="nama" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdSekolah")} *</label>
          <input name="namaSekolah" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdEmail")}</label>
          <input name="email" type="email" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdTelepon")}</label>
          <input name="telepon" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdTanggal")}</label>
          <input name="tanggal" type="date" min={new Date().toISOString().slice(0, 10)} className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdJam")}</label>
          <input name="jam" type="time" defaultValue="09:00" className={inCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("jdCatatan")}</label>
          <textarea name="catatan" rows={3} className={`${inCls} resize-none`} />
        </div>
      </div>
      <button disabled={pending} className="mt-6 w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
        {pending ? t("jdSubmitting") : t("jdSubmit")}
      </button>
    </form>
  );
}
