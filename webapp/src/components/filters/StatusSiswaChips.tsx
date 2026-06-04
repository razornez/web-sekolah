import Link from "next/link";

const STATUS_OPTS = ["aktif", "lulus", "pindah", "keluar", "alumni"] as const;

export function StatusSiswaChips({
  current,
  buildUrl,
}: {
  current: string;
  buildUrl: (status: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-gray-500">Status:</span>
      {["", ...STATUS_OPTS].map((s) => (
        <Link
          key={s}
          href={buildUrl(s)}
          className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
            current === s
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {s === "" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
        </Link>
      ))}
    </div>
  );
}
