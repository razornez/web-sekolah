/**
 * Komponen panduan halaman — collapsible, menjelaskan fungsi halaman
 * kepada pengguna awam. Render di atas konten setiap halaman.
 */
import { getTranslations } from "next-intl/server";

export async function PageGuide({
  icon = "💡",
  title,
  description,
  tips = [],
}: {
  icon?: string;
  title: string;
  description: string;
  tips?: string[];
}) {
  const t = await getTranslations("common");
  return (
    <details className="group mb-1 rounded-xl border border-blue-200 bg-blue-50/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-blue-800 hover:bg-blue-100/60 rounded-xl transition-colors">
        <span className="text-base">{icon}</span>
        <span>{t("components.guide")} — {title}</span>
        <svg className="ml-auto h-4 w-4 shrink-0 text-blue-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="border-t border-blue-200 px-4 py-3">
        <p className="text-sm text-blue-700 leading-relaxed">{description}</p>
        {tips.length > 0 && (
          <ul className="mt-2 space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-600">
                <span className="mt-0.5 shrink-0">▸</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
