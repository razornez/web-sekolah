"use client";

import { useState, useEffect, useCallback } from "react";

type Opt = { kode: string; nama: string; kodePos?: string | null };

// Pindahkan ke modul-level agar tidak di-recreate setiap render (lint: static-components)
function LoadingOption() { return <option disabled>Memuat…</option>; }
type State = { items: Opt[]; loading: boolean };

const inCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400";

export function WilayahSelect({
  defaultProvinsi,
  defaultKabupaten,
  defaultKecamatan,
  defaultKelurahan,
  defaultKodePos,
  provinsiOptions,
}: {
  defaultProvinsi?: string | null;
  defaultKabupaten?: string | null;
  defaultKecamatan?: string | null;
  defaultKelurahan?: string | null;
  defaultKodePos?: string | null;
  provinsiOptions: Opt[];
}) {
  const [provinsi, setProvinsi] = useState(defaultProvinsi ?? "");
  const [kabupaten, setKabupaten] = useState(defaultKabupaten ?? "");
  const [kecamatan, setKecamatan] = useState(defaultKecamatan ?? "");
  const [kelurahan, setKelurahan] = useState(defaultKelurahan ?? "");
  const [kodePos, setKodePos] = useState(defaultKodePos ?? "");
  const [desaKelNama, setDesaKelNama] = useState(""); // nama desa, di-update saat items load

  const [kabState, setKabState] = useState<State>({ items: [], loading: false });
  const [kecState, setKecState] = useState<State>({ items: [], loading: false });
  const [kelState, setKelState] = useState<State>({ items: [], loading: false });

  const fetchOpts = useCallback(async (url: string, setState: (s: State) => void) => {
    setState({ items: [], loading: true });
    try {
      const res = await fetch(url);
      const data: Opt[] = await res.json();
      setState({ items: data, loading: false });
    } catch {
      setState({ items: [], loading: false });
    }
  }, []);

  // Load kabupaten when provinsi changes
  useEffect(() => {
    if (!provinsi) { setKabState({ items: [], loading: false }); setKabupaten(""); setKecamatan(""); setKelurahan(""); setKodePos(""); return; }
    fetchOpts(`/api/wilayah/kabupaten?provinsiId=${provinsi}`, setKabState);
  }, [provinsi, fetchOpts]);

  // Load kecamatan when kabupaten changes
  useEffect(() => {
    if (!kabupaten) { setKecState({ items: [], loading: false }); setKecamatan(""); setKelurahan(""); setKodePos(""); return; }
    fetchOpts(`/api/wilayah/kecamatan?kabupatenId=${kabupaten}`, setKecState);
  }, [kabupaten, fetchOpts]);

  // Load kelurahan when kecamatan changes
  useEffect(() => {
    if (!kecamatan) { setKelState({ items: [], loading: false }); setKelurahan(""); setKodePos(""); return; }
    fetchOpts(`/api/wilayah/kelurahan?kecamatanId=${kecamatan}`, setKelState);
  }, [kecamatan, fetchOpts]);

  // Load defaults on mount if values exist
  useEffect(() => {
    if (defaultProvinsi) fetchOpts(`/api/wilayah/kabupaten?provinsiId=${defaultProvinsi}`, setKabState);
  }, []);
  useEffect(() => {
    if (defaultKabupaten) fetchOpts(`/api/wilayah/kecamatan?kabupatenId=${defaultKabupaten}`, setKecState);
  }, []);
  useEffect(() => {
    if (defaultKecamatan) fetchOpts(`/api/wilayah/kelurahan?kecamatanId=${defaultKecamatan}`, setKelState);
  }, []);

  // Sinkronkan nama desa/kelurahan saat items berhasil dimuat (termasuk saat edit with default)
  useEffect(() => {
    if (kelurahan && kelState.items.length > 0) {
      const found = kelState.items.find((k) => k.kode === kelurahan);
      if (found) {
        setDesaKelNama(found.nama);
        if (found.kodePos && !kodePos) setKodePos(found.kodePos);
      }
    }
  }, [kelurahan, kelState.items]);

  const handleKelurahan = (kodeKel: string) => {
    setKelurahan(kodeKel);
    const kel = kelState.items.find((k) => k.kode === kodeKel);
    if (kel) {
      setDesaKelNama(kel.nama);
      if (kel.kodePos) setKodePos(kel.kodePos);
    } else {
      setDesaKelNama("");
    }
  };

  // LoadingOption dideclare di luar komponen (atas file)

  return (
    <div className="space-y-3">
      {/* Hidden inputs untuk FormData */}
      <input type="hidden" name="provinsi" value={provinsi} />
      <input type="hidden" name="kabupatenKode" value={kabupaten} />
      <input type="hidden" name="kecamatanKode" value={kecamatan} />
      <input type="hidden" name="kelurahanKode" value={kelurahan} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Provinsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Provinsi</label>
          <select value={provinsi} onChange={(e) => { setProvinsi(e.target.value); setKabupaten(""); setKecamatan(""); setKelurahan(""); }} className={inCls}>
            <option value="">— pilih provinsi —</option>
            {provinsiOptions.map((p) => <option key={p.kode} value={p.kode}>{p.nama}</option>)}
          </select>
        </div>

        {/* Kabupaten/Kota */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Kabupaten/Kota</label>
          <select value={kabupaten} onChange={(e) => { setKabupaten(e.target.value); setKecamatan(""); setKelurahan(""); }} disabled={!provinsi || kabState.loading} className={inCls}>
            <option value="">— pilih kabupaten —</option>
            {kabState.loading && <LoadingOption />}
            {kabState.items.map((k) => <option key={k.kode} value={k.kode}>{k.nama}</option>)}
          </select>
        </div>

        {/* Kecamatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Kecamatan</label>
          <select value={kecamatan} onChange={(e) => { setKecamatan(e.target.value); setKelurahan(""); setKodePos(""); }} disabled={!kabupaten || kecState.loading} className={inCls}>
            <option value="">— pilih kecamatan —</option>
            {kecState.loading && <LoadingOption />}
            {kecState.items.map((k) => <option key={k.kode} value={k.kode}>{k.nama}</option>)}
          </select>
        </div>

        {/* Desa/Kelurahan */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Desa / Kelurahan</label>
          <select value={kelurahan} onChange={(e) => handleKelurahan(e.target.value)} disabled={!kecamatan || kelState.loading} className={inCls}>
            <option value="">— pilih desa/kelurahan —</option>
            {kelState.loading && <LoadingOption />}
            {kelState.items.map((k) => <option key={k.kode} value={k.kode}>{k.nama}</option>)}
          </select>
        </div>
      </div>

      {/* Kode Pos — auto-fill atau manual */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kode Pos
            {kodePos && kodePos !== defaultKodePos && <span className="ml-1 text-xs text-green-600">✓ terisi otomatis</span>}
          </label>
          <input
            name="kodePos"
            value={kodePos}
            onChange={(e) => setKodePos(e.target.value)}
            maxLength={6}
            placeholder="Pilih kelurahan atau isi manual"
            className={inCls}
          />
        </div>

        {/* Nama desa/kelurahan — fully controlled, sinkron via state */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Desa / Kelurahan</label>
          <input
            name="desaKel"
            value={desaKelNama}
            onChange={(e) => setDesaKelNama(e.target.value)}
            placeholder="Dipilih dari dropdown, atau isi manual"
            className={inCls}
          />
        </div>
      </div>
    </div>
  );
}
