import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getGuruPulse, getGuruGallery } from "./_revamp/listData";
import { GuruSpotlight } from "./_revamp/GuruSpotlight";
import { GuruFlip } from "./_revamp/GuruFlip";
import { GuruBoard } from "./_revamp/GuruBoard";
import "./_revamp/list.css";

const COMP_TONE: Record<string, string> = { PNS: "sky", GTT: "sun", GTY: "lav", PPPK: "mint", HONORER: "peach" };

export default async function GuruListPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sekolahId = await requireModule("guru");
  const t = await getTranslations("guru");
  const sp = await searchParams;
  const filters = {
    q: (sp.q ?? "").trim(), bidang: sp.bidang ?? "", status: (sp.status ?? "").toUpperCase(),
    role: sp.role ?? "", page: Math.max(1, Number(sp.page) || 1), tampil: sp.tampil ?? "aktif",
  };
  const [pulse, gallery, nonaktifCount] = await Promise.all([
    getGuruPulse(sekolahId),
    getGuruGallery(sekolahId, filters),
    prisma.guru.count({ where: { sekolahId, deletedAt: { not: null } } }),
  ]);
  const alerts = [
    { key: "beban", icon: "⚠", tone: "peach", n: pulse.alerts.beban, to: "/guru?role=beban" },
    { key: "jurnal", icon: "📓", tone: "sun", n: pulse.alerts.jurnal, to: "/guru" },
    { key: "ultah", icon: "🎂", tone: "mint", n: pulse.alerts.ultah, to: "/guru" },
    { key: "sertif", icon: "📜", tone: "lav", n: pulse.alerts.sertifikasi, to: "/guru" },
  ];

  return (
    <div id="ak-guru">
      <div className="pulse-row">
        <div className="pulse-card komposisi">
          <div className="pk-head"><span className="pk-eyebrow">{t("pulseEyebrow")}</span><div className="pk-big">{pulse.total}</div></div>
          <h3 className="pk-title">{t("compTitle")}</h3>
          <div className="pk-dna">{pulse.comp.map((c) => <Link key={c.key} href={`/guru?status=${c.key}`} className={`dna ${COMP_TONE[c.key] ?? "sky"}`} style={{ flexGrow: c.count }} aria-label={c.key} />)}</div>
          <div className="pk-stats">
            {pulse.comp.slice(0, 3).map((c) => (
              <Link key={c.key} href={`/guru?status=${c.key}`} className="pk-stat">
                <span className="pk-stat-top"><span className={`dot ${COMP_TONE[c.key] ?? "sky"}`} />{c.key}</span>
                <b>{c.count}<small>/{pulse.total}</small></b>
                <span className="pk-stat-pct">{c.pct}%</span>
              </Link>
            ))}
          </div>
        </div>

        <GuruSpotlight pool={pulse.spotlight} />

        <div className="pulse-card perlu">
          <span className="pk-eyebrow">{t("perluEyebrow")}</span>
          <h3 className="pk-title">{t("perluTitle", { n: alerts.filter((a) => a.n > 0).length })}</h3>
          <div className="perlu-list">
            {alerts.map((a) => (
              <Link key={a.key} href={a.to} className="perlu-item">
                <span className={`pi-ic ${a.tone}`}>{a.icon}</span>
                <div className="pi-txt"><b>{t(`alert_${a.key}`)}</b><span>{t(`alertSub_${a.key}`)}</span></div>
                <span className="pi-n">{a.n}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <GuruFlip flip={pulse.flip} />

      <GuruBoard cards={gallery.cards} total={gallery.total} totalPage={gallery.totalPage} pulse={pulse} filters={filters} tampil={filters.tampil} aktifCount={pulse.total} nonaktifCount={nonaktifCount} />
    </div>
  );
}
