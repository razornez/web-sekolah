import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware Auth.js v5 — lebih stabil dari per-layout requireStaff() saat hot-reload.
 * Cek session di edge sebelum request sampai ke page/layout.
 */
export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;

  // Path yang tidak memerlukan auth
  const isPublic =
    path === "/login" ||
    path.startsWith("/daftar/") ||      // form pendaftaran publik
    path.startsWith("/api/auth") ||     // auth endpoints
    path.startsWith("/api/siswa") ||    // autocomplete API
    path.startsWith("/_next") ||
    path.startsWith("/uploads") ||
    path === "/favicon.ico" ||
    path === "/icon.png";

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Jalankan middleware di semua path kecuali static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|uploads/).*)",
  ],
};
