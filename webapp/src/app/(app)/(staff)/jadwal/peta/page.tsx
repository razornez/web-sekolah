import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { getPetaData, type T } from "./petaData";
import { PetaSekolah } from "./PetaSekolah";

export async function generateMetadata() {
  const t = await getTranslations("jadwal");
  return { title: t("peta.title") };
}

export default async function PetaSekolahPage() {
  const sekolahId = await requireModule("jadwal");
  const tt = await getTranslations("jadwal");
  const data = await getPetaData(sekolahId, tt as unknown as T);
  return <PetaSekolah data={data} />;
}
