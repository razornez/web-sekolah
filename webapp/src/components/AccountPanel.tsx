"use client";

import { useActionState } from "react";
import {
  createAccountGuru,
  createAccountSiswa,
  resetPassword,
  toggleAktif,
  type AccountState,
} from "@/app/(app)/akun/actions";

const inCls =
  "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export function AccountPanel({
  kind,
  ownerId,
  account,
}: {
  kind: "guru" | "siswa";
  ownerId: number;
  account: { userId: string; username: string; isActive: boolean } | null;
}) {
  const createAction = kind === "guru" ? createAccountGuru : createAccountSiswa;
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    createAction,
    { ok: false },
  );

  return (
    <div className="max-w-2xl space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-medium text-gray-700">Akun Login</h2>

      {account ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Username:</span>
            <span className="font-medium text-gray-900">{account.username}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                account.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {account.isActive ? "aktif" : "nonaktif"}
            </span>
          </div>

          <form action={resetPassword} className="flex items-end gap-2">
            <input type="hidden" name="userId" value={account.userId} />
            <div>
              <label className="block text-xs text-gray-500">Reset password</label>
              <input name="password" type="password" minLength={6} required placeholder="min 6 karakter" className={inCls} />
            </div>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
              Reset
            </button>
          </form>

          <form action={toggleAktif}>
            <input type="hidden" name="userId" value={account.userId} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="ownerId" value={ownerId} />
            <button className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              {account.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
            </button>
          </form>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="ownerId" value={ownerId} />
          {state.message && (
            <p className={`rounded-md px-3 py-2 text-sm ${state.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {state.message}
            </p>
          )}
          <p className="text-sm text-gray-500">Belum punya akun login. Buat sekarang:</p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500">Username</label>
              <input name="username" required minLength={3} className={inCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Password</label>
              <input name="password" type="password" required minLength={6} className={inCls} />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {pending ? "Membuat…" : "Buat Akun"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
