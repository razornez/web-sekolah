import { cookies, headers } from "next/headers";

export type Locale = "id" | "en";
export const LOCALES: Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "locale";

/**
 * Tentukan locale aktif:
 * 1. Cookie "locale" jika ada (pilihan eksplisit pengguna)
 * 2. Deteksi dari Accept-Language — Indonesia → "id", lainnya → "en"
 * 3. Default "id"
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;

  const h = await headers();
  const accept = (h.get("accept-language") ?? "").toLowerCase();
  if (accept.startsWith("id") || accept.includes(",id") || accept.includes("id-id")) {
    return "id";
  }
  return accept ? "en" : DEFAULT_LOCALE;
}
