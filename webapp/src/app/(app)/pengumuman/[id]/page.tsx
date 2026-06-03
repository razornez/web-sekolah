import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { ViewTracker } from "@/components/ViewTracker";
import { incrementView } from "@/app/(app)/(staff)/pengumuman/actions";

const KATEGORI_BADGE: Record<string, string> = { umum: "bg-gray-100 text-gray-700", akademik: "bg-blue-100 text-blue-700", keuangan: "bg-green-100 text-green-700", kegiatan: "bg-purple-100 text-purple-700", penting: "bg-red-100 text-red-700" };
const TARGET_BADGE: Record<string, string> = { semua: "bg-slate-100 text-slate-700", staf: "bg-orange-100 text-orange-700", siswa: "bg-cyan-100 text-cyan-700", ortu: "bg-pink-100 text-pink-700" };
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const strip = (html: string, n = 250) => { const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; };

export default async function PengumumanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const p = await prisma.pengumuman.findUnique({
    where: { id: Number(id) },
    include: { sekolah: { select: { nama: true } }, author: { select: { namaLengkap: true, role: true } } },
  });
  if (!p) notFound();

  const waText = `📢 *${p.judul}*\n\n${strip(p.isi)}\n\n— ${p.sekolah.nama}`;
  const staffView = isStaff(user.role);
  const increment = incrementView.bind(null, p.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href={staffView ? "/pengumuman" : "/portal"} className="text-sm text-gray-500 hover:text-gray-900">
          ← {staffView ? "Semua Pengumuman" : "Portal"}
        </Link>
        {staffView && (
          <Link href={`/pengumuman/${p.id}/edit`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
            Edit
          </Link>
        )}
      </div>

      {/* Card detail */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {p.pinned && <span className="text-amber-500">📌 Dipinned</span>}
          <span className={`rounded-full px-3 py-0.5 text-sm font-medium ${KATEGORI_BADGE[p.kategori] ?? KATEGORI_BADGE.umum}`}>
            {p.kategori.charAt(0).toUpperCase() + p.kategori.slice(1)}
          </span>
          <span className={`rounded-full px-3 py-0.5 text-sm ${TARGET_BADGE[p.target] ?? TARGET_BADGE.semua}`}>
            🎯 {p.target}
          </span>
          <span className="ml-auto rounded-full bg-gray-50 px-2.5 py-0.5 text-sm text-gray-500">
            👁 {(p.viewCount + 1).toLocaleString("id-ID")} dilihat
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-gray-900">{p.judul}</h1>

        {/* Meta */}
        <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4 text-sm text-gray-500">
          <span>🕐 {fmt(p.createdAt)}</span>
          {p.author && (
            <span>✍️ <span className="font-medium text-gray-700">{p.author.namaLengkap}</span></span>
          )}
          <span>🏫 {p.sekolah.nama}</span>
        </div>

        {/* Content — HTML dari Tiptap, staff-entered & trusted */}
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: p.isi }}
        />

        {/* Tiptap prose styles */}
        <style>{`
          .prose h1{font-size:1.5rem;font-weight:700;margin:1rem 0 .5rem}
          .prose h2{font-size:1.25rem;font-weight:700;margin:.75rem 0 .4rem}
          .prose h3{font-size:1.1rem;font-weight:600;margin:.6rem 0 .3rem}
          .prose p{margin:0 0 .75rem}
          .prose ul,.prose ol{padding-left:1.5rem;margin-bottom:.75rem}
          .prose li{margin-bottom:.2rem}
          .prose blockquote{border-left:3px solid #d1d5db;padding-left:1rem;color:#6b7280;margin:.75rem 0}
          .prose code{background:#f3f4f6;border-radius:3px;padding:0 4px;font-size:.85em}
          .prose pre{background:#1f2937;color:#f9fafb;padding:1rem;border-radius:6px;overflow-x:auto;margin:.75rem 0}
          .prose a{color:#2563eb;text-decoration:underline}
          .prose hr{border:none;border-top:1px solid #e5e7eb;margin:1rem 0}
          .prose [style*="text-align: center"]{text-align:center}
          .prose [style*="text-align: right"]{text-align:right}
        `}</style>

        {/* Share & actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
          >
            📱 Bagikan ke WhatsApp
          </a>
          {staffView && (
            <Link href={`/pengumuman/${p.id}/edit`} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              ✏️ Edit Pengumuman
            </Link>
          )}
        </div>
      </div>

      {/* ViewTracker — increment di client (best-effort) */}
      <ViewTracker action={increment} />
    </div>
  );
}
