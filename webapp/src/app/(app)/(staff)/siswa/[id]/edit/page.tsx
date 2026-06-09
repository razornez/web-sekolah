import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FotoUpload } from "@/components/FotoUpload";
import { AccountPanel } from "@/components/AccountPanel";
import { SiswaEditForm, type EditInitial } from "../../_revamp/SiswaEditForm";

type T = Awaited<ReturnType<typeof getTranslations<"siswa">>>;
function rel(d: Date, t: T, locale: string): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return t("edit.relToday");
  if (days === 1) return t("edit.relYesterday");
  if (days < 7) return t("edit.relDays", { n: days });
  if (days < 30) return t("edit.relWeeks", { n: Math.floor(days / 7) });
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export default async function EditSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const t = await getTranslations("siswa");
  const locale = await getLocale();
  const { id } = await params;
  const sid = Number(id);
  const s = await prisma.siswa.findFirst({
    where: { id: sid, sekolahId, deletedAt: null },
    include: {
      anggotaRombel: { take: 1, orderBy: { id: "desc" }, select: { rombel: { select: { nama: true } } } },
      orangTuaWali: true,
      user: { select: { id: true, username: true, isActive: true } },
    },
  });
  if (!s) notFound();
  const audit = await prisma.auditLog.findMany({
    where: { sekolahId, entitas: "siswa", entitasId: String(sid) },
    orderBy: { createdAt: "desc" }, take: 6,
    select: { aksi: true, detail: true, userName: true, createdAt: true },
  });

  const v = (x: string | null | undefined) => x ?? "";
  const ayah = s.orangTuaWali.find((o) => o.tipe === "ayah");
  const ibu = s.orangTuaWali.find((o) => o.tipe === "ibu");
  const initial: EditInitial = {
    namaLengkap: v(s.namaLengkap), jenisKelamin: v(s.jenisKelamin), tempatLahir: v(s.tempatLahir),
    tanggalLahir: s.tanggalLahir ? s.tanggalLahir.toISOString().slice(0, 10) : "",
    nik: v(s.nik), agama: v(s.agama), anakKe: s.anakKe != null ? String(s.anakKe) : "",
    hobi: v(s.hobi), citaCita: v(s.citaCita),
    nisn: v(s.nisn), nis: v(s.nis), noInduk: v(s.noInduk),
    tahunMasuk: s.tahunMasuk != null ? String(s.tahunMasuk) : "", status: v(s.status), asalSekolah: v(s.asalSekolah),
    alamat: v(s.alamat), desaKel: v(s.desaKel), kecamatan: v(s.kecamatan), kabupaten: v(s.kabupaten),
    kodePos: v(s.kodePos), noHp: v(s.noHp), tinggalDengan: v(s.tinggalDengan), transportasi: v(s.transportasi),
    tinggiBadan: v(s.tinggiBadan), beratBadan: v(s.beratBadan), golonganDarah: v(s.golonganDarah), kebutuhanKhusus: v(s.kebutuhanKhusus),
    ayah_nama: v(ayah?.nama), ayah_pekerjaan: v(ayah?.pekerjaan), ayah_pendidikan: v(ayah?.pendidikan), ayah_hp: v(ayah?.noHp),
    ibu_nama: v(ibu?.nama), ibu_pekerjaan: v(ibu?.pekerjaan), ibu_pendidikan: v(ibu?.pendidikan), ibu_hp: v(ibu?.noHp),
  };
  const kelas = s.anggotaRombel[0]?.rombel?.nama ?? "—";
  const updatedInfo = audit[0] ? t("edit.updatedBy", { when: rel(audit[0].createdAt, t, locale), who: audit[0].userName }) : t("edit.neverUpdated");
  const auditFmt = audit.map((a) => ({ aksi: a.aksi, detail: a.detail ?? "", userName: a.userName, when: rel(a.createdAt, t, locale) }));

  return (
    <div>
      <SiswaEditForm id={sid} initial={initial} kelas={kelas} audit={auditFmt} updatedInfo={updatedInfo} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18, maxWidth: 720 }}>
        <FotoUpload kind="siswa" ownerId={s.id} current={s.foto} />
        <AccountPanel kind="siswa" ownerId={s.id} account={s.user ? { userId: s.user.id, username: s.user.username, isActive: s.user.isActive } : null} />
      </div>
    </div>
  );
}
