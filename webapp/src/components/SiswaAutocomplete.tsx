"use client";

import { useState, useEffect, useRef } from "react";

type Siswa = { id: number; namaLengkap: string; nisn: string | null };

export function SiswaAutocomplete({
  name = "q",
  defaultValue = "",
  placeholder = "Ketik nama siswa…",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Siswa[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    }, 300);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          name={name}
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setOpen(false); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900"
        />
        {loading && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <svg className="h-3.5 w-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((s) => (
            <li
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); setQuery(s.namaLengkap); setOpen(false); }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {s.namaLengkap.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{s.namaLengkap}</div>
                {s.nisn && <div className="text-xs text-gray-400">NISN: {s.nisn}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
