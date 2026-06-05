"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { saveIdentitasSekolah, type SekolahFormState } from "./actions";

const JENJANG = ["PAUD", "TK", "SD", "MI", "SMP", "MTS", "SMA", "MA", "SMK"];
const init: SekolahFormState = { ok: false };
const inCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

type Initial = {
  nama: string; npsn: string | null; jenjang: string; kurikulumDefault: string;
  alamat: string | null; telepon: string | null; email: string | null; website: string | null;
  kepalaSekolah: string | null; nipKepala: string | null; visi: string | null; misi: string | null;
};

export function SekolahForm({ initial }: { initial: Initial }) {
  const t = useTranslations("pengaturan");
  const [state, action, pending] = useActionState(saveIdentitasSekolah, init);

  return (
    <form action={action} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {state.ok && <div className="border-b border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700">✓ {t("schoolSaved")}</div>}
      {state.message && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">⚠️ {state.message}</div>}

      <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3"><h2 className="text-sm font-semibold text-gray-700">{t("schoolSectionIdentity")}</h2></div>
      <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolName")} *</label>
          <input name="nama" required defaultValue={initial.nama} className={inCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">NPSN</label>
          <input name="npsn" defaultValue={initial.npsn ?? ""} className={inCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolJenjang")}</label>
          <select name="jenjang" defaultValue={initial.jenjang} className={inCls}>
            {JENJANG.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolKurikulum")}</label>
          <select name="kurikulumDefault" defaultValue={initial.kurikulumDefault} className={inCls}>
            <option value="MERDEKA">Kurikulum Merdeka</option>
            <option value="K13">K13</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolKepala")}</label>
          <input name="kepalaSekolah" defaultValue={initial.kepalaSekolah ?? ""} className={inCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolNipKepala")}</label>
          <input name="nipKepala" defaultValue={initial.nipKepala ?? ""} className={inCls} />
        </div>
      </div>

      <div className="border-y border-gray-100 bg-gray-50/60 px-5 py-3"><h2 className="text-sm font-semibold text-gray-700">{t("schoolSectionContact")}</h2></div>
      <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolAlamat")}</label>
          <input name="alamat" defaultValue={initial.alamat ?? ""} className={inCls} />
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolTelepon")}</label><input name="telepon" defaultValue={initial.telepon ?? ""} className={inCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input name="email" type="email" defaultValue={initial.email ?? ""} className={inCls} /></div>
        <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Website</label><input name="website" defaultValue={initial.website ?? ""} className={inCls} /></div>
      </div>

      <div className="border-y border-gray-100 bg-gray-50/60 px-5 py-3"><h2 className="text-sm font-semibold text-gray-700">{t("schoolSectionVision")}</h2></div>
      <div className="grid grid-cols-1 gap-4 px-5 py-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolVisi")}</label><textarea name="visi" rows={2} defaultValue={initial.visi ?? ""} className={`${inCls} resize-none`} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">{t("schoolMisi")}</label><textarea name="misi" rows={3} defaultValue={initial.misi ?? ""} className={`${inCls} resize-none`} /></div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
        <button disabled={pending} className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? "…" : t("schoolSave")}
        </button>
        <Link href="/pengaturan" className="text-sm text-gray-500 hover:text-gray-900">{t("schoolBack")}</Link>
      </div>
    </form>
  );
}
