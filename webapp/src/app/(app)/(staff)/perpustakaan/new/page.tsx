import { getTranslations } from "next-intl/server";
import BukuForm from "../_components/BukuForm";

export default async function NewBukuPage() {
  const t = await getTranslations("perpustakaan");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("addBookTitle")}</h1>
      <BukuForm />
    </div>
  );
}
