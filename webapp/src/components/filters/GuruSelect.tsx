import { prisma } from "@/lib/prisma";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";

/**
 * GuruSelect — Server Component, fetch + render AutocompleteSelect untuk pilihan guru.
 * Drop-in pengganti <select name="guruId"> di Server Component manapun.
 */
export async function GuruSelect({
  sekolahId,
  name = "guruId",
  defaultValue = "",
  className = "w-full rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm outline-none focus:border-gray-900",
  placeholder = "Cari nama guru…",
  emptyLabel = "— semua guru —",
  required = false,
}: {
  sekolahId: number;
  name?: string;
  defaultValue?: string | number;
  className?: string;
  placeholder?: string;
  emptyLabel?: string;
  required?: boolean;
}) {
  const list = await prisma.guru.findMany({
    where: { sekolahId, deletedAt: null },
    orderBy: { namaGuru: "asc" },
    select: { id: true, namaGuru: true, jenisJabatan: true },
  });

  const options = list.map((g) => ({
    key: g.id,
    value: g.id,
    label: g.namaGuru,
    sub: g.jenisJabatan ?? undefined,
  }));

  const defaultLabel = defaultValue
    ? (list.find((g) => g.id === Number(defaultValue))?.namaGuru ?? "")
    : "";

  return (
    <AutocompleteSelect
      options={options}
      name={name}
      defaultValue={defaultValue}
      defaultLabel={defaultLabel}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      className={className}
      required={required}
    />
  );
}
