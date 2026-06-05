"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Modal konfirmasi custom — menggantikan window.confirm() di seluruh aplikasi.
 *
 * Penggunaan:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmModal
 *     open={open}
 *     title="Hapus Data"
 *     message="Apakah kamu yakin ingin menghapus ini?"
 *     confirmLabel="Ya, Hapus"          // opsional, default "Ya"
 *     cancelLabel="Batal"               // opsional, default "Batal"
 *     variant="danger"                  // "danger" | "warning" | "default"
 *     onConfirm={() => { ... ; setOpen(false); }}
 *     onCancel={() => setOpen(false)}
 *   />
 */

type Variant = "danger" | "warning" | "default";

const VARIANT_CONFIG: Record<Variant, { icon: string; confirmCls: string }> = {
  danger:  { icon: "🗑️", confirmCls: "bg-red-600 hover:bg-red-700 text-white" },
  warning: { icon: "⚠️", confirmCls: "bg-amber-500 hover:bg-amber-600 text-white" },
  default: { icon: "❓", confirmCls: "bg-gray-900 hover:bg-gray-800 text-white" },
};

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cfg = VARIANT_CONFIG[variant];

  // Fokus ke tombol Cancel saat buka (aksesibel)
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50);
  }, [open]);

  // ESC tutup modal
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h3
                  id="confirm-modal-title"
                  className="text-base font-bold text-gray-900"
                >
                  {title}
                </h3>
              )}
              <p className={`text-sm text-gray-600 ${title ? "mt-1" : ""} leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition-colors ${cfg.confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
