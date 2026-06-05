import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import SuratForm from "../_components/SuratForm";

export default async function NewSuratPage() {
  await requireModule("surat");
  const t = await getTranslations("surat");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("newTitle")}</h1>
      <SuratForm />
    </div>
  );
}
