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

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{t("regSuccessTitle")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("regSuccessDesc")}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
          {t("regSuccessHome")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {state.error === "required" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ {t("regErrorRequired")}</div>
      )}
      {state.error === "server" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ Terjadi kesalahan. Coba lagi.</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regNamaSekolah")} *</label>
          <input name="namaSekolah" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regJenjang")}</label>
          <select name="jenjang" defaultValue="" className={inCls}>
            <option value="">—</option>
            {JENJANG.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regJumlahSiswa")}</label>
          <input name="jumlahSiswa" placeholder="±" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regNamaPic")} *</label>
          <input name="namaPic" required className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regJabatan")}</label>
          <input name="jabatan" placeholder="Kepala Sekolah / Operator…" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regEmail")}</label>
          <input name="email" type="email" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regTelepon")}</label>
          <input name="telepon" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regKota")}</label>
          <input name="kota" className={inCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regPaket")}</label>
          <select name="paket" defaultValue="" className={inCls}>
            <option value="">—</option>
            <option value="Gratis">Gratis / Free</option>
            <option value="Sekolah">Sekolah / School</option>
            <option value="Yayasan">Yayasan / Foundation</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("regCatatan")}</label>
          <textarea name="catatan" rows={3} className={`${inCls} resize-none`} />
        </div>
      </div>

      <button disabled={pending} className="mt-6 w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
        {pending ? t("regSubmitting") : t("regSubmit")}
      </button>
    </form>
  );
}
