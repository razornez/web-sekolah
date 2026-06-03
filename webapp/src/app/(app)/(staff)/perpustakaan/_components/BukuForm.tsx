"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveBuku, type BukuFormState } from "../actions";

export type BukuInitial = {
  id?: number;
  judul?: string;
  pengarang?: string | null;
  penerbit?: string | null;
  tahunTerbit?: string | null;
  isbn?: string | null;
  jumlahBuku?: number;
  jumlahEksemplar?: number;
};

const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function BukuForm({ initial }: { initial?: BukuInitial }) {
  const [state, formAction, pending] = useActionState<BukuFormState, FormData>(saveBuku, { ok: false });
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      <div>
        <label className="text-sm font-medium text-gray-700">Judul *</label>
        <input name="judul" defaultValue={initial?.judul ?? ""} className={inputCls} />
        <Err msg={e.judul} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Pengarang</label>
          <input name="pengarang" defaultValue={initial?.pengarang ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Penerbit</label>
          <input name="penerbit" defaultValue={initial?.penerbit ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Tahun Terbit</label>
          <input name="tahunTerbit" defaultValue={initial?.tahunTerbit ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">ISBN</label>
          <input name="isbn" defaultValue={initial?.isbn ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Jumlah Judul</label>
          <input type="number" min={0} name="jumlahBuku" defaultValue={initial?.jumlahBuku ?? 0} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Jumlah Eksemplar</label>
          <input type="number" min={0} name="jumlahEksemplar" defaultValue={initial?.jumlahEksemplar ?? 0} className={inputCls} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/perpustakaan" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
      </div>
    </form>
  );
}
