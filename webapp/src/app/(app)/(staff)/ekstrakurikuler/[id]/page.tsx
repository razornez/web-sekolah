import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { addAnggotaEkstra, removeAnggotaEkstra } from "../actions";
import { SiswaAutocomplete } from "@/components/SiswaAutocomplete";
import { SiswaAvatar } from "@/components/SiswaAvatar";

export default async function EkstraDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const sekolahId = await requireModule("ekstrakurikuler");
  const t = await getTranslations("ekstrakurikuler");
  const ekstraId = Number((await params).id);
  const addQ = ((await searchParams).add ?? "").trim();

  const ekstra = await prisma.ekstrakurikuler.findFirst({
    where: { id: ekstraId, sekolahId },
    include: {
      pembina: { select: { namaGuru: true } },
      anggota: {
        include: { siswa: { select: { id: true, namaLengkap: true, nisn: true, foto: true } } },
        orderBy: { siswa: { namaLengkap: "asc" } },
      },
    },
  });
  if (!ekstra) notFound();

  const kandidat = addQ
    ? await prisma.siswa.findMany({
        where: {
          sekolahId,
          namaLengkap: { contains: addQ, mode: "insensitive" },
          NOT: { anggotaEkstra: { some: { ekstraId } } },
        },
        take: 10,
        orderBy: { namaLengkap: "asc" },
        select: { id: true, namaLengkap: true, nisn: true, foto: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ekstrakurikuler" className="text-sm text-gray-500 hover:text-gray-900">{t("backToList")}</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{ekstra.nama}</h1>
        <p className="text-sm text-gray-500">{t("supervisorLine", { pembina: ekstra.pembina?.namaGuru ?? "-", n: ekstra.anggota.length })}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2 font-medium">{t("colNama")}</th><th className="px-4 py-2 font-medium">{t("colNisn")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ekstra.anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t("emptyMembers")}</td></tr>}
              {ekstra.anggota.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">
                    <div className="flex items-center gap-2">
                      <SiswaAvatar namaLengkap={a.siswa.namaLengkap} foto={a.siswa.foto} size="sm" />
                      <span>{a.siswa.namaLengkap}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{a.siswa.nisn ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeAnggotaEkstra} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="ekstraId" value={ekstra.id} />
                      <button className="text-red-600 hover:underline">{t("keluarkan")}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-700">{t("addMemberTitle")}</h2>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <form className="flex gap-2">
              <SiswaAutocomplete name="add" defaultValue={addQ} placeholder={t("searchStudentPlaceholder")} className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-gray-900" />
              <button className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">{t("search")}</button>
            </form>
            {addQ && kandidat.length === 0 && <p className="text-sm text-gray-400">{t("noStudentMatch")}</p>}
            <ul className="divide-y divide-gray-100">
              {kandidat.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <SiswaAvatar namaLengkap={s.namaLengkap} foto={s.foto} size="sm" />
                    <span>{s.namaLengkap} <span className="text-xs text-gray-400">{s.nisn ?? ""}</span></span>
                  </div>
                  <form action={addAnggotaEkstra}>
                    <input type="hidden" name="ekstraId" value={ekstra.id} />
                    <input type="hidden" name="siswaId" value={s.id} />
                    <button className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800">{t("addMember")}</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
