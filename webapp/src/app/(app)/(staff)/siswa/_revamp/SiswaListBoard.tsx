"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./siswa.css";
import { SiswaMiniGame } from "./SiswaMiniGame";
import type { SiswaPulse, SiswaGallery } from "./listData";

const JENJANG_COLOR = ["var(--ak-primary)", "var(--ak-lav-deep)", "var(--ak-primary-glow)", "var(--ak-sky-deep)", "var(--ak-mint-deep)"];
type Filters = { q: string; status: string; jenjang: string; gender: string; flag: string; view: string; page: number };

export function SiswaListBoard({ pulse, gallery, filters }: { pulse: SiswaPulse; gallery: SiswaGallery; filters: Filters }) {
  const router = useRouter();
  const [view, setView] = useState(filters.view === "table" ? "table" : "gallery");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [activeJ, setActiveJ] = useState(0);
  const [q, setQ] = useState(filters.q);

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

  const j = pulse.jenjang;
  const sumJ = j.reduce((a, b) => a + b.count, 0) || 1;
  const QF = (key: string, val: string) => (filters.status === val && key === "status") || (filters.gender === val && key === "gender") || (filters.flag === val && key === "flag");
  const none = !filters.status && !filters.gender && !filters.flag;

  return (
    <div id="ak-siswa">
      {/* PULSE */}
      <section className="pulse">
        <div className="pulse-main">
          <div className="pulse-h">
            <div><div className="ttl">Pulse Siswa</div><h2>Komposisi hidup hari ini</h2></div>
            <div className="total"><div className="n">{pulse.total.toLocaleString("id-ID")}</div>{pulse.growthMonth > 0 && <div className="sub">↑ +{pulse.growthMonth} bulan ini</div>}</div>
          </div>
          <div className="dna-row">
            <div className="dna-bar">
              {j.map((seg, i) => (
                <button key={seg.nama} className={`dna-seg${activeJ === i ? " active" : ""}`} style={{ flexGrow: seg.count, background: JENJANG_COLOR[i % JENJANG_COLOR.length] }} onClick={() => setActiveJ(i)} aria-label={`Kelas ${seg.nama}`} />
              ))}
            </div>
          </div>
          <div className="dna-stats">
            {j.map((seg, i) => (
              <button key={seg.nama} className={`ds${activeJ === i ? " active" : ""}`} onClick={() => setActiveJ(i)}>
                <div className="ds-lbl"><span className="dot" style={{ background: JENJANG_COLOR[i % JENJANG_COLOR.length] }} />Kelas {seg.nama}</div>
                <div className="ds-v">{seg.count.toLocaleString("id-ID")}<small>siswa</small></div>
                <div className="ds-pct">{Math.round((seg.count / sumJ) * 100)}% · {seg.rombel} rombel · L {seg.l} / P {seg.p}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pulse-card bday">
          <div className="pc-h"><div><div className="lbl lbl-d">Minggu ini ada</div><h3>{pulse.birthdays.length} siswa ulang tahun 🎂</h3></div><span className="emoji">🎉</span></div>
          <div className="bday-list">
            {pulse.birthdays.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(26,24,48,0.55)", fontWeight: 600, padding: "8px" }}>Tidak ada yang ulang tahun minggu ini.</div>}
            {pulse.birthdays.map((b) => (
              <Link key={b.id} href={`/siswa/${b.id}`} className={`bday-row${b.today ? " today" : ""}`}>
                <div className="bday-av">{b.inisial}</div>
                <div className="bday-info"><div className="nm">{b.nama}</div><div className="s">{b.kelas} · {b.when}</div></div>
                <span className="bday-wa" title="Ucapkan via WA"><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M6.5 1 A5 5 0 0 0 2 8.5 L1.5 11.5 L4.5 11 A5 5 0 1 0 6.5 1 Z" /></svg></span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pulse-card alerts">
          <div className="pc-h"><div><div className="lbl">Perlu Perhatian</div><h3>Beberapa hal di data siswa</h3></div><span className="emoji" style={{ filter: "none", fontSize: 22 }}>🔍</span></div>
          <div className="alert-list">
            <Link href="/absensi" className="alert-row"><div className="alert-ic peach">⚠</div><div className="alert-info"><div className="t">Alpa 3 hari berturut</div><div className="s">Perlu di-follow-up dengan wali</div></div><span className="count">{pulse.alerts.alpa}</span></Link>
            <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className="alert-row"><div className="alert-ic sun">📷</div><div className="alert-info"><div className="t">Belum upload foto</div><div className="s">Untuk kartu pelajar</div></div><span className="count">{pulse.alerts.noFoto}</span></Link>
            <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className="alert-row"><div className="alert-ic peach">📋</div><div className="alert-info"><div className="t">NIK belum lengkap</div><div className="s">Wajib untuk Dapodik</div></div><span className="count">{pulse.alerts.nikIncomplete}</span></Link>
            <Link href="/spp" className="alert-row"><div className="alert-ic pink">💔</div><div className="alert-info"><div className="t">SPP nunggak ≥2 bulan</div><div className="s">Butuh disapa hangat</div></div><span className="count">{pulse.alerts.sppNunggak}</span></Link>
          </div>
        </div>
      </section>

      <SiswaMiniGame game={pulse.game} />

      {/* TOOLBAR */}
      <div className="toolbar">
        <form className="search-box" onSubmit={submitSearch}>
          <svg className="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="M11 11 L14.5 14.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, NISN, NIS, atau no induk…" />
        </form>
        <div className="toolbar-pill">
          <span className="lbl">Jenjang</span>
          <Link href={href({ jenjang: "", page: 1 })} className={!filters.jenjang ? "active" : ""}>Semua</Link>
          {j.map((seg) => <Link key={seg.nama} href={href({ jenjang: seg.nama, page: 1 })} className={filters.jenjang === seg.nama ? "active" : ""}>{seg.nama}</Link>)}
        </div>
        <div className="toolbar-pill">
          <span className="lbl">Lihat</span>
          <button className={view === "gallery" ? "active" : ""} onClick={() => setView("gallery")} title="Galeri">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="4" height="4" rx="1" /><rect x="8" y="2" width="4" height="4" rx="1" /><rect x="2" y="8" width="4" height="4" rx="1" /><rect x="8" y="8" width="4" height="4" rx="1" /></svg>
          </button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Daftar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4 L12 4 M2 8 L12 8 M2 12 L12 12" /></svg>
          </button>
        </div>
        <Link href="/siswa/new" className="add-btn"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 2 L7 12 M2 7 L12 7" /></svg>Tambah Siswa</Link>
      </div>

      {/* QUICK FILTERS */}
      <div className="quick-filters">
        <Link href={href({ status: "", gender: "", flag: "", page: 1 })} className={`qf${none ? " active" : ""}`}>Semua siswa <span className="count">{pulse.quick.semua.toLocaleString("id-ID")}</span></Link>
        <Link href={href({ status: "aktif", gender: "", flag: "", page: 1 })} className={`qf mint${QF("status", "aktif") ? " active" : ""}`}>Aktif <span className="count">{pulse.quick.aktif.toLocaleString("id-ID")}</span></Link>
        <Link href={href({ status: "lulus", gender: "", flag: "", page: 1 })} className={`qf sky${QF("status", "lulus") ? " active" : ""}`}>Lulus <span className="count">{pulse.quick.lulus.toLocaleString("id-ID")}</span></Link>
        <Link href={href({ status: "pindah", gender: "", flag: "", page: 1 })} className={`qf sun${QF("status", "pindah") ? " active" : ""}`}>Pindah <span className="count">{pulse.quick.pindah.toLocaleString("id-ID")}</span></Link>
        <Link href={href({ status: "alumni", gender: "", flag: "", page: 1 })} className={`qf lav${QF("status", "alumni") ? " active" : ""}`}>Alumni <span className="count">{pulse.quick.alumni.toLocaleString("id-ID")}</span></Link>
        <span className="qf-sep" />
        <Link href={href({ gender: "L", status: "", flag: "", page: 1 })} className={`qf${QF("gender", "L") ? " active" : ""}`}>♂ Laki-laki <span className="count">{pulse.quick.L.toLocaleString("id-ID")}</span></Link>
        <Link href={href({ gender: "P", status: "", flag: "", page: 1 })} className={`qf${QF("gender", "P") ? " active" : ""}`}>♀ Perempuan <span className="count">{pulse.quick.P.toLocaleString("id-ID")}</span></Link>
        <span className="qf-sep" />
        <span className="qf pink">🎂 Ulang tahun bulan ini <span className="count">{pulse.quick.bdayMonth}</span></span>
        <Link href={href({ flag: "perlu", status: "", gender: "", page: 1 })} className={`qf peach${QF("flag", "perlu") ? " active" : ""}`}>⚠ Perlu data lengkap <span className="count">{pulse.quick.perluData}</span></Link>
      </div>

      {/* VIEW */}
      <div className="view-wrap">
        <div className="view-h">
          <div className="meta">Menampilkan <b>{gallery.cards.length} dari {gallery.totalFiltered.toLocaleString("id-ID")}</b> siswa · diurutkan <b>nama A–Z</b></div>
          <div className="meta">Klik kartu untuk profil · kotak centang untuk pilih</div>
        </div>

        {gallery.cards.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--ak-muted)", fontSize: 13, padding: "32px 0" }}>Tidak ada siswa yang cocok.</p>
        ) : view === "gallery" ? (
          <div className="gallery">
            {gallery.cards.map((c) => (
              <div key={c.id} className={`card-siswa${sel.has(c.id) ? " selected" : ""}`} onClick={() => router.push(`/siswa/${c.id}`)}>
                <button className="card-check" onClick={(e) => { e.stopPropagation(); toggleSel(c.id); }} aria-label="Pilih">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 5 L4 7 L8 3" /></svg>
                </button>
                <div className={`card-photo ${c.color}`}>
                  {c.bdayToday && <span className="bday-badge">🎂 Hari ini</span>}
                  {c.nama.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  {c.jk && <span className="jk">{c.jk === "P" ? "♀" : "♂"}</span>}
                </div>
                <div className="card-name">{c.nama}</div>
                <div className="card-sub"><span>NISN {c.nisn}</span><span className="kelas">{c.kelas}</span></div>
                <div className="card-tags">{c.tags.map((t, i) => <span key={i} className={`card-tag ${t.tone}`}>{t.label}</span>)}</div>
                <div className="card-stats">
                  <div className={`cs${c.rata != null ? " good" : ""}`}><div className="v">{c.rata ?? "—"}</div><div className="l">Rata²</div></div>
                  <div className={`cs${c.hadir != null ? (c.hadir >= 85 ? " good" : " warn") : ""}`}><div className="v">{c.hadir != null ? `${c.hadir}%` : "—"}</div><div className="l">Hadir</div></div>
                  <div className={`cs${c.sppOk === false ? " warn" : c.sppOk ? " good" : ""}`}><div className="v">{c.sppOk == null ? "—" : c.sppOk ? "✓" : "⚠"}</div><div className="l">SPP</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="siswa-table">
            <thead><tr><th>Siswa</th><th>Kelas</th><th>Status</th><th>JK</th><th>Rata²</th><th>Hadir</th><th></th></tr></thead>
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
                  <td><span className={`row-status ${c.status}`}>{c.status}</span></td>
                  <td><span className={c.jk === "P" ? "row-jk-p" : "row-jk-l"}>{c.jk === "P" ? "♀" : "♂"}</span></td>
                  <td style={{ fontWeight: 800, color: "var(--ak-ink)" }}>{c.rata ?? "—"}</td>
                  <td style={{ fontWeight: 700, color: c.hadir != null && c.hadir < 85 ? "var(--ak-peach-deep)" : "var(--ak-mint-deep)" }}>{c.hadir != null ? `${c.hadir}%` : "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <Link href={`/siswa/${c.id}`} className="detail">Profil →</Link>
                      <Link href={`/siswa/${c.id}/rapor`} className="wa">Rapor</Link>
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
            <div className="info">Halaman <b>{filters.page}</b> dari <b>{gallery.totalPages}</b></div>
            <div className="nav">
              {filters.page > 1 ? <Link href={href({ page: filters.page - 1 })}>← Sebelumnya</Link> : <span className="dis">← Sebelumnya</span>}
              {Array.from({ length: Math.min(5, gallery.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(filters.page - 2, gallery.totalPages - 4));
                const pg = start + i;
                return pg <= gallery.totalPages ? <Link key={pg} href={href({ page: pg })} className={pg === filters.page ? "active" : ""}>{pg}</Link> : null;
              })}
              {filters.page < gallery.totalPages ? <Link href={href({ page: filters.page + 1 })}>Selanjutnya →</Link> : <span className="dis">Selanjutnya →</span>}
            </div>
          </div>
        )}
      </div>

      {/* BULK BAR */}
      <div className={`bulk-bar${sel.size > 0 ? " show" : ""}`}>
        <span className="ct"><b>{sel.size}</b> siswa dipilih</span>
        <span className="sep" />
        <button onClick={() => alert("Broadcast WA ke ortu — sambungkan gateway WA")}>💬 Broadcast WA</button>
        <button onClick={() => alert("Cetak kartu pelajar — segera")}>🪪 Cetak kartu</button>
        <button onClick={() => setSel(new Set())}>Batal</button>
      </div>
    </div>
  );
}
