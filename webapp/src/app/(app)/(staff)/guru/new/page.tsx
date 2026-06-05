import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import GuruForm from "../_components/GuruForm";

export default async function NewGuruPage() {
  await requireModule("guru");
  const t = await getTranslations("guru");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("newTitle")}</h1>
      <GuruForm />
    </div>
  );
}
