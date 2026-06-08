import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { LogDetail } from "./LogDetail";

const PAGE_SIZE = 50;

const STATUS_CLS: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

export default async function EmailLogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; key?: string }>;
}) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const t = await getTranslations("pengaturan");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const statusFilter = sp.status ?? "";
  const keyFilter = sp.key ?? "";

  const where = {
    sekolahId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(keyFilter ? { templateKey: keyFilter } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.emailLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const templateKeys = await prisma.emailTemplate.findMany({ where: { sekolahId: null }, select: { key: true, name: true }, orderBy: { key: "asc" } });

  function pageUrl(p: number) {
    const q = new URLSearchParams({ ...(statusFilter && { status: statusFilter }), ...(keyFilter && { key: keyFilter }), page: String(p) });
    return `?${q}`;
  }

  const statusLabel: Record<string, string> = {
    sent: t("emailLogSent"),
    failed: t("emailLogFailed"),
    pending: t("emailLogPending"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("emailLogTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("emailLogSubtitle", { count: total.toLocaleString("id-ID") })}</p>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
          <option value="">{t("emailLogAllStatus")}</option>
          <option value="sent">{t("emailLogSent")}</option>
          <option value="failed">{t("emailLogFailed")}</option>
          <option value="pending">{t("emailLogPending")}</option>
        </select>
        <select name="key" defaultValue={keyFilter} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
          <option value="">{t("emailLogAllTemplate")}</option>
          {templateKeys.map((tpl) => (
            <option key={tpl.key} value={tpl.key}>{tpl.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("emailLogFilterBtn")}</button>
        {(statusFilter || keyFilter) && (
          <a href="/pengaturan/email/log" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("emailLogResetBtn")}</a>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailLogColTime")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailLogColTemplate")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailLogColRecipient")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("emailLogColStatus")}</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 truncate max-w-[200px]">{log.subject}</p>
                  {log.templateKey && <code className="text-xs text-gray-400">{log.templateKey}</code>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-800">{log.toEmail}</p>
                  {log.toName && <p className="text-xs text-gray-400">{log.toName}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[log.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[log.status] ?? log.status}
                  </span>
                  {log.errorMsg && <p className="mt-1 text-xs text-red-500 max-w-[160px] truncate" title={log.errorMsg}>{log.errorMsg}</p>}
                </td>
                <td className="px-2 py-3">
                  <LogDetail log={{ id: log.id, subject: log.subject, bodyHtml: log.bodyHtml, errorMsg: log.errorMsg, status: log.status }} />
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">{t("emailLogEmpty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && <a href={pageUrl(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">{t("emailLogPrev")}</a>}
          <span className="text-gray-500">{t("emailLogPage", { page, total: totalPages })}</span>
          {page < totalPages && <a href={pageUrl(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">{t("emailLogNext")}</a>}
        </div>
      )}
    </div>
  );
}
