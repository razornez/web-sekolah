import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

const KATEGORI_DOT: Record<string, string> = { umum: "bg-gray-400", akademik: "bg-blue-500", keuangan: "bg-green-500", kegiatan: "bg-purple-500", penting: "bg-red-500" };
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const strip = (html: string, n = 100) => { const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; };

export async function PengumumanFeed({ sekolahId, audience }: { sekolahId: number; audience: "staf" | "siswa" | "ortu" }) {
  const rows = await prisma.pengumuman.findMany({
    where: { sekolahId, target: { in: ["semua", audience] } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  const t = await getTranslations("common");

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">{t("components.announcements")}</span>
        <Link href="/pengumuman" className="text-xs text-gray-400 hover:text-gray-700">{t("components.viewAll")}</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.length === 0 && <p className="px-4 py-4 text-sm text-gray-400">{t("components.noAnnouncements")}</p>}
        {rows.map((p) => (
          <Link key={p.id} href={`/pengumuman/${p.id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-2">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${KATEGORI_DOT[p.kategori] ?? KATEGORI_DOT.umum}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {p.pinned && <span className="mr-1 text-amber-500">📌</span>}
                  {p.judul}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                  <span>{fmt(p.createdAt)}</span>
                  <span>·</span>
                  <span>👁 {p.viewCount}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{strip(p.isi)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
