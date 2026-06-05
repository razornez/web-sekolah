"use client";

import { useEffect } from "react";

/**
 * Error boundary untuk seluruh halaman aplikasi.
 * Menampilkan pesan ramah (dwibahasa) — TIDAK pernah menampilkan stack trace
 * mentah ke pengguna. Detail teknis hanya di console (dev) / log server (prod).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke console (di produksi bisa diganti ke layanan monitoring spt Sentry)
    console.error("App error:", error);
  }, [error]);

  // Deteksi locale dari cookie (client-side) agar pesan sesuai bahasa
  const locale =
    typeof document !== "undefined" && document.cookie.includes("locale=en") ? "en" : "id";

  // Deteksi error koneksi database → pesan khusus "maintenance"
  const isDbError =
    /can't reach database|database server|ECONNREFUSED|PrismaClientInitialization/i.test(
      error.message,
    );

  const T = {
    id: {
      title: isDbError ? "Layanan Sedang Tidak Tersedia" : "Terjadi Kesalahan",
      desc: isDbError
        ? "Sistem sedang dalam pemeliharaan atau koneksi ke server data terganggu. Silakan coba beberapa saat lagi."
        : "Maaf, terjadi kesalahan saat memuat halaman ini. Tim kami sudah dicatat secara otomatis.",
      retry: "Coba Lagi",
      home: "Kembali ke Dashboard",
      ref: "Kode referensi",
    },
    en: {
      title: isDbError ? "Service Temporarily Unavailable" : "Something Went Wrong",
      desc: isDbError
        ? "The system is under maintenance or the connection to the data server was interrupted. Please try again in a moment."
        : "Sorry, an error occurred while loading this page. Our team has been notified automatically.",
      retry: "Try Again",
      home: "Back to Dashboard",
      ref: "Reference code",
    },
  }[locale];

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl">
          {isDbError ? "🔧" : "⚠️"}
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">{T.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{T.desc}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {T.retry}
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {T.home}
          </a>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">
            {T.ref}: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
