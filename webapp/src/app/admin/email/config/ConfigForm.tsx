"use client";

import { useActionState, useState, useEffect } from "react";
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
  const [provider, setProvider] = useState(initial?.provider ?? "smtp");
  const [saveState, saveAction, savePending] = useActionState(saveEmailConfig, null);
  const [testState, testAction, testPending] = useActionState(testEmailConfig, null);

  useEffect(() => {
    if (initial?.provider) setProvider(initial.provider);
  }, [initial]);

  return (
    <div className="space-y-6">
      {/* Pesan hasil */}
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

      {/* Status terakhir */}
      {initial?.lastTestedAt && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={`h-2 w-2 rounded-full ${initial.lastTestOk ? "bg-green-500" : "bg-red-500"}`} />
          Test terakhir: {new Date(initial.lastTestedAt).toLocaleString("id-ID")} —{" "}
          <span className={initial.lastTestOk ? "text-green-700" : "text-red-700"}>
            {initial.lastTestOk ? "Berhasil" : "Gagal"}
          </span>
        </div>
      )}

      <form action={saveAction} className="space-y-5">
        {/* Provider */}
        <div>
          <label className={labelCls}>Provider</label>
          <div className="flex gap-3">
            {(["smtp", "resend"] as const).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="provider"
                  value={p}
                  checked={provider === p}
                  onChange={() => setProvider(p)}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-medium capitalize">{p === "smtp" ? "SMTP (custom)" : "Resend"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Common: From */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>From Name</label>
            <input name="fromName" defaultValue={initial?.fromName ?? "Smart School"} className={inputCls} placeholder="Smart School" />
          </div>
          <div>
            <label className={labelCls}>From Email</label>
            <input name="fromEmail" type="email" defaultValue={initial?.fromEmail ?? ""} className={inputCls} placeholder="noreply@sekolah.com" />
          </div>
        </div>

        {/* SMTP fields */}
        {provider === "smtp" && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengaturan SMTP</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Host</label>
                <input name="smtpHost" defaultValue={initial?.smtpHost ?? ""} className={inputCls} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className={labelCls}>Port</label>
                <input name="smtpPort" type="number" defaultValue={initial?.smtpPort ?? 587} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Username</label>
                <input name="smtpUser" defaultValue={initial?.smtpUser ?? ""} className={inputCls} placeholder="user@gmail.com" autoComplete="off" />
              </div>
              <div>
                <label className={labelCls}>
                  Password{" "}
                  <span className="font-normal text-gray-400 text-xs">
                    {initial?.smtpPassDec ? "(tersimpan — kosongkan untuk tidak mengubah)" : ""}
                  </span>
                </label>
                <input name="smtpPass" type="password" className={inputCls} placeholder={initial?.smtpPassDec ? "••••••••" : "Password SMTP"} autoComplete="new-password" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="smtpSecure"
                value="1"
                defaultChecked={initial?.smtpSecure ?? true}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              <span>Gunakan TLS/SSL (port 465) — nonaktifkan untuk STARTTLS (port 587)</span>
            </label>
          </fieldset>
        )}

        {/* Resend fields */}
        {provider === "resend" && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengaturan Resend</legend>
            <div>
              <label className={labelCls}>
                API Key{" "}
                <span className="font-normal text-gray-400 text-xs">
                  {initial?.resendKeyDec ? "(tersimpan — kosongkan untuk tidak mengubah)" : ""}
                </span>
              </label>
              <input name="resendKey" type="password" className={inputCls} placeholder={initial?.resendKeyDec ? "••••••••" : "re_xxxxxxxxxxxx"} autoComplete="new-password" />
            </div>
          </fieldset>
        )}

        {/* Aktif */}
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isActive"
            value="1"
            defaultChecked={initial?.isActive ?? false}
            className="h-4 w-4 rounded accent-indigo-600"
          />
          <span>Aktifkan konfigurasi ini (email akan mulai terkirim)</span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {savePending ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </form>

      {/* Test — form terpisah agar tidak submit config */}
      <form action={testAction}>
        <button
          type="submit"
          disabled={testPending || !initial}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          title={!initial ? "Simpan konfigurasi dulu" : undefined}
        >
          {testPending ? "Mengirim..." : "Kirim Email Test ke Akun Saya"}
        </button>
      </form>
    </div>
  );
}
