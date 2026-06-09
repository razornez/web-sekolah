import { notFound, redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireModule, canManageGuru } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FotoUpload } from "@/components/FotoUpload";
import { AccountPanel } from "@/components/AccountPanel";
import { GuruEditForm } from "../../_revamp/GuruEditForm";

type T = Awaited<ReturnType<typeof getTranslations<"guru">>>;
function rel(d: Date, t: T, locale: string): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return t("relToday");
  if (days === 1) return t("relYesterday");
  if (days < 7) return t("relDays", { n: days });
  if (days < 30) return t("relWeeks", { n: Math.floor(days / 7) });
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function GuruEditPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const me = await getCurrentUser();
  if (!canManageGuru(me.role)) redirect(`/guru/${(await params).id}`);
  const { id } = await params;
  const g = await prisma.guru.findFirst({
    where: { id: Number(id), sekolahId, deletedAt: null },
    include: { pendidikan: true, mapelDiampu: { select: { namaMapel: true } }, rombelWali: { select: { nama: true } }, user: { select: { id: true, username: true, isActive: true } } },
  });
  if (!g) notFound();
  const t = await getTranslations("guru");
  const locale = await getLocale();

  const initial: Record<string, string> = {
    namaGuru: g.namaGuru, jenisKelamin: g.jenisKelamin, tempatLahir: g.tempatLahir ?? "", tanggalLahir: iso(g.tanggalLahir), nik: g.nik ?? "",
    nip: g.nip ?? "", nuptk: g.nuptk ?? "", npk: g.npk ?? "", statusGuru: g.statusGuru ?? "", pangkat: g.pangkat ?? "", golongan: g.golongan ?? "", jenisJabatan: g.jenisJabatan ?? "", tmt: iso(g.tmt),
    alamat: g.alamat ?? "", email: g.email ?? "", noTelp: g.noTelp ?? "",
  };
  const audit = await prisma.auditLog.findMany({ where: { entitas: "guru", entitasId: String(id) }, orderBy: { createdAt: "desc" }, take: 5 });
  const auditFmt = audit.map((a) => ({ aksi: a.aksi, detail: a.detail ?? "", userName: a.userName, when: rel(a.createdAt, t, locale) }));
  const updatedInfo = audit[0] ? t("updatedBy", { when: rel(audit[0].createdAt, t, locale), who: audit[0].userName }) : t("neverUpdated");
  const extra = {
    pendidikan: g.pendidikan.map((p) => ({ jenjang: p.jenjang, namaSekolah: p.namaSekolah ?? "", jurusan: p.jurusan ?? "", tahunLulus: p.tahunLulus ?? "" })),
    mapel: g.mapelDiampu.map((m) => m.namaMapel), wali: g.rombelWali[0]?.nama ?? null,
  };
  const account = g.user ? { userId: g.user.id, username: g.user.username, isActive: g.user.isActive } : null;

  return (
    <>
      <GuruEditForm id={g.id} initial={initial} audit={auditFmt} updatedInfo={updatedInfo} extra={extra} />
      <div id="ak-ge"><div className="ge-extra">
        <div className="ge-extracard"><h3>📷 {t("fotoTitle")}</h3><FotoUpload kind="guru" ownerId={g.id} current={g.foto} /></div>
        <div className="ge-extracard"><h3>🔑 {t("akunTitle")}</h3><AccountPanel kind="guru" ownerId={g.id} account={account} /></div>
      </div></div>
    </>
  );
}
