"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { saveSurat, type SuratFormState } from "../actions";

export type SuratInitial = {
  id?: number;
  perihal?: string;
  nomor?: string | null;
  jenis?: string | null;
  isi?: string | null;
  tanggal?: string | null;
};

const inCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function SuratForm({ initial }: { initial?: SuratInitial }) {
  const t = useTranslations("surat");
  const [state, formAction, pending] = useActionState<SuratFormState, FormData>(saveSurat, { ok: false });
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">{t("fieldPerihal")}</label>
          <input name="perihal" defaultValue={initial?.perihal ?? ""} className={inCls} />
          <Err msg={e.perihal} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("fieldTanggal")}</label>
          <input type="date" name="tanggal" defaultValue={initial?.tanggal ?? ""} className={inCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("fieldNomor")}</label>
          <input name="nomor" defaultValue={initial?.nomor ?? ""} className={inCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("fieldJenis")}</label>
          <input name="jenis" defaultValue={initial?.jenis ?? ""} placeholder={t("jenisPlaceholder")} className={inCls} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">{t("fieldIsi")}</label>
        <textarea name="isi" defaultValue={initial?.isi ?? ""} rows={5} className={inCls} />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? t("saving") : t("save")}
        </button>
        <Link href="/surat" className="text-sm text-gray-500 hover:text-gray-900">{t("cancel")}</Link>
      </div>
    </form>
  );
}
