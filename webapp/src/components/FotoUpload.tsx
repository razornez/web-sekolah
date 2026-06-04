"use client";

import { useActionState, useState, useRef } from "react";
import { uploadFotoGuru, uploadFotoSiswa, type FotoState } from "@/app/(app)/foto/actions";

export function FotoUpload({
  kind,
  ownerId,
  current,
}: {
  kind: "guru" | "siswa";
  ownerId: number;
  current: string | null;
}) {
  const action = kind === "guru" ? uploadFotoGuru : uploadFotoSiswa;
  const [state, formAction, pending] = useActionState<FotoState, FormData>(action, { ok: false });
  // Preview: pakai URL dari action saat berhasil, fallback ke prop current, fallback ke local preview
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displaySrc = state.url ?? localPreview ?? current;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLocalPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-2xl space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Foto Profil</h2>
      <div className="flex items-start gap-5">
        {/* Preview */}
        <div className="shrink-0">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt="Foto profil"
              className="h-32 w-32 rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
              <svg className="mb-1 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Belum ada foto</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form action={formAction} className="flex-1 space-y-3">
          <input type="hidden" name="ownerId" value={ownerId} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Pilih foto baru</label>
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp"
              required
              onChange={handleFileChange}
              className="block w-full rounded-md border border-gray-300 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="mt-1 text-xs text-gray-400">JPG / PNG / WebP · maks 2 MB</p>
          </div>

          {state.message && (
            <p className={`rounded-md px-3 py-2 text-xs ${state.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {state.ok ? "✓ " : "⚠ "}{state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengunggah…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Unggah Foto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
