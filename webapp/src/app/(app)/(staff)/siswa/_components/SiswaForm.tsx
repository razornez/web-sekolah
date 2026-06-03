"use client";

import { useActionState } from "react";
import Link from "next/link";
import { JKSwitch } from "@/components/JKSwitch";
import { saveSiswa, type SiswaFormState } from "../actions";
import { useFormRedirect } from "@/hooks/useFormRedirect";
import { WilayahSelect } from "@/components/WilayahSelect";

export type SiswaInitial = {
  id?: number;
  namaLengkap?: string;
  nisn?: string | null;
  nis?: string | null;
  nik?: string | null;
  noInduk?: string | null;
  jenisKelamin?: "L" | "P" | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  hobi?: string | null;
  citaCita?: string | null;
  anakKe?: number | null;
  tahunMasuk?: number | null;
  status?: string;
  alamat?: string | null;
  desaKel?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  kodePos?: string | null;
  noHp?: string | null;
  tinggalDengan?: string | null;
  transportasi?: string | null;
  tinggiBadan?: string | null;
  beratBadan?: string | null;
  golonganDarah?: string | null;
  kebutuhanKhusus?: string | null;
  asalSekolah?: string | null;
};

const inCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const AGAMA = ["Islam","Kristen Protestan","Kristen Katolik","Hindu","Buddha","Konghucu","Kepercayaan"];
const STATUS_OPTS = ["aktif","lulus","pindah","keluar","alumni"];
const GOLONGAN = ["A","B","AB","O","A+","A-","B+","B-","AB+","AB-","O+","O-"];
const TRANSPORTASI = ["Jalan kaki","Sepeda","Sepeda motor","Angkutan umum","Mobil pribadi","Antar jemput"];
const TINGGAL = ["Bersama orang tua","Bersama wali","Kos / indekos","Asrama","Panti asuhan"];

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msg[0]}</p>;
}

function Divider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

export default function SiswaForm({ initial, provinsiOptions = [] }: { initial?: SiswaInitial; provinsiOptions?: { kode: string; nama: string }[] }) {
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(saveSiswa, { ok: false });
  useFormRedirect(state); // seamless client-side redirect setelah simpan
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      {/* DATA PRIBADI */}
      <Divider title="Data Pribadi" />

      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
        <input name="namaLengkap" defaultValue={initial?.namaLengkap ?? ""} required className={inCls} />
        <Err msg={e.namaLengkap} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
        <JKSwitch defaultValue={initial?.jenisKelamin} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">NISN</label><input name="nisn" defaultValue={initial?.nisn ?? ""} placeholder="0012345678" className={inCls} /><Err msg={e.nisn} /></div>
        <div><label className="block text-sm font-medium text-gray-700">NIS</label><input name="nis" defaultValue={initial?.nis ?? ""} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">No. Induk</label><input name="noInduk" defaultValue={initial?.noInduk ?? ""} className={inCls} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">NIK</label><input name="nik" defaultValue={initial?.nik ?? ""} maxLength={16} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Tempat Lahir</label><input name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label><input type="date" name="tanggalLahir" defaultValue={initial?.tanggalLahir ?? ""} className={inCls} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Agama</label>
          <select name="agama" defaultValue={initial?.agama ?? ""} className={inCls}>
            <option value="">— pilih —</option>
            {AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Anak ke-</label><input type="number" name="anakKe" min={1} max={20} defaultValue={initial?.anakKe ?? ""} placeholder="1" className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Hobi</label><input name="hobi" defaultValue={initial?.hobi ?? ""} className={inCls} /></div>
      </div>

      {/* DATA AKADEMIK */}
      <Divider title="Data Akademik" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tahun Masuk</label>
          <input type="number" name="tahunMasuk" min={1990} max={2099} defaultValue={initial?.tahunMasuk ?? new Date().getFullYear()} className={inCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue={initial?.status ?? "aktif"} className={inCls}>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Asal Sekolah</label><input name="asalSekolah" defaultValue={initial?.asalSekolah ?? ""} placeholder="SMP…" className={inCls} /></div>
      </div>

      {/* ALAMAT & KONTAK */}
      <Divider title="Alamat & Kontak" />

      <div><label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label><textarea name="alamat" defaultValue={initial?.alamat ?? ""} rows={2} className={inCls} /></div>

      {/* Wilayah cascade — provinsi→kab→kec→kel + kode pos otomatis */}
      <WilayahSelect
        provinsiOptions={provinsiOptions}
        defaultProvinsi={null}
        defaultKabupaten={null}
        defaultKecamatan={null}
        defaultKelurahan={null}
        defaultKodePos={initial?.kodePos}
      />
      {/* Fallback manual untuk kecamatan & kabupaten bila belum pilih dari dropdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="block text-sm font-medium text-gray-700">Kecamatan (manual)</label><input name="kecamatan" defaultValue={initial?.kecamatan ?? ""} placeholder="Dari dropdown di atas, atau isi manual" className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Kabupaten/Kota (manual)</label><input name="kabupaten" defaultValue={initial?.kabupaten ?? ""} className={inCls} /></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">No. HP</label><input name="noHp" defaultValue={initial?.noHp ?? ""} className={inCls} /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tinggal Bersama</label>
          <select name="tinggalDengan" defaultValue={initial?.tinggalDengan ?? ""} className={inCls}>
            <option value="">— pilih —</option>
            {TINGGAL.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Transportasi</label>
          <select name="transportasi" defaultValue={initial?.transportasi ?? ""} className={inCls}>
            <option value="">— pilih —</option>
            {TRANSPORTASI.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* KESEHATAN */}
      <Divider title="Kesehatan & Fisik (opsional)" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div><label className="block text-sm font-medium text-gray-700">Tinggi Badan (cm)</label><input name="tinggiBadan" defaultValue={initial?.tinggiBadan ?? ""} placeholder="160" className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Berat Badan (kg)</label><input name="beratBadan" defaultValue={initial?.beratBadan ?? ""} placeholder="50" className={inCls} /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gol. Darah</label>
          <select name="golonganDarah" defaultValue={initial?.golonganDarah ?? ""} className={inCls}>
            <option value="">—</option>
            {GOLONGAN.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Kebutuhan Khusus</label><input name="kebutuhanKhusus" defaultValue={initial?.kebutuhanKhusus ?? ""} placeholder="Tidak ada" className={inCls} /></div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button type="submit" disabled={pending} className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? "Menyimpan…" : initial?.id ? "Simpan Perubahan" : "Tambah Siswa"}
        </button>
        <Link href="/siswa" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
      </div>
    </form>
  );
}
