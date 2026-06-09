import { requireModule } from "@/lib/permissions";
import { getSiswaPulse, getSiswaGallery } from "./_revamp/listData";
import { SiswaListBoard } from "./_revamp/SiswaListBoard";

const PER = 24;

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; jenjang?: string; gender?: string; flag?: string; view?: string; page?: string }>;
}) {
  const sekolahId = await requireModule("siswa");
  const sp = await searchParams;
  const filters = {
    q: (sp.q ?? "").trim(),
    status: sp.status ?? "",
    jenjang: sp.jenjang ?? "",
    gender: sp.gender ?? "",
    flag: sp.flag ?? "",
    view: sp.view === "table" ? "table" : "gallery",
    page: Math.max(1, Number(sp.page) || 1),
  };

  const [pulse, gallery] = await Promise.all([
    getSiswaPulse(sekolahId),
    getSiswaGallery(sekolahId, {
      q: filters.q, status: filters.status, jenjang: filters.jenjang,
      gender: filters.gender, flag: filters.flag, page: filters.page, per: PER,
    }),
  ]);

  return <SiswaListBoard pulse={pulse} gallery={gallery} filters={filters} />;
}
