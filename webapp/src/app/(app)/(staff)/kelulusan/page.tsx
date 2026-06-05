import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { saveKelulusan, saveSettingKelulusan } from "./actions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const selCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export default async function KelulusanPage({
  searchParams,
}: {
  searchParams: Promise<{ rombelId?: string }>;
}) {
  const sekolahId = await requireStaff();
  const t = await getTranslations("kelulusan");
  const rombelId = Number((await searchParams).rombelId) || 0;

  const [setting, sekolah] = await Promise.all([
    prisma.settingKelulusan.findFirst({ where: { sekolahId } }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { slug: true } }),
  ]);

  let anggota: { siswaId: number; nomorAbsen: number | null; siswa: { namaLengkap: string; foto: string | null }; status?: string }[] = [];
  if (rombelId) {
    const rows = await prisma.anggotaRombel.findMany({
      where: { rombelId, rombel: { sekolahId } },
      orderBy: [{ nomorAbsen: "asc" }, { siswa: { namaLengkap: "asc" } }],
      select: { siswaId: true, nomorAbsen: true, siswa: { select: { namaLengkap: true, foto: true } } },
    });
    const lulus = await prisma.kelulusan.findMany({
      where: { siswaId: { in: rows.map((r) => r.siswaId) } },
      select: { siswaId: true, status: true },
    });
    const byId = new Map(lulus.map((l) => [l.siswaId, l.status]));
    anggota = rows.map((r) => ({ ...r, status: byId.get(r.siswaId) }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>

      {/* Pengaturan pengumuman */}
      <form action={saveSettingKelulusan} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">{t("settingTitle")}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="aktif" defaultChecked={setting?.aktif ?? false} />
          {t.rich("enablePublic", {
            url: () => <span className="font-mono">/cek-kelulusan/{sekolah?.slug}</span>,
          })}
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500">{t("fieldTanggalRilis")}</label>
            <input type="date" name="tanggalRilis" defaultValue={setting?.tanggalRilis ? setting.tanggalRilis.toISOString().slice(0, 10) : ""} className={selCls} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500">{t("fieldPengumuman")}</label>
            <input name="pengumuman" defaultValue={setting?.pengumuman ?? ""} className={`${selCls} w-full`} />
          </div>
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("saveSetting")}</button>
      </form>

      {/* Set status per rombel */}
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs text-gray-500">{t("fieldRombel")}</label>
          <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className={selCls} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("show")}</button>
      </form>

      {rombelId > 0 && (
        <form action={saveKelulusan} className="space-y-3">
          <input type="hidden" name="rombelId" value={rombelId} />
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-2 font-medium">{t("colNo")}</th><th className="px-4 py-2 font-medium">{t("colNama")}</th><th className="px-4 py-2 font-medium">{t("colStatusKelulusan")}</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
                {anggota.map((a, i) => (
                  <tr key={a.siswaId}>
                    <td className="px-4 py-2 text-gray-500">{a.nomorAbsen ?? i + 1}</td>
                    <td className="px-4 py-2 text-gray-900">
                      <div className="flex items-center gap-2">
                        <SiswaAvatar namaLengkap={a.siswa.namaLengkap} foto={a.siswa.foto} size="sm" />
                        <span>{a.siswa.namaLengkap}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <select name={`status_${a.siswaId}`} defaultValue={a.status ?? ""} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                        <option value="">-</option>
                        <option value="LULUS">LULUS</option>
                        <option value="TIDAK LULUS">TIDAK LULUS</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {anggota.length > 0 && <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("saveStatus")}</button>}
        </form>
      )}
    </div>
  );
}
