import { notFound } from "next/navigation";
import { requireModule } from "@/lib/permissions";
import { getSiswaRapor } from "../../_revamp/raporData";
import { RaporView } from "../../_revamp/RaporView";

export default async function RaporPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const { id } = await params;
  const data = await getSiswaRapor(Number(id), sekolahId);
  if (!data) notFound();
  return <RaporView data={data} />;
}
