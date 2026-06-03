import { prisma } from "@/lib/prisma";

const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

/** Feed pengumuman sesuai audiens (semua + target spesifik). */
export async function PengumumanFeed({
  sekolahId,
  audience,
}: {
  sekolahId: number;
  audience: "staf" | "siswa" | "ortu";
}) {
  const rows = await prisma.pengumuman.findMany({
    where: { sekolahId, target: { in: ["semua", audience] } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Pengumuman</div>
      <div className="divide-y divide-gray-100">
        {rows.length === 0 && <p className="px-4 py-4 text-sm text-gray-400">Belum ada pengumuman.</p>}
        {rows.map((p) => (
          <div key={p.id} className="px-4 py-3">
            <div className="text-sm font-medium text-gray-900">
              {p.pinned && <span className="mr-1 text-amber-600">📌</span>}
              {p.judul}
            </div>
            <div className="text-xs text-gray-400">{fmt(p.createdAt)}</div>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{p.isi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
