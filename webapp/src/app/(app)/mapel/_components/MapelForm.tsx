"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveMapel, type MapelFormState } from "../actions";

export type Option = { id: number; label: string };
export type MapelInitial = {
  id?: number;
  namaMapel?: string;
  kodeMapel?: string;
  kelompok?: string;
  fase?: string | null;
  kkm?: number;
  noUrut?: number | null;
  guruId?: number | null;
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function MapelForm({
  initial,
  guruOptions,
}: {
  initial?: MapelInitial;
  guruOptions: Option[];
}) {
  const [state, formAction, pending] = useActionState<MapelFormState, FormData>(
    saveMapel,
    { ok: false },
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">Nama Mapel *</label>
          <input name="namaMapel" defaultValue={initial?.namaMapel ?? ""} className={inputCls} />
          <Err msg={e.namaMapel} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Kode *</label>
          <input name="kodeMapel" defaultValue={initial?.kodeMapel ?? ""} className={inputCls} />
          <Err msg={e.kodeMapel} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Kelompok *</label>
          <select name="kelompok" defaultValue={initial?.kelompok ?? "A"} className={inputCls}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C (Peminatan)</option>
            <option value="lintasminat">Lintas Minat</option>
            <option value="muatanlokal">Muatan Lokal</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Fase</label>
          <select name="fase" defaultValue={initial?.fase ?? ""} className={inputCls}>
            <option value="">-</option>
            {["A", "B", "C", "D", "E", "F"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">KKM</label>
          <input type="number" name="kkm" defaultValue={initial?.kkm ?? 0} min={0} max={100} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">No. Urut</label>
          <input type="number" name="noUrut" defaultValue={initial?.noUrut ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Guru Pengampu</label>
        <select name="guruId" defaultValue={initial?.guruId ?? ""} className={inputCls}>
          <option value="">- tidak ada -</option>
          {guruOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/mapel" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
      </div>
    </form>
  );
}
