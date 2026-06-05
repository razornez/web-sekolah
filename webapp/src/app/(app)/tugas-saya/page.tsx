import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { submitTugas } from "./actions";

const inCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date | null) => (d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : null);

export default async function TugasSayaPage() {
  const user = await getCurrentUser();
  if (isStaff(user.role)) redirect("/tugas");
  const sekolahId = user.sekolahId ?? -1;
  const tr = await getTranslations("portal");

  const siswa = await prisma.siswa.findFirst({
    where: { userId: user.id, sekolahId },
    select: {
      id: true,
      anggotaRombel: { orderBy: { id: "desc" }, take: 1, select: { rombelId: true } },
    },
  });
  if (!siswa) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">{tr("tugasTitle")}</h1>
        <p className="text-gray-500">{tr("tugasOnlyStudent")}</p>
      </div>
    );
  }
  const rombelId = siswa.anggotaRombel[0]?.rombelId ?? null;

  const tugas = await prisma.tugas.findMany({
    where: {
      sekolahId,
      OR: [{ rombelId: null }, ...(rombelId ? [{ rombelId }] : [])],
    },
    orderBy: { createdAt: "desc" },
    include: { pengumpulan: { where: { siswaId: siswa.id }, take: 1 } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{tr("tugasTitle")}</h1>
      {tugas.length === 0 && <p className="text-sm text-gray-400">{tr("tugasEmpty")}</p>}
      {tugas.map((t) => {
        const sub = t.pengumpulan[0];
        return (
          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">{t.judul}</div>
                <div className="text-xs text-gray-400">
                  {t.mapel ?? "-"}{fmt(t.deadline) ? ` · ${tr("tugasDeadline", { date: fmt(t.deadline)! })}` : ""}
                </div>
              </div>
              {sub?.nilai != null && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">{tr("tugasNilai", { nilai: sub.nilai })}</span>
              )}
            </div>
            {t.deskripsi && <p className="mt-1 text-sm text-gray-600">{t.deskripsi}</p>}

            <form action={submitTugas} className="mt-3 space-y-2">
              <input type="hidden" name="tugasId" value={t.id} />
              <textarea name="teks" defaultValue={sub?.teks ?? ""} rows={2} placeholder={tr("tugasJawabanPlaceholder")} className={inCls} />
              <input name="link" defaultValue={sub?.link ?? ""} placeholder={tr("tugasLinkPlaceholder")} className={inCls} />
              <div className="flex items-center gap-2">
                <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
                  {sub ? tr("tugasUpdate") : tr("tugasSubmit")}
                </button>
                {sub && <span className="text-xs text-gray-400">{tr("tugasSubmitted", { date: fmt(sub.tanggalKumpul) ?? "-" })}</span>}
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
}
