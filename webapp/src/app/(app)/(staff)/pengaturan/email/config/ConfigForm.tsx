"use client";

import { useActionState, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { saveEmailConfig, testEmailConfig } from "./actions";

interface ConfigData {
  id: number;
  provider: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPassDec: string;
  resendKeyDec: string;
  lastTestedAt: Date | null;
  lastTestOk: boolean | null;
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export function ConfigForm({ initial }: { initial: ConfigData | null }) {
  const t = useTranslations("pengaturan");
  const [provider, setProvider] = useState(initial?.provider ?? "smtp");
  const [saveState, saveAction, savePending] = useActionState(saveEmailConfig, null);
  const [testState, testAction, testPending] = useActionState(testEmailConfig, null);

  useEffect(() => {
    if (initial?.provider) setProvider(initial.provider);
  }, [initial]);

  return (
    <div className="space-y-6">
      {saveState && (
        <div className={`rounded-lg px-4 py-3 text-sm ${saveState.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {saveState.message}
        </div>
      )}
      {testState && (
        <div className={`rounded-lg px-4 py-3 text-sm ${testState.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {testState.message}
        </div>
      )}

      {initial?.lastTestedAt && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={`h-2 w-2 rounded-full ${initial.lastTestOk ? "bg-green-500" : "bg-red-500"}`} />
          {t("emailCfgLastTest")} {new Date(initial.lastTestedAt).toLocaleString()} —{" "}
          <span className={initial.lastTestOk ? "text-green-700" : "text-red-700"}>
            {initial.lastTestOk ? t("emailCfgTestOk") : t("emailCfgTestFail")}
          </span>
        </div>
      )}

      <form action={saveAction} className="space-y-5">
        <div>
          <label className={labelCls}>{t("emailCfgProvider")}</label>
          <div className="flex gap-3">
            {(["smtp", "resend"] as const).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="provider" value={p} checked={provider === p} onChange={() => setProvider(p)} className="accent-indigo-600" />
                <span className="text-sm font-medium">{p === "smtp" ? t("emailCfgSmtpCustom") : "Resend"}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("emailCfgFromName")}</label>
            <input name="fromName" defaultValue={initial?.fromName ?? ""} className={inputCls} placeholder="Nama Sekolah" />
          </div>
          <div>
            <label className={labelCls}>{t("emailCfgFromEmail")}</label>
            <input name="fromEmail" type="email" defaultValue={initial?.fromEmail ?? ""} className={inputCls} placeholder="noreply@sekolah.com" />
          </div>
        </div>

        {provider === "smtp" && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("emailCfgSmtpSettings")}</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("emailCfgHost")}</label>
                <input name="smtpHost" defaultValue={initial?.smtpHost ?? ""} className={inputCls} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className={labelCls}>{t("emailCfgPort")}</label>
                <input name="smtpPort" type="number" defaultValue={initial?.smtpPort ?? 587} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("emailCfgUsername")}</label>
                <input name="smtpUser" defaultValue={initial?.smtpUser ?? ""} className={inputCls} placeholder="user@gmail.com" autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>
                  {t("emailCfgPassword")}{" "}
                  {initial?.smtpPassDec && <span className="font-normal text-gray-400 text-xs">{t("emailCfgSecretSaved")}</span>}
                </label>
                <input name="smtpPass" type="password" className={inputCls} placeholder={initial?.smtpPassDec ? "••••••••" : "Password SMTP"} autoComplete="new-password" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" name="smtpSecure" value="1" defaultChecked={initial?.smtpSecure ?? true} className="h-4 w-4 rounded accent-indigo-600" />
              <span>{t("emailCfgSslLabel")}</span>
            </label>
          </fieldset>
        )}

        {provider === "resend" && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("emailCfgResendSettings")}</legend>
            <div>
              <label className={labelCls}>
                {t("emailCfgResendKey")}{" "}
                {initial?.resendKeyDec && <span className="font-normal text-gray-400 text-xs">{t("emailCfgSecretSaved")}</span>}
              </label>
              <input name="resendKey" type="password" className={inputCls} placeholder={initial?.resendKeyDec ? "••••••••" : "re_xxxxxxxxxxxx"} autoComplete="new-password" />
            </div>
          </fieldset>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="isActive" value="1" defaultChecked={initial?.isActive ?? false} className="h-4 w-4 rounded accent-indigo-600" />
          <span>{t("emailCfgActiveLabel")}</span>
        </label>

        <button type="submit" disabled={savePending}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {savePending ? t("emailCfgSaving") : t("emailCfgSaveBtn")}
        </button>
      </form>

      <form action={testAction}>
        <button type="submit" disabled={testPending || !initial}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          title={!initial ? t("emailCfgSaveFirst") : undefined}>
          {testPending ? t("emailCfgTesting") : t("emailCfgTestBtn")}
        </button>
      </form>
    </div>
  );
}
