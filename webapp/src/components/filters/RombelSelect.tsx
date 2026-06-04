import { prisma } from "@/lib/prisma";

type Props = {
  sekolahId: number;
  name?: string;
  defaultValue?: number | string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

/** Server component: nested select rombel grouped by Tingkat · TA */
export async function RombelSelect({
  sekolahId,
  name = "rombelId",
  defaultValue = "",
  includeEmpty = true,
  emptyLabel = "— Semua Kelas —",
  className = "rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[200px]",
}: Props) {
  const rows = await prisma.rombel.findMany({
    where: { sekolahId },
    orderBy: [{ tahunAjaran: { tahun: "desc" } }, { tingkat: { urutan: "asc" } }, { nama: "asc" }],
    include: { tahunAjaran: { select: { tahun: true, aktif: true } }, tingkat: { select: { nama: true } } },
    take: 100,
  });

  // Group by "Tingkat.nama — TA tahun"
  const groups: Record<string, typeof rows> = {};
  for (const r of rows) {
    const key = `${r.tingkat.nama} — TA ${r.tahunAjaran.tahun}${r.tahunAjaran.aktif ? " ✓" : ""}`;
    (groups[key] ??= []).push(r);
  }

  return (
    <select name={name} defaultValue={String(defaultValue)} className={className}>
      {includeEmpty && <option value="">{emptyLabel}</option>}
      {Object.entries(groups).map(([group, rombels]) => (
        <optgroup key={group} label={group}>
          {rombels.map((r) => (
            <option key={r.id} value={r.id}>{r.nama}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
