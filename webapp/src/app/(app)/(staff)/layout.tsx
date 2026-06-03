import { requireStaff } from "@/lib/session";

// Guard back-office: hanya staf. Siswa/ortu otomatis dialihkan ke /portal.
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return <>{children}</>;
}
