"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { GuruCard, GuruPulse, GalleryFilters } from "./listData";

const BIDANG_ICON: Record<string, string> = { MIPA: "🔬", Bahasa: "📖", IPS: "🌍", Seni: "🎨", PJOK: "⚽", Agama: "🕌", TU: "🗂" };
const STATUS_TONE: Record<string, string> = { PNS: "sky", GTT: "sun", GTY: "lav", PPPK: "mint", HONORER: "peach" };

export function GuruBoard({ cards, total, totalPage, pulse, filters, tampil, aktifCount, nonaktifCount }: {
  cards: GuruCard[]; total: number; totalPage: number; pulse: GuruPulse;
  filters: GalleryFilters; tampil: string; aktifCount: number; nonaktifCount: number;
}) {
  const t = useTranslations("guru");
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const nf = (n: number) => n.toLocaleString(locale);

  function href(o: Partial<GalleryFilters & { tampil: string }>) {
    const p = new URLSearchParams();
    const m = { q: filters.q, bidang: filters.bidang, status: filters.status, role: filters.role, page: filters.page, tampil, ...o };
    if (m.q) p.set("q", String(m.q));
    if (m.bidang) p.set("bidang", String(m.bidang));
    if (m.status) p.set("status", String(m.status));
    if (m.role) p.set("role", String(m.role));
    if (m.tampil && m.tampil !== "aktif") p.set("tampil", String(m.tampil));
    if (m.page && Number(m.page) > 1) p.set("page", String(m.page));
    const s = p.toString();
    return `/guru${s ? `?${s}` : ""}`;
  }
  useEffect(() => {
    if (q === filters.q) return;
    const id = setTimeout(() => router.push(href({ q, page: 1 })), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const chip = (label: string, count: number | null, active: boolean, to: string, tone?: string) => (
    <Link href={to} className={`g-chip${active ? " on" : ""}${tone ? ` ${tone}` : ""}`}>{label}{count != null && <b>{count}</b>}</Link>
  );

  return (
    <div className="g-board">
      <div className="g-toolbar">
        <div className="g-search">
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="4.5" /><path d="M9.2 9.2L12.5 12.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder2")} onKeyDown={(e) => { if (e.key === "Enter") router.push(href({ q, page: 1 })); }} />
        </div>
        <div className="g-tampil">
          <Link href={href({ tampil: "aktif", page: 1 })} className={tampil !== "nonaktif" ? "on" : ""}>{t("tabAktif")} <b>{aktifCount}</b></Link>
          <Link href={href({ tampil: "nonaktif", page: 1 })} className={tampil === "nonaktif" ? "on" : ""}>{t("tabNonaktif")} <b>{nonaktifCount}</b></Link>
        </div>
        <div className="g-view">
          <button className={view === "gallery" ? "on" : ""} onClick={() => setView("gallery")} aria-label="Galeri">▦</button>
          <button className={view === "table" ? "on" : ""} onClick={() => setView("table")} aria-label="Tabel">≣</button>
        </div>
        <Link href="/guru/new" className="g-add">+ {t("addGuru")}</Link>
      </div>

      <div className="g-chips">
        {chip(t("chipSemua"), pulse.total, !filters.status && !filters.bidang && !filters.role, href({ status: "", bidang: "", role: "", page: 1 }))}
        {pulse.comp.map((c) => chip(c.key, c.count, filters.status === c.key, href({ status: filters.status === c.key ? "" : c.key, page: 1 }), STATUS_TONE[c.key]))}
        <span className="g-chip-sep" />
        {pulse.chips.bidang.map((b) => chip(`${BIDANG_ICON[b.key] ?? ""} ${b.key}`, b.count, filters.bidang === b.key, href({ bidang: filters.bidang === b.key ? "" : b.key, page: 1 }), "soft"))}
        <span className="g-chip-sep" />
        {chip(`👪 ${t("chipWali")}`, pulse.chips.wali, filters.role === "wali", href({ role: filters.role === "wali" ? "" : "wali", page: 1 }), "mint")}
        {chip(`🎓 ${t("chipS2")}`, pulse.chips.s2, filters.role === "s2", href({ role: filters.role === "s2" ? "" : "s2", page: 1 }), "lav")}
        {pulse.chips.beban > 0 && chip(`⚠ ${t("chipBeban")}`, pulse.chips.beban, filters.role === "beban", href({ role: filters.role === "beban" ? "" : "beban", page: 1 }), "peach")}
      </div>

      <div className="g-count"><span>{t("showing", { n: cards.length, total })}</span><span className="hint">{t("hoverHint")}</span></div>

      {cards.length === 0 ? <div className="g-empty">{t("noData")}</div> : view === "gallery" ? (
        <div className="g-gallery">
          {cards.map((c) => (
            <Link key={c.id} href={`/guru/${c.id}`} className="g-card">
              <span className={`g-accent ${STATUS_TONE[c.status] ?? "sky"}`} />
              <div className="g-card-head">
                <div className="g-av">{c.foto ? <img src={c.foto} alt="" /> : c.inisial}<span className="g-dot" /></div>
                <div className="g-id"><div className="g-nama">{c.nama}</div><div className="g-role">{c.role} · {c.bidang}</div></div>
              </div>
              <div className="g-tags">
                <span className={`gt ${STATUS_TONE[c.status] ?? "sky"}`}>{c.status}</span>
                {c.isKepsek && <span className="gt gold">★ Kepsek</span>}
                {c.isWali && c.waliKelas && <span className="gt mint">{t("waliShort")} {c.waliKelas}</span>}
                {c.isS2 && <span className="gt lav">S2</span>}
                {c.hasSertif && <span className="gt">✓ {t("sertifShort")}</span>}
              </div>
              <div className="g-meta">{t("mengajarMeta", { kelas: c.kelasCount, thn: c.masaKerja })}</div>
              <div className="g-beban">
                <div className="g-beban-bar"><i className={c.bebanStatus} style={{ width: `${Math.min(100, (c.beban / 24) * 100)}%` }} /></div>
                <div className="g-beban-lbl"><span>{t("bebanJam", { n: c.beban })}</span><b className={c.bebanStatus}>{t(`beban_${c.bebanStatus}`)}</b></div>
              </div>
              <div className="g-metrics">
                <div><b>{c.jurnalPct ?? "—"}{c.jurnalPct != null ? "%" : ""}</b><span>{t("mJurnal")}</span></div>
                <div><b>{c.hadirPct ?? "—"}{c.hadirPct != null ? "%" : ""}</b><span>{t("mHadir")}</span></div>
                <div><b>★ {c.evalRate ?? "—"}</b><span>{t("mEval")}</span></div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="g-table">
          <div className="g-tr g-th"><span>{t("colNama")}</span><span>{t("colStatus")}</span><span>{t("colBeban")}</span><span>{t("mJurnal")}</span><span>{t("mHadir")}</span><span>{t("mEval")}</span></div>
          {cards.map((c) => (
            <Link key={c.id} href={`/guru/${c.id}`} className="g-tr">
              <span className="g-tnama"><span className={`g-tav ${STATUS_TONE[c.status] ?? "sky"}`}>{c.inisial}</span><span><b>{c.nama}</b><i>{c.role}</i></span></span>
              <span><span className={`gt ${STATUS_TONE[c.status] ?? "sky"}`}>{c.status}</span></span>
              <span className={c.bebanStatus}>{c.beban} {t("jamShort")}</span>
              <span>{c.jurnalPct ?? "—"}{c.jurnalPct != null ? "%" : ""}</span>
              <span>{c.hadirPct ?? "—"}{c.hadirPct != null ? "%" : ""}</span>
              <span>★ {c.evalRate ?? "—"}</span>
            </Link>
          ))}
        </div>
      )}

      {totalPage > 1 && (
        <div className="g-pager">
          <Link href={href({ page: Math.max(1, filters.page - 1) })} className={`g-pg${filters.page <= 1 ? " dis" : ""}`}>← {t("prev")}</Link>
          {Array.from({ length: totalPage }, (_, i) => i + 1).map((p) => <Link key={p} href={href({ page: p })} className={`g-pg${p === filters.page ? " on" : ""}`}>{nf(p)}</Link>)}
          <Link href={href({ page: Math.min(totalPage, filters.page + 1) })} className={`g-pg${filters.page >= totalPage ? " dis" : ""}`}>{t("nextPage")} →</Link>
        </div>
      )}
    </div>
  );
}
