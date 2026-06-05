import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function PengaturanPage() {
  const t = await getTranslations("pengaturan");
  const MENU = [
    { href: "/pengaturan/sekolah", icon: "🏫", title: t("menuSekolahTitle"), desc: t("menuSekolahDesc") },
    { href: "/pengaturan/akademik", icon: "📅", title: t("menuAkademikTitle"), desc: t("menuAkademikDesc") },
    { href: "/pengaturan/pengguna", icon: "👥", title: t("menuPenggunaTitle"), desc: t("menuPenggunaDesc") },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
