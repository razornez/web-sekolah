import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (pengganti middleware di Next.js 16) — auth check di edge.
 * Menggunakan authConfig yang edge-safe (tanpa node:crypto / bcrypt / prisma).
 */
const { auth } = NextAuth(authConfig);

/** Deteksi locale dari Accept-Language (sama dgn src/i18n/locale.ts) */
function detectLocale(req: NextRequest): "id" | "en" {
  const accept = (req.headers.get("accept-language") ?? "").toLowerCase();
  if (accept.startsWith("id") || accept.includes(",id") || accept.includes("id-id")) return "id";
  return accept ? "en" : "id";
}

export default auth((req: NextRequest & { auth: { user?: unknown } | null }) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;

  const isPublic =
    path === "/login" ||
    path === "/lupa-password" ||
    path.startsWith("/daftar/") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/siswa") ||
    path.startsWith("/_next") ||
    path.startsWith("/uploads") ||
    path === "/favicon.ico" ||
    path === "/icon.png";

  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();

  // Locale persistence: set cookie sekali bila belum ada agar locale KONSISTEN
  // di semua request berikutnya (fix BUG-030 — locale tidak berpindah-pindah).
  if (!req.cookies.get("locale")) {
    res.cookies.set("locale", detectLocale(req), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|uploads/).*)",
  ],
};
