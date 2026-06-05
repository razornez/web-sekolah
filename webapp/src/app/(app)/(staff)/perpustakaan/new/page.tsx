import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import BukuForm from "../_components/BukuForm";

export default async function NewBukuPage() {
  await requireModule("perpustakaan");
  const t = await getTranslations("perpustakaan");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("addBookTitle")}</h1>
      <BukuForm />
    </div>
  );
}
