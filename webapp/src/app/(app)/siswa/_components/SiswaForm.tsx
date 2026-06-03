"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveSiswa, type SiswaFormState } from "../actions";

export type SiswaInitial = {
  id?: number;
  namaLengkap?: string;
  nisn?: string | null;
  nis?: string | null;
  nik?: string | null;
  jenisKelamin?: "L" | "P" | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null; // "YYYY-MM-DD"
  agama?: string | null;
  alamat?: string | null;
  noHp?: string | null;
  status?: string;
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

export default function SiswaForm({ initial }: { initial?: SiswaInitial }) {
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(
    saveSiswa,
    { ok: false },
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
        <input name="namaLengkap" defaultValue={initial?.namaLengkap ?? ""} className={inputCls} />
        <Err msg={e.namaLengkap} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-gray-700">NISN</label>
          <input name="nisn" defaultValue={initial?.nisn ?? ""} className={inputCls} />
          <Err msg={e.nisn} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NIS</label>
          <input name="nis" defaultValue={initial?.nis ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NIK</label>
          <input name="nik" defaultValue={initial?.nik ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
          <select name="jenisKelamin" defaultValue={initial?.jenisKelamin ?? ""} className={inputCls}>
            <option value="">-</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
          <input name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
          <input type="date" name="tanggalLahir" defaultValue={initial?.tanggalLahir ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Agama</label>
          <input name="agama" defaultValue={initial?.agama ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">No. HP</label>
          <input name="noHp" defaultValue={initial?.noHp ?? ""} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue={initial?.status ?? "aktif"} className={inputCls}>
            <option value="aktif">Aktif</option>
            <option value="lulus">Lulus</option>
            <option value="pindah">Pindah</option>
            <option value="keluar">Keluar</option>
            <option value="alumni">Alumni</option>
          </select>
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
        <Link href="/siswa" className="text-sm text-gray-500 hover:text-gray-900">
          Batal
        </Link>
      </div>
    </form>
  );
}
