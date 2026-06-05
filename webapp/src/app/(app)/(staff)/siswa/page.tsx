import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { PageGuide } from "@/components/PageGuide";
import { SiswaAvatar } from "@/components/SiswaAvatar";

const PER = 25;
const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-green-100 text-green-700",
  lulus: "bg-blue-100 text-blue-700",
  pindah: "bg-amber-100 text-amber-700",
  keluar: "bg-red-100 text-red-700",
  alumni: "bg-purple-100 text-purple-700",
};

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; gender?: string; agama?: string; rombelId?: string; tahunMasuk?: string; page?: string }>;
}) {
  const sekolahId = await requireModule("siswa");
  const t = await getTranslations("siswa");
  const statusLabel = (s: string): string => {
    const map: Record<string, string> = {
      aktif: t("statusAktif"), lulus: t("statusLulus"), pindah: t("statusPindah"),
      keluar: t("statusKeluar"), alumni: t("statusAlumni"),
    };
    return map[s] ?? s;
  };
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const gender = sp.gender ?? "";
  const agama = sp.agama ?? "";
  const rombelId = Number(sp.rombelId) || 0;
  const tahunMasuk = Number(sp.tahunMasuk) || 0;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.SiswaWhereInput = {
    sekolahId, deletedAt: null,
    ...(q ? { OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { nisn: { contains: q } }, { nis: { contains: q } }] } : {}),
    ...(status ? { status: status as Prisma.EnumStatusSiswaFilter["equals"] } : {}),
    ...(gender === "L" || gender === "P" ? { jenisKelamin: gender as "L" | "P" } : {}),
    ...(agama ? { agama: { contains: agama, mode: "insensitive" } } : {}),
    ...(tahunMasuk ? { tahunMasuk } : {}),
    ...(rombelId ? { anggotaRombel: { some: { rombelId } } } : {}),
  };

  const [total, rows, agamaOpts, tahunOpts, arsipCount] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({ where, orderBy: { namaLengkap: "asc" }, skip: (page - 1) * PER, take: PER, include: { anggotaRombel: { include: { rombel: { select: { nama: true } } }, take: 1, orderBy: { id: "desc" } } } }),
    prisma.siswa.findMany({ where: { sekolahId, deletedAt: null, agama: { not: null } }, distinct: ["agama"], select: { agama: true }, orderBy: { agama: "asc" } }),
    prisma.siswa.findMany({ where: { sekolahId, deletedAt: null, tahunMasuk: { not: null } }, distinct: ["tahunMasuk"], select: { tahunMasuk: true }, orderBy: { tahunMasuk: "desc" } }),
    prisma.siswa.count({ where: { sekolahId, deletedAt: { not: null } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER));
  const bld = (ov: Record<string, string | number>) => {
    const p = new URLSearchParams({ q, status, gender, agama, rombelId: String(rombelId || ""), tahunMasuk: String(tahunMasuk || ""), page: "1", ...Object.fromEntries(Object.entries(ov).map(([k, v]) => [k, String(v)])) });
    return `/siswa?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <PageGuide
        icon="👥"
        title={t("title")}
        description={t("guideDescription")}
        tips={[
          t("tip1"),
          t("tip2"),
          t("tip3"),
          t("tip4"),
          t("tip5"),
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-sm text-gray-500">
            {t("activeCount", { n: total.toLocaleString("id-ID") })}
            {arsipCount > 0 && <Link href="/siswa/arsip" className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200">🗑 {t("archiveBadge", { n: arsipCount })}</Link>}
          </p>
        </div>
        <Link href="/siswa/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addStudent")}</Link>
      </div>

      {/* Filter */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="status" value={status} /><input type="hidden" name="gender" value={gender} /><input type="hidden" name="agama" value={agama} /><input type="hidden" name="rombelId" value={rombelId || ""} /><input type="hidden" name="tahunMasuk" value={tahunMasuk || ""} />
          <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">{t("search")}</button>
          {(q||status||gender||agama||rombelId||tahunMasuk) && <Link href="/siswa" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">{t("reset")}</Link>}
        </form>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-gray-500">{t("statusLabel")}</span>
            {["","aktif","lulus","pindah","keluar","alumni"].map((s) => <Link key={s} href={bld({ status: s })} className={`rounded-full border px-2.5 py-0.5 text-xs ${status===s?"border-gray-900 bg-gray-900 text-white":"border-gray-200 hover:bg-gray-50"}`}>{s===""?t("all"):statusLabel(s)}</Link>)}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{t("genderLabel")}</span>
            {["","L","P"].map((g) => <Link key={g} href={bld({ gender: g })} className={`rounded-full border px-2.5 py-0.5 text-xs ${gender===g?"border-gray-900 bg-gray-900 text-white":"border-gray-200 hover:bg-gray-50"}`}>{g===""?t("all"):g==="L"?t("male"):t("female")}</Link>)}
          </div>
        </div>

        <form className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="q" value={q} /><input type="hidden" name="status" value={status} /><input type="hidden" name="gender" value={gender} />
          <div>
            <label className="block text-xs text-gray-500">{t("fieldRombel")}</label>
            <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={rombelId || ""} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm sm:min-w-[200px]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">{t("fieldAgama")}</label>
            <select name="agama" defaultValue={agama} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">{t("allAgama")}</option>
              {agamaOpts.filter((a)=>a.agama).map((a) => <option key={a.agama} value={a.agama!}>{a.agama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">{t("fieldTahunMasuk")}</label>
            <select name="tahunMasuk" defaultValue={tahunMasuk||""} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">{t("allTahun")}</option>
              {tahunOpts.filter((to)=>to.tahunMasuk).map((to) => <option key={to.tahunMasuk} value={to.tahunMasuk!}>{to.tahunMasuk}</option>)}
            </select>
          </div>
          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">{t("filter")}</button>
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">{t("colNama")}</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">{t("colNisn")}</th>
              <th className="px-4 py-2 font-medium">{t("colJk")}</th>
              <th className="px-4 py-2 font-medium">{t("colKelas")}</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">{t("colAgama")}</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">{t("colMasuk")}</th>
              <th className="px-4 py-2 font-medium">{t("colStatus")}</th>
              <th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t("empty")}</td></tr>}
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <SiswaAvatar namaLengkap={s.namaLengkap} foto={s.foto} size="sm" />
                    <Link href={`/siswa/${s.id}`} className="hover:underline">{s.namaLengkap}</Link>
                  </div>
                </td>
                <td className="hidden px-4 py-2 sm:table-cell"><div className="text-xs text-gray-600">{s.nisn ?? "—"}</div><div className="text-xs text-gray-400">{s.nis ?? ""}</div></td>
                <td className="px-4 py-2">{s.jenisKelamin==="L"?<span className="text-blue-600">♂</span>:s.jenisKelamin==="P"?<span className="text-pink-600">♀</span>:<span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2 text-gray-600">{s.anggotaRombel[0]?.rombel.nama ?? "—"}</td>
                <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">{s.agama ?? "—"}</td>
                <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">{s.tahunMasuk ?? "—"}</td>
                <td className="px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_BADGE[s.status]??STATUS_BADGE.aktif}`}>{statusLabel(s.status)}</span></td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/siswa/${s.id}`} className="text-gray-600 hover:underline">{t("profile")}</Link>
                    <Link href={`/siswa/${s.id}/delete`} className="text-red-600 hover:underline">{t("delete")}</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{t("pageInfo", { page, total: totalPages })}</span>
          <div className="flex gap-2">
            {page>1&&<Link href={bld({page:String(page-1)})} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">{t("prev")}</Link>}
            {page<totalPages&&<Link href={bld({page:String(page+1)})} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">{t("next")}</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
