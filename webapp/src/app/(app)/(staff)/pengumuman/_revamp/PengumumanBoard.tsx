"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./pengumuman.css";
import type { PengData, PengItem } from "./data";
import { MiniGameTebakKategori } from "./MiniGameTebakKategori";
import { logKirim } from "../actions";

const KATEGORIS = ["umum", "akademik", "keuangan", "kegiatan", "penting"] as const;

const KAT_META: Record<string, { label: string; cls: string }> = {
  umum: { label: "Umum", cls: "c-umum" },
  akademik: { label: "Akademik", cls: "c-akademik" },
  keuangan: { label: "Keuangan", cls: "c-keuangan" },
  kegiatan: { label: "Kegiatan", cls: "c-kegiatan" },
  penting: { label: "Penting", cls: "c-penting" },
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function ThumbIcon({ kat }: { kat: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kat === "keuangan" ? <><ellipse cx="11" cy="7" rx="7" ry="2.6" /><path d="M4 7 V15 Q4 17.6 11 17.6 Q18 17.6 18 15 V7" /></> :
       kat === "akademik" ? <><path d="M11 3 L19 7 L11 11 L3 7 Z" /><path d="M6 8.5 V13 Q11 15.5 16 13 V8.5" /></> :
       kat === "kegiatan" ? <path d="M11 2.5 L13.4 8 L19 8.5 L14.7 12.3 L16 18 L11 15 L6 18 L7.3 12.3 L3 8.5 L8.6 8 Z" /> :
       kat === "penting" ? <><path d="M11 3 L19 17 L3 17 Z" /><path d="M11 8 V12 M11 14.5 V14.6" /></> :
       <><path d="M4 9 L13 5 L13 17 L4 13 Z" /><path d="M13 7 Q18 7 18 11 Q18 15 13 15" /></>}
    </svg>
  );
}

