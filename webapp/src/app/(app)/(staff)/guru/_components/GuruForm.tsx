"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveGuru, type GuruFormState } from "../actions";

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
  const [state, formAction, pending] = useActionState<GuruFormState, FormData>(
    saveGuru,
    { ok: false },
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">Nama Guru *</label>
        <input name="namaGuru" defaultValue={initial?.namaGuru ?? ""} className={inputCls} />
        <Err msg={e.namaGuru} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Jenis Kelamin *</label>
          <select name="jenisKelamin" defaultValue={initial?.jenisKelamin ?? ""} className={inputCls}>
            <option value="">- pilih -</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <Err msg={e.jenisKelamin} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <input name="statusGuru" defaultValue={initial?.statusGuru ?? ""} placeholder="PNS / GTT / ..." className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">NIP</label>
          <input name="nip" defaultValue={initial?.nip ?? ""} className={inputCls} />
          <Err msg={e.nip} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NUPTK</label>
          <input name="nuptk" defaultValue={initial?.nuptk ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NPK</label>
          <input name="npk" defaultValue={initial?.npk ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NIK</label>
          <input name="nik" defaultValue={initial?.nik ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
          <input name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
          <input type="date" name="tanggalLahir" defaultValue={initial?.tanggalLahir ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input name="email" defaultValue={initial?.email ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">No. Telp</label>
          <input name="noTelp" defaultValue={initial?.noTelp ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Pangkat</label>
          <input name="pangkat" defaultValue={initial?.pangkat ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Golongan</label>
          <input name="golongan" defaultValue={initial?.golongan ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Alamat</label>
        <textarea name="alamat" defaultValue={initial?.alamat ?? ""} rows={2} className={inputCls} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/guru" className="text-sm text-gray-500 hover:text-gray-900">
          Batal
        </Link>
      </div>
    </form>
  );
}
