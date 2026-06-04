"use client";

/**
 * AutocompleteSelect — dropdown dengan input filter client-side.
 * Data sudah di-pass sebagai props (tidak fetch API), default tampil semua opsi saat fokus.
 * Gunakan untuk daftar yang sudah di-load server-side (guru, rombel, mapel, dll).
 */
import { useState, useRef, useEffect, useId } from "react";

export type ACOption = { key: string | number; value: string | number; label: string; sub?: string };

export function AutocompleteSelect({
  options,
  name,
  hiddenName,
  placeholder = "Ketik untuk mencari…",
  defaultValue = "",
  defaultLabel = "",
  required = false,
  className = "w-full rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900",
  emptyLabel = "— tidak ada —",
  onChange,
}: {
  options: ACOption[];
  name?: string;
  hiddenName?: string;
  placeholder?: string;
  defaultValue?: string | number;
  defaultLabel?: string;
  required?: boolean;
  className?: string;
  emptyLabel?: string;
  onChange?: (value: string) => void;
}) {
  const fieldName = hiddenName ?? name ?? "id";
  const id = useId();

  // Cari label awal dari defaultValue
  const initialLabel = defaultLabel ||
    (defaultValue ? (options.find((o) => String(o.value) === String(defaultValue))?.label ?? "") : "");

  const [query, setQuery]       = useState(initialLabel);
  const [selected, setSelected] = useState(defaultValue ? String(defaultValue) : "");
  const [open, setOpen]         = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Filter: kalau query kosong tampil semua, kalau ada query filter case-insensitive
  const filtered = query.trim() === "" || (selected && options.find(o => String(o.value) === selected)?.label === query)
    ? options
    : options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.sub?.toLowerCase().includes(query.toLowerCase())
      );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Kalau input tidak cocok dengan pilihan, reset
        if (selected) {
          const match = options.find((o) => String(o.value) === selected);
          if (match) setQuery(match.label);
        } else {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected, options]);

  const handleSelect = (o: ACOption) => {
    setSelected(String(o.value));
    setQuery(o.label);
    setOpen(false);
    onChange?.(String(o.value));
  };

  const handleClear = () => {
    setSelected("");
    setQuery("");
    setOpen(false);
    onChange?.("");
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden input yang akan disubmit */}
      <input type="hidden" name={fieldName} value={selected} />

      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={query}
          autoComplete="off"
          spellCheck={false}
          required={required && !selected}
          placeholder={placeholder}
          className={className}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(""); // reset pilihan saat mengetik ulang
            setOpen(true);
          }}
        />

        {/* Clear button */}
        {(query || selected) && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            ×
          </button>
        )}

        {/* Chevron */}
        {!query && !selected && (
          <svg className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-center text-xs text-gray-400">Tidak ada hasil</li>
          ) : (
            <>
              {/* Opsi kosong */}
              <li
                onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                className="cursor-pointer px-3 py-2 text-xs text-gray-400 hover:bg-gray-50"
              >
                {emptyLabel}
              </li>
              {filtered.map((o) => (
                <li
                  key={o.key}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                    String(o.value) === selected ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {String(o.label).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{o.label}</div>
                    {o.sub && <div className="truncate text-xs text-gray-400">{o.sub}</div>}
                  </div>
                  {String(o.value) === selected && (
                    <span className="ml-auto shrink-0 text-xs text-indigo-600">✓</span>
                  )}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
