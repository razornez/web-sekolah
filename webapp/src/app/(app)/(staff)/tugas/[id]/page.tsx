import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { nilaiPengumpulan } from "../actions";

const fmt = (d: Date) => d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function TugasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireModule("tugas");
  const t = await getTranslations("tugas");
  const tugasId = Number((await params).id);

  const tugas = await prisma.tugas.findFirst({
    where: { id: tugasId, sekolahId },
    include: {
      pengumpulan: {
        include: { siswa: { select: { namaLengkap: true, nisn: true } } },
        orderBy: { tanggalKumpul: "asc" },
      },
    },
  });
  if (!tugas) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/tugas" className="text-sm text-gray-500 hover:text-gray-900">{t("back")}</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{tugas.judul}</h1>
        <p className="text-sm text-gray-500">{t("detailSubtitle", { mapel: tugas.mapel ?? "-", n: tugas.pengumpulan.length })}</p>
        {tugas.deskripsi && <p className="mt-2 text-sm text-gray-600">{tugas.deskripsi}</p>}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2 font-medium">{t("colSiswa")}</th><th className="px-4 py-2 font-medium">{t("colJawaban")}</th><th className="px-4 py-2 font-medium">{t("colWaktu")}</th><th className="px-4 py-2 font-medium">{t("colNilai")}</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tugas.pengumpulan.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("emptyPengumpulan")}</td></tr>}
            {tugas.pengumpulan.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-gray-900">{p.siswa.namaLengkap}<div className="text-xs text-gray-400">{p.siswa.nisn ?? ""}</div></td>
                <td className="px-4 py-2 text-gray-600">
                  {p.teks && <div className="whitespace-pre-line">{p.teks}</div>}
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">{t("attachment")}</a>}
                  {!p.teks && !p.link && "-"}
                </td>
                <td className="px-4 py-2 text-gray-500">{fmt(p.tanggalKumpul)}</td>
                <td className="px-4 py-2">
                  <form action={nilaiPengumpulan} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="tugasId" value={tugas.id} />
                    <input name="nilai" type="number" min={0} max={100} defaultValue={p.nilai ?? ""} className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm" />
                    <button className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">{t("save")}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
