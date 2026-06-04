"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveJadwal, type JadwalFormState } from "../actions";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const JAM_MULAI  = ["07:00","08:30","10:15","11:45","13:30"];
const JAM_SELESAI = ["08:30","10:00","11:45","13:15","15:00"];
const init: JadwalFormState = { ok: false };

type SelectOption = { key: string | number; value: string | number; label: string };

export function TambahJadwalForm({
  guruOptions,
  mapelOptions,
  rombelOptions,
}: {
  guruOptions:  SelectOption[];
  mapelOptions: SelectOption[];
  rombelOptions: SelectOption[];
}) {
  const [state, action, pending] = useActionState<JadwalFormState, FormData>(saveJadwal, init);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form setelah berhasil
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const sel = "rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-900";

  return (
    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
      {/* Error / konflik feedback */}
      {!state.ok && state.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-semibold text-sm text-red-800">⚠ {state.error}</p>

          {state.conflicts && state.conflicts.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {state.conflicts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg bg-red-100/60 px-3 py-2 text-xs text-red-800">
                  <span className="mt-0.5 shrink-0 text-base">
                    {c.type === "guru" ? "👨‍🏫" : "🏫"}
                  </span>
                  <div>
                    <span className="font-semibold">
                      {c.type === "guru" ? "Guru" : "Kelas"} {c.label}
                    </span>
                    {" "}sudah punya jadwal{" "}
                    <span className="font-mono font-medium">
                      {c.existing.jamMulai ?? "?"}–{c.existing.jamSelesai ?? "?"}
                    </span>
                    {c.existing.mapel ? (
                      <> · <span className="font-medium">{c.existing.mapel}</span></>
                    ) : null}
                    {" "}di hari yang sama.
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sukses */}
      {state.ok && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800">
          ✓ Jadwal berhasil disimpan.
        </div>
      )}

      <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
        {/* Guru */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Guru <span className="text-red-500">*</span></label>
          <select name="guruId" required defaultValue="" className={`${sel} min-w-[180px]`}>
            <option value="">— pilih guru —</option>
            {guruOptions.map((g) => <option key={g.key} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        {/* Hari */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Hari <span className="text-red-500">*</span></label>
          <select name="hariNama" required defaultValue="" className={sel}>
            <option value="">— pilih —</option>
            {HARI_ORDER.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Jam Mulai */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Jam Mulai</label>
          <select name="jamMulai" defaultValue="07:00" className={sel}>
            {JAM_MULAI.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        {/* Jam Selesai */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Jam Selesai</label>
          <select name="jamSelesai" defaultValue="08:30" className={sel}>
            {JAM_SELESAI.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        {/* Mapel */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Mapel</label>
          <select name="mapel" defaultValue="" className={`${sel} min-w-[150px]`}>
            <option value="">— pilih mapel —</option>
            {mapelOptions.map((m) => <option key={m.key} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Kelas */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Kelas</label>
          <select name="rombelId" defaultValue="" className={`${sel} min-w-[130px]`}>
            <option value="">— pilih kelas —</option>
            {rombelOptions.map((r) => <option key={r.key} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <button
          disabled={pending}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </div>
  );
}
