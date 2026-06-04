"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPendaftar, type PendaftarFormState } from "../actions";

const init: PendaftarFormState = { ok: false };
const inCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  return msg?.length ? <p className="mt-1 text-xs text-red-600">{msg[0]}</p> : null;
}

type Jalur = { id: number; nama: string };

export function PendaftarForm({ jalurList }: { jalurList: Jalur[] }) {
  const [state, action, pending] = useActionState<PendaftarFormState, FormData>(createPendaftar, init);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.message) {
      router.push(`/ppdb/${state.message}`);
    }
  }, [state, router]);

  const e = state.errors ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const thisYear = new Date().getFullYear();
  const defaultTA = `${thisYear}/${thisYear + 1}`;

  return (
    <form action={action} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* Identitas */}
      <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-3.5">
        <h2 className="text-sm font-semibold text-gray-700">👤 Identitas Diri</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input name="namaLengkap" required autoFocus placeholder="Nama lengkap sesuai akta" className={inCls} />
          <Err msg={e.namaLengkap} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <select name="jenisKelamin" defaultValue="" required className={inCls}>
            <option value="" disabled>— pilih —</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <Err msg={e.jenisKelamin} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
          <input name="nisn" placeholder="10 digit NISN" maxLength={20} className={inCls} />
          <Err msg={e.nisn} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
          <input name="tempatLahir" placeholder="Kota / Kabupaten" className={inCls} />
          <Err msg={e.tempatLahir} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
          <input type="date" name="tanggalLahir" max={today} className={inCls} />
          <Err msg={e.tanggalLahir} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. HP / WA</label>
          <input name="noHp" placeholder="08xx-xxxx-xxxx" className={inCls} />
          <Err msg={e.noHp} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <input name="alamat" placeholder="Alamat lengkap (jalan, RT/RW, desa, kecamatan)" className={inCls} />
          <Err msg={e.alamat} />
        </div>
      </div>

      {/* Pendaftaran */}
      <div className="border-b border-t border-gray-100 bg-gray-50/60 px-6 py-3.5">
        <h2 className="text-sm font-semibold text-gray-700">🏫 Data Pendaftaran</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
          <input name="asalSekolah" placeholder="SMP / MTs asal" className={inCls} />
          <Err msg={e.asalSekolah} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
          <input name="tahunAjaran" defaultValue={defaultTA} placeholder="mis: 2025/2026" className={inCls} />
          <Err msg={e.tahunAjaran} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jalur Pendaftaran</label>
          <select name="jalurId" defaultValue="" className={inCls}>
            <option value="">— pilih jalur (opsional) —</option>
            {jalurList.map((j) => (
              <option key={j.id} value={j.id}>{j.nama}</option>
            ))}
          </select>
          <Err msg={e.jalurId} />
        </div>
      </div>

      {/* Error global */}
      {!state.ok && state.message && (
        <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Menyimpan…" : "Simpan Pendaftar"}
        </button>
        <Link href="/ppdb" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
        <p className="ml-auto text-xs text-gray-400">
          Setelah disimpan, Anda akan diarahkan ke halaman detail untuk menambah dokumen dan mengubah status.
        </p>
      </div>
    </form>
  );
}
