import { prisma } from "@/lib/prisma";

const KELOMPOK_LABEL: Record<string, string> = {
  A: "Kelompok A — Wajib Umum",
  B: "Kelompok B — Wajib Pilihan",
  C: "Kelompok C — Peminatan",
  lintasminat: "Lintas Minat",
  muatanlokal: "Muatan Lokal",
};
const KELOMPOK_ORDER = ["A", "B", "C", "lintasminat", "muatanlokal"];

type Props = {
  sekolahId: number;
  name?: string;
  defaultValue?: number | string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  onlyAktif?: boolean;
  className?: string;
};

/** Server component: grouped select mapel by kelompok, ordered by noUrut asc */
export async function MapelSelect({
  sekolahId,
  name = "mapelId",
  defaultValue = "",
  includeEmpty = true,
  emptyLabel = "— Semua Mapel —",
  onlyAktif = true,
  className = "rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[180px]",
}: Props) {
  const rows = await prisma.mapel.findMany({
    where: { sekolahId, ...(onlyAktif ? { aktif: true } : {}) },
    orderBy: [{ noUrut: "asc" }, { namaMapel: "asc" }],
    select: { id: true, namaMapel: true, kodeMapel: true, kelompok: true },
  });

  const groups: Record<string, typeof rows> = {};
  for (const m of rows) {
    (groups[m.kelompok] ??= []).push(m);
  }

  return (
    <select name={name} defaultValue={String(defaultValue)} className={className}>
      {includeEmpty && <option value="">{emptyLabel}</option>}
      {KELOMPOK_ORDER.map((kel) => {
        const items = groups[kel];
        if (!items?.length) return null;
        return (
          <optgroup key={kel} label={KELOMPOK_LABEL[kel] ?? kel}>
            {items.map((m) => (
              <option key={m.id} value={m.id}>
                {m.namaMapel}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
