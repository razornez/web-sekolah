"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import "./siswa.css";
import { SiswaMiniGame } from "./SiswaMiniGame";
import type { SiswaPulse, SiswaGallery, Bday } from "./listData";

const JENJANG_COLOR = ["var(--ak-primary)", "var(--ak-lav-deep)", "var(--ak-primary-glow)", "var(--ak-sky-deep)", "var(--ak-mint-deep)"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type Filters = { q: string; status: string; jenjang: string; gender: string; flag: string; view: string; page: number };

export function SiswaListBoard({ pulse, gallery, filters }: { pulse: SiswaPulse; gallery: SiswaGallery; filters: Filters }) {
  const router = useRouter();
  const t = useTranslations("siswa");
  const locale = useLocale();
  const [view, setView] = useState(filters.view === "table" ? "table" : "gallery");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [q, setQ] = useState(filters.q);
  const nf = (n: number) => n.toLocaleString(locale);

  // Pencarian real-time (debounce 450ms) — navigasi query-only, tak munculkan overlay.
  useEffect(() => {
    if (q === filters.q) return;
    const id = setTimeout(() => router.push(href({ q, page: 1 })), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function href(o: Partial<Record<string, string | number>>) {
    const m: Record<string, string> = { q: filters.q, status: filters.status, jenjang: filters.jenjang, gender: filters.gender, flag: filters.flag, view, page: String(filters.page) };
    for (const [k, v] of Object.entries(o)) m[k] = v == null ? "" : String(v);
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(m)) {
      if (!v) continue;
      if (k === "page" && v === "1") continue;
      if (k === "view" && v === "gallery") continue;
      p.set(k, v);
    }
    const s = p.toString();
    return `/siswa${s ? `?${s}` : ""}`;
  }
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); router.push(href({ q, page: 1 })); };
  const toggleSel = (id: number) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bdayWhen = (b: Bday) => b.diff === 0 ? t("list.bdayToday") : b.diff === 1 ? t("list.bdayTomorrow") : new Date(b.dateISO).toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "short" });

  const j = pulse.jenjang;
  const sumJ = j.reduce((a, b) => a + b.count, 0) || 1;
  const activeJ = j.findIndex((seg) => seg.nama === filters.jenjang);
  const focusJenjang = (nama: string) => router.push(href({ jenjang: filters.jenjang === nama ? "" : nama, page: 1 }));
  const QF = (key: string, val: string) => (filters.status === val && key === "status") || (filters.gender === val && key === "gender") || (filters.flag === val && key === "flag");
  const none = !filters.status && !filters.gender && !filters.flag;

  return (
    <div id="ak-siswa">
      {/* PULSE */}
      <section className="pulse">
        <div className="pulse-main">
          <div className="pulse-h">
            <div><div className="ttl">{t("list.pulseEyebrow")}</div><h2>{t("list.pulseHeading")}</h2></div>
            <div className="total"><div className="n">{nf(pulse.total)}</div>{pulse.growthMonth > 0 && <div className="sub">{t("list.growthMonth", { n: pulse.growthMonth })}</div>}</div>
          </div>
          <div className="dna-row">
            <div className="dna-bar">
              {j.map((seg, i) => (
                <button key={seg.nama} className={`dna-seg${activeJ === i ? " active" : ""}`} style={{ flexGrow: seg.count, background: JENJANG_COLOR[i % JENJANG_COLOR.length] }} onClick={() => focusJenjang(seg.nama)} aria-label={t("list.kelasLabel", { nama: seg.nama })} />
              ))}
            </div>
          </div>
          <div className="dna-stats">
            {j.map((seg, i) => (
              <button key={seg.nama} className={`ds${activeJ === i ? " active" : ""}`} onClick={() => focusJenjang(seg.nama)}>
                <div className="ds-lbl"><span className="dot" style={{ background: JENJANG_COLOR[i % JENJANG_COLOR.length] }} />{t("list.kelasLabel", { nama: seg.nama })}</div>
                <div className="ds-v">{nf(seg.count)}<small>{t("list.siswaUnit")}</small></div>
                <div className="ds-pct">{t("list.dsPct", { pct: Math.round((seg.count / sumJ) * 100), rombel: seg.rombel, l: seg.l, p: seg.p })}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pulse-card bday">
          <div className="pc-h"><div><div className="lbl lbl-d">{t("list.bdayEyebrow")}</div><h3>{t("list.bdayHeading", { n: pulse.birthdays.length })}</h3></div><span className="emoji">🎉</span></div>
          <div className="bday-list">
            {pulse.birthdays.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(26,24,48,0.55)", fontWeight: 600, padding: "8px" }}>{t("list.bdayEmpty")}</div>}
            {pulse.birthdays.map((b) => (
              <Link key={b.id} href={`/siswa/${b.id}`} className={`bday-row${b.diff === 0 ? " today" : ""}`}>
                <div className="bday-av">{b.inisial}</div>
                <div className="bday-info"><div className="nm">{b.nama}</div><div className="s">{b.kelas} · {bdayWhen(b)}</div></div>
                <span className="bday-wa" title={t("list.bdayWaTitle")}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M6.5 1 A5 5 0 0 0 2 8.5 L1.5 11.5 L4.5 11 A5 5 0 1 0 6.5 1 Z" /></svg></span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pulse-card alerts">
          <div className="pc-h"><div><div className="lbl">{t("list.alertsEyebrow")}</div><h3>{t("list.alertsHeading")}</h3></div><span className="emoji" style={{ filter: "none", fontSize: 22 }}>🔍</span></div>
          <div className="alert-list">
            <Link href="/absensi" className="alert-row"><div className="alert-ic peach">⚠</div><div className="alert-info"><div className="t">{t("list.alertAlpa")}</div><div className="s">{t("list.alertAlpaSub")}</div></div><span className="count">{pulse.alerts.alpa}</span></Link>
            <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className="alert-row"><div className="alert-ic sun">📷</div><div className="alert-info"><div className="t">{t("list.alertFoto")}</div><div className="s">{t("list.alertFotoSub")}</div></div><span className="count">{pulse.alerts.noFoto}</span></Link>
            <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className="alert-row"><div className="alert-ic peach">📋</div><div className="alert-info"><div className="t">{t("list.alertNik")}</div><div className="s">{t("list.alertNikSub")}</div></div><span className="count">{pulse.alerts.nikIncomplete}</span></Link>
            <Link href="/spp" className="alert-row"><div className="alert-ic pink">💔</div><div className="alert-info"><div className="t">{t("list.alertSpp")}</div><div className="s">{t("list.alertSppSub")}</div></div><span className="count">{pulse.alerts.sppNunggak}</span></Link>
          </div>
        </div>
      </section>

      <SiswaMiniGame game={pulse.game} />

      {/* TOOLBAR */}
      <div className="toolbar">
        <form className="search-box" onSubmit={submitSearch}>
          <svg className="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="M11 11 L14.5 14.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("list.searchPh")} />
        </form>
        <div className="toolbar-pill">
          <span className="lbl">{t("list.jenjangLabel")}</span>
          <Link href={href({ jenjang: "", page: 1 })} className={!filters.jenjang ? "active" : ""}>{t("list.all")}</Link>
          {j.map((seg) => <Link key={seg.nama} href={href({ jenjang: seg.nama, page: 1 })} className={filters.jenjang === seg.nama ? "active" : ""}>{seg.nama}</Link>)}
        </div>
        <div className="toolbar-pill">
          <span className="lbl">{t("list.viewLabel")}</span>
          <button className={view === "gallery" ? "active" : ""} onClick={() => setView("gallery")} title={t("list.viewGallery")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="4" height="4" rx="1" /><rect x="8" y="2" width="4" height="4" rx="1" /><rect x="2" y="8" width="4" height="4" rx="1" /><rect x="8" y="8" width="4" height="4" rx="1" /></svg>
          </button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title={t("list.viewTable")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4 L12 4 M2 8 L12 8 M2 12 L12 12" /></svg>
          </button>
        </div>
        <Link href="/siswa/new" className="add-btn"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 2 L7 12 M2 7 L12 7" /></svg>{t("list.tambahSiswa")}</Link>
      </div>

      {/* QUICK FILTERS */}
      <div className="quick-filters">
        <Link href={href({ status: "", gender: "", flag: "", page: 1 })} className={`qf${none ? " active" : ""}`}>{t("list.qfSemua")} <span className="count">{nf(pulse.quick.semua)}</span></Link>
        <Link href={href({ status: "aktif", gender: "", flag: "", page: 1 })} className={`qf mint${QF("status", "aktif") ? " active" : ""}`}>{t("statusAktif")} <span className="count">{nf(pulse.quick.aktif)}</span></Link>
        <Link href={href({ status: "lulus", gender: "", flag: "", page: 1 })} className={`qf sky${QF("status", "lulus") ? " active" : ""}`}>{t("statusLulus")} <span className="count">{nf(pulse.quick.lulus)}</span></Link>
        <Link href={href({ status: "pindah", gender: "", flag: "", page: 1 })} className={`qf sun${QF("status", "pindah") ? " active" : ""}`}>{t("statusPindah")} <span className="count">{nf(pulse.quick.pindah)}</span></Link>
        <Link href={href({ status: "alumni", gender: "", flag: "", page: 1 })} className={`qf lav${QF("status", "alumni") ? " active" : ""}`}>{t("statusAlumni")} <span className="count">{nf(pulse.quick.alumni)}</span></Link>
        <span className="qf-sep" />
        <Link href={href({ gender: "L", status: "", flag: "", page: 1 })} className={`qf${QF("gender", "L") ? " active" : ""}`}>{t("list.qfLaki")} <span className="count">{nf(pulse.quick.L)}</span></Link>
        <Link href={href({ gender: "P", status: "", flag: "", page: 1 })} className={`qf${QF("gender", "P") ? " active" : ""}`}>{t("list.qfPerempuan")} <span className="count">{nf(pulse.quick.P)}</span></Link>
        <span className="qf-sep" />
        <span className="qf pink">{t("list.qfUlangTahun")} <span className="count">{pulse.quick.bdayMonth}</span></span>
        <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className={`qf peach${QF("flag", "perlu") ? " active" : ""}`}>{t("list.qfPerluData")} <span className="count">{pulse.quick.perluData}</span></Link>
      </div>

      {/* VIEW */}
      <div className="view-wrap">
        <div className="view-h">
          <div className="meta">{t("list.viewShowing", { shown: gallery.cards.length, total: nf(gallery.totalFiltered) })}</div>
          <div className="meta">{t("list.viewHint")}</div>
        </div>

        {gallery.cards.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--ak-muted)", fontSize: 13, padding: "32px 0" }}>{t("list.noMatch")}</p>
        ) : view === "gallery" ? (
          <div className="gallery">
            {gallery.cards.map((c) => (
              <div key={c.id} className={`card-siswa${sel.has(c.id) ? " selected" : ""}`} onClick={() => router.push(`/siswa/${c.id}`)}>
                <button className="card-check" onClick={(e) => { e.stopPropagation(); toggleSel(c.id); }} aria-label={t("list.selectAria")}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 5 L4 7 L8 3" /></svg>
                </button>
                <div className={`card-photo ${c.color}`}>
                  {c.bdayToday && <span className="bday-badge">{t("list.bdayBadge")}</span>}
                  {c.nama.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  {c.jk && <span className="jk">{c.jk === "P" ? "♀" : "♂"}</span>}
                </div>
                <div className="card-name">{c.nama}</div>
                <div className="card-sub"><span>NISN {c.nisn}</span><span className="kelas">{c.kelas}</span></div>
                <div className="card-tags">{c.tags.map((tg, i) => <span key={i} className={`card-tag ${tg.tone}`}>{tg.label}</span>)}</div>
                <div className="card-stats">
                  <div className={`cs${c.rata != null ? " good" : ""}`}><div className="v">{c.rata ?? "—"}</div><div className="l">{t("list.statRata")}</div></div>
                  <div className={`cs${c.hadir != null ? (c.hadir >= 85 ? " good" : " warn") : ""}`}><div className="v">{c.hadir != null ? `${c.hadir}%` : "—"}</div><div className="l">{t("list.statHadir")}</div></div>
                  <div className={`cs${c.sppOk === false ? " warn" : c.sppOk ? " good" : ""}`}><div className="v">{c.sppOk == null ? "—" : c.sppOk ? "✓" : "⚠"}</div><div className="l">{t("list.statSpp")}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="siswa-table">
            <thead><tr><th>{t("list.colSiswa")}</th><th>{t("list.colKelas")}</th><th>{t("list.colStatus")}</th><th>{t("list.colJk")}</th><th>{t("list.statRata")}</th><th>{t("list.statHadir")}</th><th></th></tr></thead>
            <tbody>
              {gallery.cards.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/siswa/${c.id}`)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="row-name">
                      <div className={`row-av ${c.color}`}>{c.nama.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}</div>
                      <div><div className="nn">{c.nama}</div><div className="nis">NISN {c.nisn}</div></div>
                    </div>
                  </td>
                  <td>{c.kelas}</td>
                  <td><span className={`row-status ${c.status}`}>{t(`status${cap(c.status)}`)}</span></td>
                  <td><span className={c.jk === "P" ? "row-jk-p" : "row-jk-l"}>{c.jk === "P" ? "♀" : "♂"}</span></td>
                  <td style={{ fontWeight: 800, color: "var(--ak-ink)" }}>{c.rata ?? "—"}</td>
                  <td style={{ fontWeight: 700, color: c.hadir != null && c.hadir < 85 ? "var(--ak-peach-deep)" : "var(--ak-mint-deep)" }}>{c.hadir != null ? `${c.hadir}%` : "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <Link href={`/siswa/${c.id}`} className="detail">{t("list.rowProfil")}</Link>
                      <Link href={`/siswa/${c.id}/rapor`} className="wa">{t("list.rowRapor")}</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        {gallery.totalPages > 1 && (
          <div className="pagination">
            <div className="info">{t("list.pageInfo", { page: filters.page, total: gallery.totalPages })}</div>
            <div className="nav">
              {filters.page > 1 ? <Link href={href({ page: filters.page - 1 })}>{t("list.prev")}</Link> : <span className="dis">{t("list.prev")}</span>}
              {Array.from({ length: Math.min(5, gallery.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(filters.page - 2, gallery.totalPages - 4));
                const pg = start + i;
                return pg <= gallery.totalPages ? <Link key={pg} href={href({ page: pg })} className={pg === filters.page ? "active" : ""}>{pg}</Link> : null;
              })}
              {filters.page < gallery.totalPages ? <Link href={href({ page: filters.page + 1 })}>{t("list.next")}</Link> : <span className="dis">{t("list.next")}</span>}
            </div>
          </div>
        )}
      </div>

      {/* BULK BAR */}
      <div className={`bulk-bar${sel.size > 0 ? " show" : ""}`}>
        <span className="ct">{t("list.bulkSelected", { n: sel.size })}</span>
        <span className="sep" />
        <button onClick={() => alert(t("list.bulkBroadcastAlert"))}>{t("list.bulkBroadcast")}</button>
        <button onClick={() => alert(t("list.bulkKartuAlert"))}>{t("list.bulkKartu")}</button>
        <button onClick={() => setSel(new Set())}>{t("list.bulkCancel")}</button>
      </div>
    </div>
  );
}
