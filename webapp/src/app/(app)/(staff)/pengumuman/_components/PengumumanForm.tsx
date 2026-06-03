"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  createPengumuman,
  updatePengumuman,
  type PengumumanFormState,
} from "../actions";

const KATEGORIS = ["umum", "akademik", "keuangan", "kegiatan", "penting"] as const;
const TARGETS = ["semua", "staf", "siswa", "ortu"] as const;

const inCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export type PengumumanInitial = {
  id?: number;
  judul?: string;
  isi?: string;
  kategori?: string;
  target?: string;
  pinned?: boolean;
};

export default function PengumumanForm({ initial }: { initial?: PengumumanInitial }) {
  const isEdit = !!initial?.id;
  const action = isEdit ? updatePengumuman : createPengumuman;

  const [state, formAction, pending] = useActionState<PengumumanFormState, FormData>(
    action,
    { ok: false },
  );

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Judul *</label>
        <input name="judul" defaultValue={initial?.judul ?? ""} required className={inCls} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <select name="kategori" defaultValue={initial?.kategori ?? "umum"} className={inCls}>
            {KATEGORIS.map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Target Penerima</label>
          <select name="target" defaultValue={initial?.target ?? "semua"} className={inCls}>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" name="pinned" defaultChecked={initial?.pinned ?? false} className="h-4 w-4 rounded" />
            <span>📌 Pin di atas</span>
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Isi Pengumuman *</label>
        <TiptapEditor
          name="isi"
          defaultValue={initial?.isi ?? ""}
          placeholder="Tulis isi pengumuman di sini. Gunakan toolbar untuk memformat teks…"
          minHeight="250px"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Terbitkan"}
        </button>
        <Link href="/pengumuman" className="text-sm text-gray-500 hover:text-gray-900">
          Batal
        </Link>
      </div>
    </form>
  );
}
