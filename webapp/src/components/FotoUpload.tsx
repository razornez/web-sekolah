"use client";

import { useActionState } from "react";
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

  return (
    <div className="max-w-2xl space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-medium text-gray-700">Foto</h2>
      <div className="flex items-center gap-4">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="Foto" className="h-28 w-28 rounded-md border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-400">
            Belum ada foto
          </div>
        )}
        <form action={formAction} className="space-y-2 text-sm">
          <input type="hidden" name="ownerId" value={ownerId} />
          <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="block text-sm" />
          {state.message && (
            <p className={`text-xs ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "Mengunggah…" : "Unggah Foto"}
          </button>
          <p className="text-xs text-gray-400">JPG/PNG/WebP, maks 2 MB.</p>
        </form>
      </div>
    </div>
  );
}
