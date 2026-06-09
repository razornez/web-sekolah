import { notFound } from "next/navigation";
import { requireModule } from "@/lib/permissions";
import { getPengumumanEdit } from "../../_revamp/editData";
import { EditPengumumanForm } from "../../_revamp/EditPengumumanForm";

export default async function EditPengumumanPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("pengumuman");
  const { id } = await params;
  const data = await getPengumumanEdit(Number(id), sekolahId);
  if (!data) notFound();
  return <EditPengumumanForm data={data} />;
}
