import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { ConfirmForm } from "@/components/ConfirmForm";
import { toggleUserActive, changeUserRole, resetUserPassword } from "./actions";
import { CreateUserForm } from "./CreateUserForm";

const STAFF_ROLES: Role[] = [
  "admin", "operator", "kepsek", "kurikulum", "kesiswaan", "humas",
  "guru", "walikelas", "bk", "bendahara", "resepsionis", "perpustakaan", "sarpras",
];
const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const roleBadge: Record<string, string> = {
  admin: "bg-red-100 text-red-700", operator: "bg-orange-100 text-orange-700",
  kepsek: "bg-purple-100 text-purple-700", guru: "bg-blue-100 text-blue-700",
  walikelas: "bg-sky-100 text-sky-700", bendahara: "bg-green-100 text-green-700",
  bk: "bg-amber-100 text-amber-700", perpustakaan: "bg-teal-100 text-teal-700",
  sarpras: "bg-lime-100 text-lime-700", kurikulum: "bg-indigo-100 text-indigo-700",
  kesiswaan: "bg-pink-100 text-pink-700", humas: "bg-cyan-100 text-cyan-700",
  resepsionis: "bg-gray-100 text-gray-700",
};

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const sekolahId = await requireModule("pengaturan");
  const t = await getTranslations("pengaturan");
  const tRoles = await getTranslations("roles");
  const me = await getCurrentUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const roleFilter = sp.role ?? "";

  const where: Prisma.UserWhereInput = {
    sekolahId,
    role: roleFilter && STAFF_ROLES.includes(roleFilter as Role)
      ? (roleFilter as Role)
      : { in: STAFF_ROLES },
    ...(q ? { OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [users, roleCounts, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { namaLengkap: "asc" }],
      take: 200,
      select: { id: true, namaLengkap: true, username: true, role: true, isActive: true, lastLoginAt: true, foto: true },
    }),
    prisma.user.groupBy({ by: ["role"], where: { sekolahId, role: { in: STAFF_ROLES } }, _count: { _all: true } }),
    prisma.user.count({ where: { sekolahId, role: { in: STAFF_ROLES } } }),
  ]);

  const countMap = Object.fromEntries(roleCounts.map((c) => [c.role, c._count._all]));
  const roleLabel = (r: string) => { try { return tRoles(r as never); } catch { return r; } };
  const initials = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("usersTitle")}</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString("id-ID")} {t("totalStaff")} · {t("usersSubtitle")}</p>
        </div>
        <Link href="/pengaturan" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">← {t("title")}</Link>
      </div>

      {/* Tambah akun */}
      <CreateUserForm roles={STAFF_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))} />

      {/* Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <input name="q" defaultValue={q} placeholder={t("searchUser")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          </div>
          <select name="role" defaultValue={roleFilter} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
            <option value="">{t("allRoles")}</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)} ({countMap[r] ?? 0})</option>)}
          </select>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">{t("save")}</button>
          {(q || roleFilter) && <Link href="/pengaturan/pengguna" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Reset</Link>}
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("colUser")}</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">{t("colUsername")}</th>
              <th className="px-4 py-3 font-semibold">{t("colRole")}</th>
              <th className="px-4 py-3 font-semibold">{t("colStatus")}</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">{t("colLastLogin")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">{t("emptyUsers")}</td></tr>}
            {users.map((u) => {
              const isSelf = u.id === me.id;
              return (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                        {initials(u.namaLengkap)}
                      </div>
                      <span className="font-medium text-gray-900">{u.namaLengkap}{isSelf && <span className="ml-1 text-xs text-indigo-500">{t("self")}</span>}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs hidden sm:table-cell">{u.username}</td>
                  <td className="px-4 py-2.5">
                    {isSelf ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>{roleLabel(u.role)}</span>
                    ) : (
                      <form action={changeUserRole} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} className="rounded-md border border-gray-300 px-1.5 py-1 text-xs">
                          {STAFF_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                        <button className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">{t("saveRole")}</button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                      {u.isActive ? t("statusActive") : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 hidden lg:table-cell">{fmt(u.lastLoginAt) ?? t("neverLogin")}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Reset password */}
                      <details className="relative">
                        <summary className="cursor-pointer list-none rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">🔑</summary>
                        <form action={resetUserPassword} className="absolute right-0 z-20 mt-1 flex w-56 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                          <input type="hidden" name="id" value={u.id} />
                          <span className="text-xs font-semibold text-gray-700">{t("resetPw")}</span>
                          <input name="newPassword" type="text" required minLength={6} placeholder={t("newPwPlaceholder")}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-gray-900" />
                          <button className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800">{t("save")}</button>
                        </form>
                      </details>
                      {/* Toggle active */}
                      {!isSelf && (
                        <ConfirmForm action={toggleUserActive}
                          message={u.isActive ? `${t("deactivate")} ${u.namaLengkap}?` : `${t("activate")} ${u.namaLengkap}?`}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className={`rounded-md border px-2 py-1 text-xs ${u.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                            {u.isActive ? t("deactivate") : t("activate")}
                          </button>
                        </ConfirmForm>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
