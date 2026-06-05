import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { saveTarget, savePenilaian } from "../actions";
import { RombelSelect } from "@/components/filters/RombelSelect";

const PREDIKAT = ["MB", "SB", "BSH", "SAB"];

export default async function P5DetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rombelId?: string }>;
}) {
  const sekolahId = await requireModule("p5");
  const t = await getTranslations("p5");
  const projekP5Id = Number((await params).id);
  const rombelId = Number((await searchParams).rombelId) || 0;

  const [projek, dimensi] = await Promise.all([
    prisma.projekP5.findFirst({
      where: { id: projekP5Id, sekolahId },
      include: { tahunAjaran: { select: { tahun: true } }, target: { include: { elemen: { select: { id: true, nama: true } } } } },
    }),
    prisma.dimensiProfil.findMany({ orderBy: { urutan: "asc" }, include: { elemen: { orderBy: { id: "asc" } } } }),
  ]);
  if (!projek) notFound();

  const targetIds = new Set(projek.target.map((t) => t.elemenId));
  const targetElemen = projek.target.map((t) => t.elemen); // kolom matriks

  let anggota: { siswaId: number; nomorAbsen: number | null; siswa: { namaLengkap: string } }[] = [];
  const nilaiMap = new Map<string, string>();
  if (rombelId) {
    anggota = await prisma.anggotaRombel.findMany({
      where: { rombelId, rombel: { sekolahId } },
      orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
      select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true } } },
    });
    const nilai = await prisma.penilaianP5.findMany({
      where: { projekP5Id, siswaId: { in: anggota.map((a) => a.siswaId) } },
      select: { siswaId: true, elemenId: true, predikat: true },
    });
    for (const n of nilai) nilaiMap.set(`${n.siswaId}_${n.elemenId}`, n.predikat);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/p5" className="text-sm text-gray-500 hover:text-gray-900">{t("back")}</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{projek.judul}</h1>
        <p className="text-sm text-gray-500">{t("detailSubtitle", { tema: projek.tema, tahun: projek.tahunAjaran.tahun })}</p>
      </div>

      {/* Target elemen */}
      <form action={saveTarget} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input type="hidden" name="projekP5Id" value={projek.id} />
        <h2 className="text-sm font-medium text-gray-700">{t("targetHeading")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dimensi.map((d) => (
            <div key={d.id} className="rounded-md border border-gray-100 p-3">
              <div className="mb-1 text-xs font-medium text-gray-500">{d.nama}</div>
              <div className="space-y-1">
                {d.elemen.map((e) => (
                  <label key={e.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="elemenId" value={e.id} defaultChecked={targetIds.has(e.id)} className="mt-0.5" />
                    <span>{e.nama}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("saveTarget")}</button>
      </form>

      {/* Penilaian */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-700">{t("penilaianHeading")}</h2>
        {targetElemen.length === 0 ? (
          <p className="text-sm text-gray-400">{t("selectTargetFirst")}</p>
        ) : (
          <>
            <form className="flex items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500">{t("fieldRombel")}</label>
                <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("show")}</button>
            </form>

            {rombelId > 0 && (
              <form action={savePenilaian} className="space-y-3 overflow-x-auto">
                <input type="hidden" name="projekP5Id" value={projek.id} />
                <input type="hidden" name="rombelId" value={rombelId} />
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t("colNama")}</th>
                      {targetElemen.map((e) => <th key={e.id} className="px-3 py-2 font-medium">{e.nama}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {anggota.length === 0 && <tr><td colSpan={targetElemen.length + 1} className="px-3 py-8 text-center text-gray-400">{t("noMembers")}</td></tr>}
                    {anggota.map((a) => (
                      <tr key={a.siswaId}>
                        <td className="px-3 py-2 text-gray-900">{a.siswa.namaLengkap}</td>
                        {targetElemen.map((e) => (
                          <td key={e.id} className="px-3 py-2">
                            <select name={`p_${a.siswaId}_${e.id}`} defaultValue={nilaiMap.get(`${a.siswaId}_${e.id}`) ?? ""} className="rounded-md border border-gray-300 px-1 py-1 text-xs">
                              <option value="">-</option>
                              {PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {anggota.length > 0 && <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("savePenilaian")}</button>}
              </form>
            )}
            <p className="text-xs text-gray-400">{t("predikatLegend")}</p>
          </>
        )}
      </div>
    </div>
  );
}
