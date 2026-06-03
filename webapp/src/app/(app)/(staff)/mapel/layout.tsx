import { requireModule } from "@/lib/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModule("mapel");
  return <>{children}</>;
}
