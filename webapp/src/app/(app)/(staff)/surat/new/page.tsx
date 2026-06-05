import { getTranslations } from "next-intl/server";
import SuratForm from "../_components/SuratForm";

export default async function NewSuratPage() {
  const t = await getTranslations("surat");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("newTitle")}</h1>
      <SuratForm />
    </div>
  );
}
