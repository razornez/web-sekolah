"use client";

import { useActionState, useEffect } from "react";
import type { DeleteResult } from "@/lib/deleteError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeleteAction = (formData: FormData) => Promise<any>;

/**
 * Tombol hapus generik dengan:
 * - Konfirmasi window.confirm sebelum submit
 * - Menangkap error dari action (relasi, dll) dan menampilkan alert yang jelas
 */
export function ConfirmDelete({
  action,
  id,
  message,
  label = "Hapus",
}: {
  action: DeleteAction;
  id: number;
  message: string;
  label?: string;
}) {
  // Wrap action agar selalu return DeleteResult shape
  async function wrappedAction(
    _prev: { error?: string },
    formData: FormData,
  ): Promise<{ error?: string }> {
    const result = await action(formData);
    if (result && typeof result === "object" && "ok" in result && !result.ok) {
      return { error: (result as { ok: false; error: string }).error };
    }
    return {};
  }

  const [state, formAction] = useActionState(wrappedAction, {});

  // Tampilkan error sebagai alert setelah action selesai
  useEffect(() => {
    if (state.error) {
      alert(`❌ Tidak bisa dihapus\n\n${state.error}`);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(ev) => {
        if (!confirm(message)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="cursor-pointer text-red-600 hover:underline text-sm"
      >
        {label}
      </button>
    </form>
  );
}
