"use client";

/**
 * SiswaAutocomplete — reusable komponen cari siswa dengan autocomplete.
 *
 * DUA MODE:
 * 1. mode="filter" (default) — isi text input dengan nama siswa. Cocok untuk
 *    filter/search yang submit via form GET (?q=namaLengkap).
 *
 * 2. mode="select" — saat siswa dipilih, isi visible input (nama) DAN hidden
 *    input (siswaId). Cocok untuk form yang butuh siswaId, mis. catat mutasi.
 *    Gunakan prop `idName` untuk nama hidden field (default: "siswaId").
 */
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type Siswa = { id: number; namaLengkap: string; nisn: string | null };

export function SiswaAutocomplete({
  name = "q",
  defaultValue = "",
  placeholder,
  mode = "filter",
  idName = "siswaId",
  defaultId = "",
  className = "w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  mode?: "filter" | "select";
  idName?: string;
  defaultId?: string | number;
  className?: string;
}) {
  const t = useTranslations("common");
  const [query, setQuery] = useState(defaultValue);
  const [selectedId, setSelectedId] = useState(String(defaultId));
  const [results, setResults] = useState<Siswa[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(timeoutRef.current);
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/siswa/cari?q=${encodeURIComponent(query)}`);
        const data: Siswa[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally { setLoading(false); }
    }, 280);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (s: Siswa) => {
    setQuery(s.namaLengkap);
    if (mode === "select") setSelectedId(String(s.id));
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedId("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden ID field — hanya dipakai di mode "select" */}
      {mode === "select" && (
        <input type="hidden" name={idName} value={selectedId} />
      )}

      <div className={`relative flex items-center ${focused ? "ring-2 ring-gray-900/10 rounded-md" : ""}`}>
        <input
          name={name}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (mode === "select") setSelectedId(""); // reset ID saat mengetik ulang
            if (!e.target.value) setOpen(false);
          }}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          placeholder={placeholder ?? t("components.siswaSearchPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className={className}
        />

        {/* Loading spinner */}
        {loading && (
          <div className="pointer-events-none absolute right-2 flex items-center">
            <svg className="h-3.5 w-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Clear button */}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {/* Selected badge — mode select */}
      {mode === "select" && selectedId && (
        <p className="mt-1 text-xs text-green-700">{t("components.siswaSelected")}</p>
      )}

      {/* Dropdown results */}
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {results.map((s) => (
            <li
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-sm font-bold text-indigo-600">
                {s.namaLengkap.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{s.namaLengkap}</div>
                {s.nisn && <div className="text-xs text-gray-400">NISN: {s.nisn}</div>}
              </div>
              {mode === "select" && (
                <span className="ml-auto text-xs text-indigo-500">{t("components.siswaChoose")}</span>
              )}
            </li>
          ))}
          {results.length === 0 && !loading && (
            <li className="px-3 py-3 text-sm text-gray-400 text-center">{t("components.siswaNotFound")}</li>
          )}
        </ul>
      )}
    </div>
  );
}
