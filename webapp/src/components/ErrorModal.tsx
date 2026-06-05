"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Modal error custom — menggantikan alert() saat aksi gagal (mis. delete relasi).
 */
export function ErrorModal({
  open,
  title,
  message,
  onClose,
  closeLabel = "OK",
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => btnRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-red-200 bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl">❌</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            ref={btnRef}
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
