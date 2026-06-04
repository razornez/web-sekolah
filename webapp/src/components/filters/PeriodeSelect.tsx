import { prisma } from "@/lib/prisma";

type Props = {
  sekolahId: number;
  name?: string;
  defaultValue?: number | string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

export async function PeriodeSelect({
  sekolahId,
  name = "periodeId",
  defaultValue = "",
  includeEmpty = true,
  emptyLabel = "— Semua Periode —",
  className = "rounded-md border border-gray-300 px-2 py-1.5 text-sm",
}: Props) {
  const rows = await prisma.periode.findMany({
    where: { tahunAjaran: { sekolahId } },
    orderBy: [{ tahunAjaranId: "desc" }, { urutan: "asc" }],
    include: { tahunAjaran: { select: { tahun: true } } },
  });
  return (
    <select name={name} defaultValue={String(defaultValue)} className={className}>
      {includeEmpty && <option value="">{emptyLabel}</option>}
      {rows.map((p) => (
        <option key={p.id} value={p.id}>
          {p.tahunAjaran.tahun} · {p.nama}
          {p.aktif ? " ✓" : ""}
        </option>
      ))}
    </select>
  );
}
