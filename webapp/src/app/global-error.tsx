"use client";

import { useEffect } from "react";

/**
 * Global error boundary — menangkap error yang terjadi di root layout
 * (mis. koneksi DB gagal saat render layout). Harus menyertakan <html>/<body>
 * karena menggantikan root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const locale =
    typeof document !== "undefined" && document.cookie.includes("locale=en") ? "en" : "id";

  const T = {
    id: {
      title: "Layanan Sedang Tidak Tersedia",
      desc: "Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.",
      retry: "Muat Ulang",
    },
    en: {
      title: "Service Temporarily Unavailable",
      desc: "The system is under maintenance. Please try again in a moment.",
      retry: "Reload",
    },
  }[locale];

  return (
    <html lang={locale}>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f0f2f5" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 400, width: "100%", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", padding: 32, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 40 }}>🔧</div>
            <h1 style={{ marginTop: 16, fontSize: 20, fontWeight: 700, color: "#111827" }}>{T.title}</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>{T.desc}</p>
            <button
              onClick={reset}
              style={{ marginTop: 24, cursor: "pointer", borderRadius: 8, background: "#111827", color: "#fff", border: "none", padding: "10px 20px", fontSize: 14, fontWeight: 600 }}
            >
              {T.retry}
            </button>
            {error.digest && (
              <p style={{ marginTop: 16, fontSize: 12, color: "#9ca3af" }}>Ref: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
