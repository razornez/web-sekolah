import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";

export default async function UjianSayaPage() {
  const user = await getCurrentUser();
  if (isStaff(user.role)) redirect("/ujian");
  const sekolahId = user.sekolahId ?? -1;
  const t = await getTranslations("portal");

  const siswa = await prisma.siswa.findFirst({
    where: { userId: user.id, sekolahId },
    select: { id: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, select: { rombelId: true } } },
  });
  if (!siswa) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">{t("ujianTitle")}</h1>
        <p className="text-gray-500">{t("ujianOnlyStudent")}</p>
      </div>
    );
  }
  const rombelId = siswa.anggotaRombel[0]?.rombelId ?? null;
  const now = new Date();

  const ujian = await prisma.ujian.findMany({
    where: {
      sekolahId,
      aktif: true,
      OR: [{ rombelId: null }, ...(rombelId ? [{ rombelId }] : [])],
      AND: [{ OR: [{ mulai: null }, { mulai: { lte: now } }] }, { OR: [{ selesai: null }, { selesai: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    include: { hasil: { where: { siswaId: siswa.id }, take: 1 }, _count: { select: { soal: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{t("ujianTitle")}</h1>
      {ujian.length === 0 && <p className="text-sm text-gray-400">{t("ujianEmpty")}</p>}
      {ujian.map((u) => {
        const h = u.hasil[0];
        const label = !h ? t("ujianStart") : h.status === "selesai" ? t("ujianViewResult") : t("ujianContinue");
        return (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <div className="font-medium text-gray-900">{u.judul}</div>
              <div className="text-xs text-gray-400">
                {u.mapel ?? "-"} · {t("ujianSoalCount", { count: u._count.soal })}{u.durasiMenit ? ` · ${t("ujianDurasi", { menit: u.durasiMenit })}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {h?.status === "selesai" && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">{t("ujianSkor", { skor: h.skor ?? "-" })}</span>
              )}
              <Link href={`/ujian-saya/${u.id}`} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
                {label}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
