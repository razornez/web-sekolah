"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createStaffUser, type UserFormState } from "./actions";

const init: UserFormState = { ok: false };
const inCls = "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export function CreateUserForm({ roles }: { roles: { value: string; label: string }[] }) {
  const t = useTranslations("pengaturan");
  const [state, action, pending] = useActionState(createStaffUser, init);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 select-none">
        <span className="text-sm font-semibold text-gray-800">{t("addUser")}</span>
        <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 group-open:hidden">{t("save").replace("Simpan","Buka").replace("Save","Open")}</span>
        <span className="rounded-md border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hidden group-open:inline">×</span>
      </summary>
      <div className="border-t border-gray-100 px-5 py-4">
        {state.error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ {state.error}</div>
        )}
        {state.ok && (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">✓ {t("createBtn")} ✓</div>
        )}
        <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fNama")} *</label>
            <input name="namaLengkap" required className={`${inCls} w-full`} />
          </div>
          <div className="min-w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fUsername")} *</label>
            <input name="username" required className={inCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fRole")} *</label>
            <select name="role" required defaultValue="guru" className={inCls}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fPassword")} *</label>
            <input name="password" type="text" required minLength={6} className={inCls} />
          </div>
          <button disabled={pending} className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {pending ? "…" : t("createBtn")}
          </button>
        </form>
      </div>
    </details>
  );
}
