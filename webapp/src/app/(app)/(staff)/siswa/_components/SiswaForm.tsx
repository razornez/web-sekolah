"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
// value (disimpan ke DB) → translation key (label tampil)
const AGAMA: { value: string; key: string }[] = [
  { value: "Islam", key: "agamaIslam" },
  { value: "Kristen Protestan", key: "agamaKristenProtestan" },
  { value: "Kristen Katolik", key: "agamaKristenKatolik" },
  { value: "Hindu", key: "agamaHindu" },
  { value: "Buddha", key: "agamaBuddha" },
  { value: "Konghucu", key: "agamaKonghucu" },
  { value: "Kepercayaan", key: "agamaKepercayaan" },
];
const STATUS_OPTS: { value: string; key: string }[] = [
  { value: "aktif", key: "statusAktif" },
  { value: "lulus", key: "statusLulus" },
  { value: "pindah", key: "statusPindah" },
  { value: "keluar", key: "statusKeluar" },
  { value: "alumni", key: "statusAlumni" },
];
const GOLONGAN = ["A","B","AB","O","A+","A-","B+","B-","AB+","AB-","O+","O-"];
const TRANSPORTASI: { value: string; key: string }[] = [
  { value: "Jalan kaki", key: "transJalanKaki" },
  { value: "Sepeda", key: "transSepeda" },
  { value: "Sepeda motor", key: "transSepedaMotor" },
  { value: "Angkutan umum", key: "transAngkutanUmum" },
  { value: "Mobil pribadi", key: "transMobilPribadi" },
  { value: "Antar jemput", key: "transAntarJemput" },
];
const TINGGAL: { value: string; key: string }[] = [
  { value: "Bersama orang tua", key: "tinggalOrangTua" },
  { value: "Bersama wali", key: "tinggalWali" },
  { value: "Kos / indekos", key: "tinggalKos" },
  { value: "Asrama", key: "tinggalAsrama" },
  { value: "Panti asuhan", key: "tinggalPanti" },
];

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
  const t = useTranslations("siswa");
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(saveSiswa, { ok: false });
  useFormRedirect(state); // seamless client-side redirect setelah simpan
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      {/* DATA PRIBADI */}
      <Divider title={t("formDividerDataPribadi")} />

      <div>
        <label className="block text-sm font-medium text-gray-700">{t("formNamaLengkap")} <span className="text-red-500">*</span></label>
        <input name="namaLengkap" defaultValue={initial?.namaLengkap ?? ""} required className={inCls} />
        <Err msg={e.namaLengkap} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t("formJenisKelamin")}</label>
        <JKSwitch defaultValue={initial?.jenisKelamin} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">{t("formNisn")}</label><input name="nisn" defaultValue={initial?.nisn ?? ""} placeholder="0012345678" className={inCls} /><Err msg={e.nisn} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formNis")}</label><input name="nis" defaultValue={initial?.nis ?? ""} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formNoInduk")}</label><input name="noInduk" defaultValue={initial?.noInduk ?? ""} className={inCls} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">{t("formNik")}</label><input name="nik" defaultValue={initial?.nik ?? ""} maxLength={16} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formTempatLahir")}</label><input name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formTanggalLahir")}</label><input type="date" name="tanggalLahir" defaultValue={initial?.tanggalLahir ?? ""} className={inCls} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formAgama")}</label>
          <select name="agama" defaultValue={initial?.agama ?? ""} className={inCls}>
            <option value="">{t("formPilih")}</option>
            {AGAMA.map((a) => <option key={a.value} value={a.value}>{t(a.key)}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formAnakKe")}</label><input type="number" name="anakKe" min={1} max={20} defaultValue={initial?.anakKe ?? ""} placeholder="1" className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formHobi")}</label><input name="hobi" defaultValue={initial?.hobi ?? ""} className={inCls} /></div>
      </div>

      {/* DATA AKADEMIK */}
      <Divider title={t("formDividerDataAkademik")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formTahunMasuk")}</label>
          <input type="number" name="tahunMasuk" min={1990} max={2099} defaultValue={initial?.tahunMasuk ?? new Date().getFullYear()} className={inCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formStatus")}</label>
          <select name="status" defaultValue={initial?.status ?? "aktif"} className={inCls}>
            {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formAsalSekolah")}</label><input name="asalSekolah" defaultValue={initial?.asalSekolah ?? ""} placeholder={t("formAsalSekolahPlaceholder")} className={inCls} /></div>
      </div>

      {/* ALAMAT & KONTAK */}
      <Divider title={t("formDividerAlamatKontak")} />

      <div><label className="block text-sm font-medium text-gray-700">{t("formAlamatLengkap")}</label><textarea name="alamat" defaultValue={initial?.alamat ?? ""} rows={2} className={inCls} /></div>

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
        <div><label className="block text-sm font-medium text-gray-700">{t("formKecamatanManual")}</label><input name="kecamatan" defaultValue={initial?.kecamatan ?? ""} placeholder={t("formKecamatanPlaceholder")} className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formKabupatenManual")}</label><input name="kabupaten" defaultValue={initial?.kabupaten ?? ""} className={inCls} /></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="block text-sm font-medium text-gray-700">{t("formNoHp")}</label><input name="noHp" defaultValue={initial?.noHp ?? ""} className={inCls} /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formTinggalBersama")}</label>
          <select name="tinggalDengan" defaultValue={initial?.tinggalDengan ?? ""} className={inCls}>
            <option value="">{t("formPilih")}</option>
            {TINGGAL.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.key)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formTransportasi")}</label>
          <select name="transportasi" defaultValue={initial?.transportasi ?? ""} className={inCls}>
            <option value="">{t("formPilih")}</option>
            {TRANSPORTASI.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.key)}</option>)}
          </select>
        </div>
      </div>

      {/* KESEHATAN */}
      <Divider title={t("formDividerKesehatan")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div><label className="block text-sm font-medium text-gray-700">{t("formTinggiBadan")}</label><input name="tinggiBadan" defaultValue={initial?.tinggiBadan ?? ""} placeholder="160" className={inCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formBeratBadan")}</label><input name="beratBadan" defaultValue={initial?.beratBadan ?? ""} placeholder="50" className={inCls} /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("formGolDarah")}</label>
          <select name="golonganDarah" defaultValue={initial?.golonganDarah ?? ""} className={inCls}>
            <option value="">—</option>
            {GOLONGAN.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">{t("formKebutuhanKhusus")}</label><input name="kebutuhanKhusus" defaultValue={initial?.kebutuhanKhusus ?? ""} placeholder={t("formKebutuhanKhususPlaceholder")} className={inCls} /></div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button type="submit" disabled={pending} className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? t("formSaving") : initial?.id ? t("formSimpanPerubahan") : t("formTambahSiswa")}
        </button>
        <Link href="/siswa" className="text-sm text-gray-500 hover:text-gray-900">{t("formBatal")}</Link>
      </div>
    </form>
  );
}
