import { requireModule } from "@/lib/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModule("ppdb");
  return <>{children}</>;
}