export function PengumumanBoard({ data }: { data: PengData }) {
  const router = useRouter();
  const [kat, setKat] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selId, setSelId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.items.filter((p) => {
      if (target && p.target !== target) return false;
      if (kat === "penting") { if (!(p.pinned || p.prioritas || p.kategori === "penting")) return false; }
      else if (kat && p.kategori !== kat) return false;
      if (ql && !(`${p.judul} ${p.snippet}`.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [data.items, kat, target, q]);

  const groups = useMemo(() => {
    const m = new Map<string, PengItem[]>();
    for (const p of filtered) {
      const arr = m.get(p.kategori);
      if (arr) arr.push(p);
      else m.set(p.kategori, [p]);
    }
    return KATEGORIS.filter((k) => m.has(k)).map((k) => ({ key: k, items: m.get(k)! }));
  }, [filtered]);

  const sel = selId != null ? data.items.find((p) => p.id === selId) ?? null : null;
  const create = () => router.push("/pengumuman/new");

  const CATS = [
    { key: "", label: "Semua", count: data.total },
    { key: "umum", label: "Umum", count: data.categoryCounts.umum ?? 0 },
    { key: "akademik", label: "Akademik", count: data.categoryCounts.akademik ?? 0 },
    { key: "keuangan", label: "Keuangan", count: data.categoryCounts.keuangan ?? 0 },
    { key: "kegiatan", label: "Kegiatan", count: data.categoryCounts.kegiatan ?? 0 },
    { key: "penting", label: "Penting", count: data.pentingCount },
  ];

  return (
    <div id="ak-peng">
      <MiniGameTebakKategori data={data} onCreate={create} />

      {/* KATEGORI CARDS */}
      <div className="pg-cats">
        {CATS.map((c) => (
          <button key={c.key} className={`pg-cat${kat === c.key ? " active" : ""}`} onClick={() => setKat(c.key)}>
            <span className={`art ${c.key ? (KAT_META[c.key]?.cls ?? "c-umum") : "c-umum"}`} style={{ borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.key ? <ThumbIcon kat={c.key} /> : <ThumbIcon kat="umum" />}
            </span>
            <div className="cl">{c.key === "" ? "Filter" : "Kategori"}</div>
            <div className="cn">{c.count}</div>
            <div className="ck">{c.label}</div>
          </button>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="pg-toolbar">
        <div className="pg-search">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6.5" cy="6.5" r="4.8" /><path d="M10 10 L13.5 13.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul atau isi pengumuman…" />
        </div>
        <div className="pg-pillgroup">
          <span className="lbl">Target</span>
          {["", "staf", "siswa", "ortu"].map((tg) => (
            <button key={tg} className={`pg-pill${target === tg ? " active" : ""}`} onClick={() => setTarget(tg)}>{tg === "" ? "Semua" : tg[0].toUpperCase() + tg.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* PINNED CORK BOARD */}
      {data.pinned.length > 0 && (
        <div>
          <div className="pg-sec-head">
            <h3>Disematkan</h3><span className="tag">{data.pinned.length} prioritas</span>
            <span className="meta">Tetap di atas sampai dilepas</span>
          </div>
          <div className="pg-cork" style={{ marginTop: 10 }}>
            <div className="pg-cork-grid">
              {data.pinned.map((p) => (
                <button key={p.id} className="pg-note" onClick={() => setSelId(p.id)}>
                  <span className="pg-pin" />
                  <div className="nrow"><span className="ncat">{KAT_META[p.kategori]?.label ?? p.kategori}</span><span className="ncd">{p.prioritas ? "PRIORITAS" : "DISEMATKAN"}</span></div>
                  <h4>{p.judul}</h4>
                  <p>{p.snippet}</p>
                  <div className="nfoot"><span>🎯 {p.target}</span><span>{fmt(p.createdAtISO)}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="pg-list">
        <div className="pg-list-head"><h3>Semua pengumuman</h3><span style={{ fontSize: 12, fontWeight: 600, color: "var(--ak-muted)" }}>{filtered.length} ditampilkan</span></div>
        {groups.length === 0 ? (
          <p style={{ padding: "28px 0", textAlign: "center", color: "var(--ak-muted)", fontSize: 13 }}>Tidak ada pengumuman yang cocok.</p>
        ) : groups.map((g) => {
          const isCol = collapsed.has(g.key);
          return (
            <div className="pg-group" key={g.key}>
              <button className={`pg-grouphdr${isCol ? " collapsed" : ""}`} onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })}>
                <span className={`chip ${KAT_META[g.key]?.cls ?? "c-umum"}`}><ThumbIcon kat={g.key} /></span>
                <span className="gn">{KAT_META[g.key]?.label ?? g.key}</span>
                <span className="gc">{g.items.length} pengumuman</span>
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              <div className="pg-group-body" style={{ maxHeight: isCol ? 0 : 4000 }}>
                {g.items.map((p) => (
                  <div className="pg-ann" key={p.id}>
                    <div className={`pg-thumb ${KAT_META[p.kategori]?.cls ?? "c-umum"}`}><ThumbIcon kat={p.kategori} /></div>
                    <div className="pg-ann-body">
                      <div className="pg-ann-titlerow">
                        <span className="pg-ann-title" onClick={() => setSelId(p.id)}>{p.judul}</span>
                        <span className={`pg-tag ${KAT_META[p.kategori]?.cls ?? "c-umum"}`}>{KAT_META[p.kategori]?.label ?? p.kategori}</span>
                        <span className={`pg-tag t-${p.kategori}`} style={{ background: "var(--ak-bg-2)", color: "var(--ak-ink-3)" }}>{p.target}</span>
                        {(p.pinned || p.prioritas) && <span className="pg-tag penting">Penting</span>}
                      </div>
                      <div className="pg-ann-snip">{p.snippet}</div>
                      <div className="pg-ann-meta">
                        <span>🕐 {fmt(p.createdAtISO)}</span>
                        <span>Dibaca {p.readPct}% · {p.readCount.toLocaleString("id-ID")} dari {p.recipientTotal.toLocaleString("id-ID")}</span>
                        {p.waSent && <span className="ok">✓ Terkirim WA</span>}
                        {p.scheduledAtISO && <span className="warn">⏱ Terjadwal {fmt(p.scheduledAtISO)}</span>}
                      </div>
                    </div>
                    <div className="pg-ann-actions">
                      <button className="pg-actbtn" onClick={() => setSelId(p.id)}>Detail</button>
                      <Link className="pg-actbtn" href={`/pengumuman/${p.id}/edit`}>Edit</Link>
                      <a className="pg-actbtn wa" href={`https://wa.me/?text=${encodeURIComponent(`*${p.judul}*\n\n${p.snippet}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => logKirim(p.id, "wa")}>WA</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL DRAWER */}
      <div className={`pg-overlay${sel ? " show" : ""}`} onClick={() => setSelId(null)} />
      <aside className={`pg-drawer${sel ? " show" : ""}`} role="dialog" aria-modal="true" aria-hidden={!sel}>
        {sel && (() => {
          const belum = Math.max(0, sel.recipientTotal - sel.readCount);
          const pct = sel.recipientTotal > 0 ? Math.round((sel.readCount / sel.recipientTotal) * 100) : 0;
          return (
            <>
              <div className="pg-drawer-hero" style={{ background: `var(--ak-${sel.kategori === "keuangan" ? "sun" : sel.kategori === "akademik" ? "lav" : sel.kategori === "kegiatan" ? "pink" : sel.kategori === "penting" ? "mint" : "peach"})` }}>
                <button className="close" onClick={() => setSelId(null)} aria-label="Tutup">✕</button>
                <div className="chips">
                  <span className={`pg-tag ${KAT_META[sel.kategori]?.cls ?? "c-umum"}`}>{KAT_META[sel.kategori]?.label ?? sel.kategori}</span>
                  <span className="pg-tag" style={{ background: "rgba(255,255,255,0.6)", color: "var(--ak-ink-2)" }}>🎯 {sel.target}</span>
                  {(sel.pinned || sel.prioritas) && <span className="pg-tag penting">Penting</span>}
                </div>
                <h2>{sel.judul}</h2>
                <div className="ml"><span>🕐 {fmt(sel.createdAtISO)}</span>{sel.author && <span>✍️ {sel.author}</span>}<span>👁 {sel.viewCount.toLocaleString("id-ID")} dilihat</span></div>
              </div>
              <div className="pg-drawer-body">
                <div dangerouslySetInnerHTML={{ __html: sel.isi }} />
                <div className="pg-reach">
                  <div className="rtop"><span className="rl">Tingkat dibaca</span><span className="rv">{pct}<small>%</small></span></div>
                  <div className="rbar"><div className="seg" style={{ width: `${pct}%`, background: "var(--ak-mint-deep)" }} /><div className="seg" style={{ width: `${100 - pct}%`, background: "var(--ak-soft)" }} /></div>
                  <div className="rleg">
                    <div className="row"><span className="dot" style={{ background: "var(--ak-mint-deep)" }} />Sudah dibaca<b>{sel.readCount.toLocaleString("id-ID")}</b></div>
                    <div className="row"><span className="dot" style={{ background: "var(--ak-soft)" }} />Belum<b>{belum.toLocaleString("id-ID")}</b></div>
                    <div className="row"><span className="dot" style={{ background: "var(--ak-lav-deep)" }} />Penerima<b>{sel.recipientTotal.toLocaleString("id-ID")}</b></div>
                    <div className="row"><span className="dot" style={{ background: "var(--ak-sky-deep)" }} />Dilihat (raw)<b>{sel.viewCount.toLocaleString("id-ID")}</b></div>
                  </div>
                </div>
              </div>
              <div className="pg-drawer-foot">
                <Link className="pg-bsoft" href={`/pengumuman/${sel.id}/edit`}>Edit</Link>
                <a className="pg-bwa" href={`https://wa.me/?text=${encodeURIComponent(`*${sel.judul}*\n\n${sel.snippet}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => logKirim(sel.id, "wa")}>Kirim WA ulang</a>
                <button className="pg-bink" onClick={() => setSelId(null)}>Tutup</button>
              </div>
            </>
          );
        })()}
      </aside>

      <button className="pg-fab" onClick={create}>
        <span className="ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 3 V11 M3 7 H11" /></svg></span>
        Pengumuman baru
      </button>
    </div>
  );
}
