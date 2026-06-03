"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveRombel, type RombelFormState } from "../actions";

export type Option = { id: number; label: string };

export type RombelInitial = {
  id?: number;
  nama?: string;
  kodeKelas?: string | null;
  tahunAjaranId?: number;
  tingkatId?: number;
  waliGuruId?: number | null;
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function RombelForm({
  initial,
  tahunAjaranOptions,
  tingkatOptions,
  guruOptions,
}: {
  initial?: RombelInitial;
  tahunAjaranOptions: Option[];
  tingkatOptions: Option[];
  guruOptions: Option[];
}) {
  const [state, formAction, pending] = useActionState<RombelFormState, FormData>(
    saveRombel,
    { ok: false },
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Nama Rombel *</label>
          <input name="nama" defaultValue={initial?.nama ?? ""} placeholder="X IPA 1" className={inputCls} />
          <Err msg={e.nama} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Kode Kelas</label>
          <input name="kodeKelas" defaultValue={initial?.kodeKelas ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Tahun Ajaran *</label>
          <select name="tahunAjaranId" defaultValue={initial?.tahunAjaranId ?? ""} className={inputCls}>
            <option value="">- pilih -</option>
            {tahunAjaranOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <Err msg={e.tahunAjaranId} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Tingkat *</label>
          <select name="tingkatId" defaultValue={initial?.tingkatId ?? ""} className={inputCls}>
            <option value="">- pilih -</option>
            {tingkatOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <Err msg={e.tingkatId} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Wali Kelas</label>
        <select name="waliGuruId" defaultValue={initial?.waliGuruId ?? ""} className={inputCls}>
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
        <Link href="/rombel" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
      </div>
    </form>
  );
}
