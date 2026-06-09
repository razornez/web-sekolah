import { redirect } from "next/navigation";
import { requireModule, canManageGuru } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { GuruFormWizard } from "../_revamp/GuruFormWizard";

export default async function NewGuruPage() {
  await requireModule("guru");
  const me = await getCurrentUser();
  if (!canManageGuru(me.role)) redirect("/guru"); // tambah guru = manager-only
  return <GuruFormWizard />;
}
