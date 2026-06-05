import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireModule, canManageGuru } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import GuruForm from "../_components/GuruForm";

export default async function NewGuruPage() {
  await requireModule("guru");
  const me = await getCurrentUser();
  if (!canManageGuru(me.role)) redirect("/guru"); // tambah guru = manager-only
  const t = await getTranslations("guru");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("newTitle")}</h1>
      <GuruForm />
    </div>
  );
}
