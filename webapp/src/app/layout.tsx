import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "@/i18n/locale";
import "./globals.css";
import "./akadewa.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Akadewa brand font — dipakai shell global + Beranda/Jadwal.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = process.env.AUTH_URL ?? "https://akadewa.com";

export const metadata: Metadata = {
  title: {
    default: "Smart School — Sistem Informasi Sekolah",
    template: "%s — Smart School",
  },
  description: "Platform manajemen sekolah all-in-one: siswa, nilai, presensi, keuangan, PPDB, rapor digital. Multi-sekolah, dwibahasa, responsif.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    siteName: "Smart School",
    title: "Smart School — Sistem Informasi Sekolah Modern",
    description: "Platform manajemen sekolah all-in-one: siswa, nilai, presensi, keuangan, PPDB, rapor digital.",
    url: BASE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Smart School" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart School — Sistem Informasi Sekolah Modern",
    description: "Platform manajemen sekolah all-in-one untuk sekolah modern.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
