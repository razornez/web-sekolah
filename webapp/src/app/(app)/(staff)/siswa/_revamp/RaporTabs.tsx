"use client";

import { useState } from "react";
import type { DetailRapor } from "./detailData";

const MAPEL_ICON = (n: string) => {
  const s = n.toLowerCase();
  if (/agama|islam|kristen/.test(s)) return "🕌";
  if (/matematika/.test(s)) return "🔢";
  if (/fisika|kimia|biologi|ipa|alam/.test(s)) return "🔬";
  if (/bahasa|inggris|indonesia|sastra/.test(s)) return "📖";
  if (/sejarah|sosial|ips|ekonomi|geografi/.test(s)) return "🌍";
  if (/seni|musik|budaya/.test(s)) return "🎨";
  if (/jasmani|olahraga|penjas|pjok/.test(s)) return "⚽";
  return "📘";
};

export function RaporTabs({ rapor }: { rapor: DetailRapor[] }) {
  const [active, setActive] = useState(0);
  if (!rapor.length) return <p style={{ color: "var(--ak-muted)", fontSize: 13, padding: "16px 0" }}>Belum ada nilai rapor.</p>;
  const r = rapor[active];
  const aman = r.items.filter((i) => i.nilai >= i.kkm).length;

  return (
    <div>
      <div className="rapor-tabs">
        {rapor.map((p, i) => (
          <button key={i} className={`rapor-tab${i === active ? " active" : ""}`} onClick={() => setActive(i)}>
            {p.periode} {p.tahun}
          </button>
        ))}
      </div>
      <div className="rapor-grid">
        <div>
          {r.items.map((m, i) => (
            <div className="mapel-row" key={i}>
              <span className="mi">{MAPEL_ICON(m.mapel)}</span>
              <div className="mn"><b>{m.mapel}</b><span>{m.deskripsi ? m.deskripsi.slice(0, 60) : `KKM ${m.kkm}`}</span></div>
              <div className="mbar"><i style={{ width: `${Math.min(100, m.nilai)}%` }} /></div>
              <div className="mpill" style={{ color: m.nilai >= m.kkm ? "var(--ak-mint-deep)" : "var(--ak-peach-deep)" }}>{m.nilai}</div>
            </div>
          ))}
        </div>
        <div className="rapor-sum">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Rata-rata semester</div>
          <div className="big">{r.avg}</div>
          <div className="rs-row"><span>Jumlah mapel</span><b>{r.items.length}</b></div>
          <div className="rs-row"><span>Di atas KKM</span><b>{aman} / {r.items.length}</b></div>
          <div className="rs-row"><span>Nilai tertinggi</span><b>{Math.max(...r.items.map((i) => i.nilai))}</b></div>
          <div className="rs-row"><span>Nilai terendah</span><b>{Math.min(...r.items.map((i) => i.nilai))}</b></div>
        </div>
      </div>
    </div>
  );
}
