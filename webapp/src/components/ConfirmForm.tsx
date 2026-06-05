"use client";

import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

/**
 * Form dengan modal konfirmasi custom sebelum submit.
 * Menggantikan pola window.confirm() di seluruh aplikasi.
 */
export function ConfirmForm({
  action,
  message,
  title,
  confirmLabel,
  cancelLabel,
  variant,
  children,
  className,
}: {
  action: (fd: FormData) => Promise<void>;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [savedFd, setSavedFd] = useState<FormData | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSavedFd(fd);
    setOpen(true);
  }

  async function handleConfirm() {
    if (!savedFd) return;
    setOpen(false);
    setPending(true);
    try { await action(savedFd); } finally { setPending(false); }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={className} style={pending ? { pointerEvents: "none", opacity: 0.6 } : undefined}>
        {children}
      </form>

      <ConfirmModal
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant ?? "default"}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
