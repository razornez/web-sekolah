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
    path === "/login" ||
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

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|uploads/).*)",
  ],
};
