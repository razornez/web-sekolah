import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";

export default async function EmailLandingPage() {
  await requireModule("pengaturan");
  const t = await getTranslations("pengaturan");

  const MENU = [
    { href: "/pengaturan/email/config", icon: "⚙️", title: t("emailMenuConfigTitle"), desc: t("emailMenuConfigDesc") },
    { href: "/pengaturan/email/template", icon: "📝", title: t("emailMenuTemplateTitle"), desc: t("emailMenuTemplateDesc") },
    { href: "/pengaturan/email/log", icon: "📋", title: t("emailMenuLogTitle"), desc: t("emailMenuLogDesc") },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("emailTitle")}</h1>
        <p className="text-sm text-gray-500">{t("emailSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">{m.icon}</div>
            <div className="font-semibold text-gray-900 group-hover:text-indigo-700">{m.title}</div>
            <p className="mt-1 text-xs text-gray-500">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
