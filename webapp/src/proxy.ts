import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (pengganti middleware di Next.js 16) — auth check di edge.
 * Menggunakan authConfig yang edge-safe (tanpa node:crypto / bcrypt / prisma).
 */
const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: unknown } | null }) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;

  const isPublic =
    path === "/" ||
    path === "/login" ||
    path === "/lupa-password" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/daftar-sekolah" ||
    path.startsWith("/daftar/") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/siswa") ||
    path === "/api/health" ||
    path.startsWith("/_next") ||
    path.startsWith("/uploads") ||
    path === "/favicon.ico" ||
    path === "/icon.png";

  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Penting: JANGAN membuat NextResponse baru + set cookie di sini — pola itu
  // dapat men-drop cookie sesi NextAuth (BUG-SESSION-01: logout paksa tiap navigasi).
  // Biarkan auth() meneruskan response apa adanya.
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|uploads/).*)",
  ],
};
