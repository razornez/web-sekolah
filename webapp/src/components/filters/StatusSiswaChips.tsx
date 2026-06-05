import Link from "next/link";
import { getTranslations } from "next-intl/server";

const STATUS_OPTS = ["aktif", "lulus", "pindah", "keluar", "alumni"] as const;

export async function StatusSiswaChips({
  current,
  buildUrl,
}: {
  current: string;
  buildUrl: (status: string) => string;
}) {
  const t = await getTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-gray-500">{t("components.statusLabel")}</span>
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
          {s === "" ? t("all") : s.charAt(0).toUpperCase() + s.slice(1)}
        </Link>
      ))}
    </div>
  );
}
