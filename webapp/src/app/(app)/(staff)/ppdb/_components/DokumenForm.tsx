"use client";

import { useRef, useState, useTransition } from "react";
import { addDokumen } from "../actions";

const JENIS_DOKUMEN = [
  { key: "ijazah",           label: "Ijazah" },
  { key: "rapor",            label: "Rapor" },
  { key: "prestasi",         label: "Sertifikat Prestasi" },
  { key: "kwitansi",         label: "Kwitansi Pembayaran" },
  { key: "ktp_ortu",         label: "KTP Orang Tua" },
  { key: "kartu_keluarga",   label: "Kartu Keluarga" },
  { key: "foto",             label: "Foto" },
  { key: "surat_keterangan", label: "Surat Keterangan" },
  { key: "lainnya",          label: "Lainnya" },
];

const MAX_MB = 10;
const ALLOWED = ["application/pdf","image/jpeg","image/png","image/webp","image/gif",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function DokumenForm({ pendaftaranId }: { pendaftaranId: number }) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; ok: boolean } | null>(null);
  const [namaOverride, setNamaOverride] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) { setFileInfo(null); return; }
    const ok = f.size <= MAX_MB * 1024 * 1024 && ALLOWED.includes(f.type);
    setFileInfo({ name: f.name, size: f.size, ok });
    if (!namaOverride && ok) setNamaOverride(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (fileInfo && !fileInfo.ok) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addDokumen(fd);
      formRef.current?.reset();
      setFileInfo(null);
      setNamaOverride("");
    });
  };

  const fmtSize = (b: number) =>
    b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border-b border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
      <input type="hidden" name="pendaftaranId" value={pendaftaranId} />

      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-200 p-0.5 w-fit">
        {(["file", "url"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {m === "file" ? "⬆ Upload File" : "🔗 Tempel URL"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* Jenis */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Jenis</label>
          <select name="jenis" className="rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900">
            {JENIS_DOKUMEN.map((j) => <option key={j.key} value={j.key}>{j.label}</option>)}
          </select>
        </div>

        {/* File / URL input */}
        {mode === "file" ? (
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-medium text-gray-500 mb-1">File (maks {MAX_MB} MB)</label>
            <input
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white file:cursor-pointer hover:file:bg-gray-800 cursor-pointer"
            />
            {fileInfo && (
              <p className={`mt-1 flex items-center gap-1.5 text-xs ${fileInfo.ok ? "text-green-700" : "text-red-600"}`}>
                {fileInfo.ok ? "✓" : "✗"} {fileInfo.name} ({fmtSize(fileInfo.size)})
                {!fileInfo.ok && " — tipe/ukuran tidak didukung"}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-medium text-gray-500 mb-1">URL Dokumen</label>
            <input name="url" type="url" placeholder="https://drive.google.com/…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          </div>
        )}

        {/* Nama */}
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Nama Dokumen *</label>
          <input
            name="nama"
            required
            value={namaOverride}
            onChange={(e) => setNamaOverride(e.target.value)}
            placeholder={mode === "file" ? "Otomatis dari nama file…" : "mis: Ijazah SMP Negeri 1"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>

        {/* Keterangan */}
        <div className="min-w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Keterangan</label>
          <input name="keterangan" placeholder="Opsional"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
        </div>

        <button
          disabled={isPending || (mode === "file" && !!fileInfo && !fileInfo.ok)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Menyimpan…" : "+ Tambah"}
        </button>
      </div>

      <p className="text-xs text-gray-400">Format: PDF, JPG, PNG, WEBP, GIF, DOC, DOCX · Maks {MAX_MB} MB per file</p>
    </form>
  );
}
