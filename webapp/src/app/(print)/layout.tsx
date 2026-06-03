import { getCurrentUser } from "@/lib/session";

// Layout cetak: tanpa sidebar, latar putih, ramah cetak (A4).
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentUser(); // wajib login
  return <div className="min-h-screen bg-white text-gray-900">{children}</div>;
}
