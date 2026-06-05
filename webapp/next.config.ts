import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  // Cegah clickjacking — iframe hanya dari origin sama
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Cegah MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer minimal untuk halaman back-office
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser feature yang tidak dipakai (location/camera/mic tidak dibutuhkan SIS)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
