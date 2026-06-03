"use client";

import { useEffect, useRef, useState } from "react";
import { submitUjian } from "../actions";

type Opsi = { label: string; teks: string };
export type SoalItem = {
  id: number;
  nomor: number;
  pertanyaan: string;
  tipe: string;
  opsi: Opsi[];
};

export function UjianRunner({
  ujianId,
  durasiMenit,
  mulaiAtMs,
  soal,
}: {
  ujianId: number;
  durasiMenit: number | null;
  mulaiAtMs: number | null;
  soal: SoalItem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!durasiMenit || !mulaiAtMs) return;
    const endMs = mulaiAtMs + durasiMenit * 60000;
    const tick = () => {
      const rem = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) formRef.current?.requestSubmit();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [durasiMenit, mulaiAtMs]);

  const mmss =
    remaining != null
      ? `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`
      : null;

  return (
    <form ref={formRef} action={submitUjian} className="space-y-4">
      <input type="hidden" name="ujianId" value={ujianId} />
      {mmss && (
        <div className="sticky top-0 z-10 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-sm">
          ⏱ Sisa waktu: <b>{mmss}</b>
        </div>
      )}
      {soal.map((s) => (
        <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="font-medium text-gray-900">{s.nomor}. {s.pertanyaan}</div>
          {s.tipe === "pilihan_ganda" ? (
            <div className="mt-2 space-y-1">
              {s.opsi.map((o) => (
                <label key={o.label} className="flex items-start gap-2 text-sm">
                  <input type="radio" name={`jawaban_${s.id}`} value={o.label} className="mt-1" />
                  <span><b>{o.label}.</b> {o.teks}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea name={`jawaban_${s.id}`} rows={3} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          )}
        </div>
      ))}
      <button
        onClick={(e) => {
          if (!confirm("Kumpulkan jawaban? Tidak bisa diubah lagi.")) e.preventDefault();
        }}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Kumpulkan Jawaban
      </button>
    </form>
  );
}
