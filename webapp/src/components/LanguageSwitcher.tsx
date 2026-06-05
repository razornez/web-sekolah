"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocale } from "@/i18n/locale-actions";
import type { Locale } from "@/i18n/locale";

const FLAGS: Record<Locale, { flag: string; label: string }> = {
  id: { flag: "🇮🇩", label: "ID" },
  en: { flag: "🇬🇧", label: "EN" },
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 ${pending ? "opacity-50" : ""}`}>
      {(Object.keys(FLAGS) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => switchTo(l)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            locale === l ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
          title={l === "id" ? "Bahasa Indonesia" : "English"}
        >
          <span>{FLAGS[l].flag}</span>
          {!compact && <span>{FLAGS[l].label}</span>}
        </button>
      ))}
    </div>
  );
}
