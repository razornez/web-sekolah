"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { saveRombel, type RombelFormState } from "../actions";
import type { GuruOption } from "../options";

export type Option = { id: number; label: string; aktif?: boolean };

export type RombelInitial = {
  id?: number;
  nama?: string;
  kodeKelas?: string | null;
  tahunAjaranId?: number;
  tingkatId?: number;
  waliGuruId?: number | null;
};

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

function Err({ msg }: { msg?: string[] }) {
  return msg?.length ? <p className="mt-1 text-xs text-red-600">{msg[0]}</p> : null;
}

// Auto-generate kode dari nama rombel: "X IPA 1" → "X-IPA-1"
function namaToKode(nama: string): string {
  return nama.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9\-]/g, "");
}

function GuruSummaryCard({ guru }: { guru: GuruOption }) {
  const initials = guru.namaGuru.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const waliCount = guru.rombelWali.length;
  const pendidikan = guru.pendidikan[0];
  const mapelList = guru.mapelDiampu.map((m) => m.namaMapel);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-indigo-100 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{guru.namaGuru}</div>
          <div className="flex flex-wrap gap-2 mt-0.5">
            {guru.statusGuru && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${guru.statusGuru.toLowerCase().includes("pns") || guru.statusGuru.toLowerCase().includes("asn") ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {guru.statusGuru}
              </span>
            )}
            {guru.jenisJabatan && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {guru.jenisJabatan}
              </span>
            )}
          </div>
        </div>
        {waliCount > 0 && (
          <div className="shrink-0 text-center rounded-xl bg-indigo-100 px-3 py-1.5">
            <div className="text-lg font-bold leading-none text-indigo-700">{waliCount}</div>
            <div className="text-[10px] text-indigo-500">kali wali</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-indigo-100 border-b border-indigo-100 bg-indigo-50/40">
        <div className="px-3 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{guru._count.jadwalGuru}</div>
          <div className="text-[10px] text-gray-500">Jadwal</div>
        </div>
        <div className="px-3 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{guru.mapelDiampu.length}</div>
          <div className="text-[10px] text-gray-500">Mapel</div>
        </div>
        <div className="px-3 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{waliCount}</div>
          <div className="text-[10px] text-gray-500">Pernah Wali</div>
        </div>
      </div>

      {/* Detail */}
      <div className="space-y-2 px-4 py-3 text-xs">
        {/* Pendidikan */}
        {pendidikan && (
          <div className="flex items-center gap-2">
            <span className="text-indigo-400">🎓</span>
            <span className="text-gray-600">
              {pendidikan.jenjang}{pendidikan.jurusan ? ` — ${pendidikan.jurusan}` : ""}
              {pendidikan.tahunLulus ? ` (${pendidikan.tahunLulus})` : ""}
            </span>
          </div>
        )}
        {/* NIP */}
        {guru.nip && (
          <div className="flex items-center gap-2">
            <span className="text-indigo-400">🪪</span>
            <span className="text-gray-500">NIP: {guru.nip}</span>
          </div>
        )}
        {/* Mapel */}
        {mapelList.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">📚</span>
            <div className="flex flex-wrap gap-1">
              {mapelList.map((m) => (
                <span key={m} className="rounded-md bg-white border border-indigo-200 px-2 py-0.5 text-indigo-700">{m}</span>
              ))}
            </div>
          </div>
        )}
        {/* Riwayat wali */}
        {guru.rombelWali.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">🏫</span>
            <div>
              <span className="text-gray-500 font-medium">Riwayat wali: </span>
              <span className="text-gray-600">
                {guru.rombelWali.map((r) => `${r.nama} (${r.tahunAjaran.tahun})`).join(", ")}
              </span>
            </div>
          </div>
        )}
        {waliCount === 0 && guru._count.jadwalGuru === 0 && (
          <p className="text-amber-600 text-xs">⚠ Belum ada data mengajar tercatat.</p>
        )}
      </div>
    </div>
  );
}

export default function RombelForm({
  initial,
  tahunAjaranOptions,
  tingkatOptions,
  guruList,
}: {
  initial?: RombelInitial;
  tahunAjaranOptions: Option[];
  tingkatOptions: Option[];
  guruList: GuruOption[];
}) {
  const [state, formAction, pending] = useActionState<RombelFormState, FormData>(saveRombel, { ok: false });
  const e = state.errors ?? {};

  // Nama → kode auto-generate
  const [namaVal, setNamaVal] = useState(initial?.nama ?? "");
  const [kodeVal, setKodeVal] = useState(initial?.kodeKelas ?? "");
  const [kodeEdited, setKodeEdited] = useState(!!initial?.kodeKelas);

  // Wali kelas selection
  const [waliId, setWaliId] = useState<string>(String(initial?.waliGuruId ?? ""));
  const selectedGuru = guruList.find((g) => String(g.id) === waliId) ?? null;

  // Default tahun ajaran aktif
  const defaultTA = tahunAjaranOptions.find((t) => t.aktif)?.id ?? tahunAjaranOptions[0]?.id;

  useEffect(() => {
    if (!kodeEdited && namaVal) {
      setKodeVal(namaToKode(namaVal));
    }
  }, [namaVal, kodeEdited]);

  return (
    <form action={formAction} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden max-w-2xl">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.message && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{state.message}</div>
      )}

      <div className="space-y-5 px-6 py-5">
        {/* Nama + Kode */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Rombel <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={namaVal}
              onChange={(e) => setNamaVal(e.target.value)}
              placeholder="X IPA 1"
              className={inputCls}
            />
            <Err msg={e.nama} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Kelas
              <span className="ml-1 text-xs font-normal text-gray-400">(otomatis, bisa diubah)</span>
            </label>
            <input
              name="kodeKelas"
              value={kodeVal}
              onChange={(e) => { setKodeVal(e.target.value); setKodeEdited(true); }}
              onBlur={() => { if (!kodeVal.trim()) { setKodeEdited(false); setKodeVal(namaToKode(namaVal)); } }}
              placeholder="X-IPA-1"
              className={`${inputCls} font-mono`}
            />
            <p className="mt-0.5 text-[11px] text-gray-400">
              Kosongkan untuk reset ke otomatis
            </p>
          </div>
        </div>

        {/* Tahun Ajaran + Tingkat */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <select name="tahunAjaranId" defaultValue={initial?.tahunAjaranId ?? defaultTA ?? ""} className={inputCls}>
              <option value="">— pilih —</option>
              {tahunAjaranOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <Err msg={e.tahunAjaranId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tingkat <span className="text-red-500">*</span>
            </label>
            <select name="tingkatId" defaultValue={initial?.tingkatId ?? ""} className={inputCls}>
              <option value="">— pilih —</option>
              {tingkatOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <Err msg={e.tingkatId} />
          </div>
        </div>

        {/* Wali Kelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
          <select
            name="waliGuruId"
            value={waliId}
            onChange={(e) => setWaliId(e.target.value)}
            className={inputCls}
          >
            <option value="">— tidak ada —</option>
            {guruList.map((g) => (
              <option key={g.id} value={g.id}>{g.namaGuru}</option>
            ))}
          </select>

          {/* Summary card */}
          {selectedGuru && <GuruSummaryCard guru={selectedGuru} />}
          {waliId && !selectedGuru && (
            <p className="mt-2 text-xs text-gray-400">Memuat data guru…</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
        <button type="submit" disabled={pending}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/rombel" className="text-sm text-gray-500 hover:text-gray-900">Batal</Link>
      </div>
    </form>
  );
}
