import { requireModule } from "@/lib/permissions";
import { getPengumumanData } from "./_revamp/data";
import { PengumumanBoard } from "./_revamp/PengumumanBoard";

export default async function PengumumanPage() {
  const sekolahId = await requireModule("pengumuman");
  const data = await getPengumumanData(sekolahId);
  return <PengumumanBoard data={data} />;
}
