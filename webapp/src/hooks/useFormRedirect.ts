"use client";

/**
 * Hook untuk navigasi client-side setelah Server Action berhasil.
 *
 * MASALAH yang dipecahkan:
 * Server Actions yang memanggil redirect() memicu full browser navigation
 * (serasa page reload). Hook ini menggantikan itu dengan router.push()
 * yang merupakan client-side navigation → transisi instan tanpa flash.
 *
 * CARA PAKAI:
 * 1. Di Server Action: hapus redirect(), return { ok: true, to: "/tujuan" }
 * 2. Di form component: tambah useFormRedirect(state)
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useFormRedirect(state: { ok?: boolean; to?: string }) {
  const router = useRouter();
  const prevOk = useRef(false);

  useEffect(() => {
    // Hanya redirect saat ok baru jadi true (bukan re-render biasa)
    if (state.ok && !prevOk.current && state.to) {
      router.push(state.to);
    }
    prevOk.current = !!state.ok;
  }, [state.ok, state.to, router]);
}
