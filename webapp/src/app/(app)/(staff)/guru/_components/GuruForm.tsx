"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { saveGuru, type GuruFormState } from "../actions";
import { useFormRedirect } from "@/hooks/useFormRedirect";

export type GuruInitial = {
  id?: number;
  namaGuru?: string;
  nip?: string | null;
  npk?: string | null;
  nuptk?: string | null;
  nik?: string | null;
  jenisKelamin?: "L" | "P" | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
  email?: string | null;
  noTelp?: string | null;
  pangkat?: string | null;
  golongan?: string | null;
  jenisJabatan?: string | null;
  statusGuru?: string | null;
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function GuruForm({ initial }: { initial?: GuruInitial }) {
  const t = useTranslations("guru");
  const [state, formAction, pending] = useActionState<GuruFormState, FormData>(
    saveGuru,
    { ok: false },
  );
  useFormRedirect(state);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">{t("formNamaGuru")}</label>
        <input name="namaGuru" defaultValue={initial?.namaGuru ?? ""} className={inputCls} />
        <Err msg={e.namaGuru} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formJenisKelamin")}</label>
          <select name="jenisKelamin" defaultValue={initial?.jenisKelamin ?? ""} className={inputCls}>
            <option value="">{t("optPilih")}</option>
            <option value="L">{t("optLaki")}</option>
            <option value="P">{t("optPerempuan")}</option>
          </select>
          <Err msg={e.jenisKelamin} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formStatus")}</label>
          <input name="statusGuru" defaultValue={initial?.statusGuru ?? ""} placeholder={t("placeholderStatus")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formNip")}</label>
          <input name="nip" defaultValue={initial?.nip ?? ""} className={inputCls} />
          <Err msg={e.nip} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formNuptk")}</label>
          <input name="nuptk" defaultValue={initial?.nuptk ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formNpk")}</label>
          <input name="npk" defaultValue={initial?.npk ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formNik")}</label>
          <input name="nik" defaultValue={initial?.nik ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formTempatLahir")}</label>
          <input name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formTanggalLahir")}</label>
          <input type="date" name="tanggalLahir" defaultValue={initial?.tanggalLahir ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formEmail")}</label>
          <input name="email" defaultValue={initial?.email ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formNoTelp")}</label>
          <input name="noTelp" defaultValue={initial?.noTelp ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formPangkat")}</label>
          <input name="pangkat" defaultValue={initial?.pangkat ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t("formGolongan")}</label>
          <input name="golongan" defaultValue={initial?.golongan ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">{t("formAlamat")}</label>
        <textarea name="alamat" defaultValue={initial?.alamat ?? ""} rows={2} className={inputCls} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
        <Link href="/guru" className="text-sm text-gray-500 hover:text-gray-900">
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
