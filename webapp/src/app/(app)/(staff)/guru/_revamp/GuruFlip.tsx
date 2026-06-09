"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function GuruFlip({ flip }: { flip: { rasioSiswa: number; sertifPct: number; bebanAvg: number } }) {
  const t = useTranslations("guru");
  const [open, setOpen] = useState<number | null>(null);
  const cards = [
    { tone: "lav", icon: "🤔", eyebrow: "flipE1", q: "flipQ1", a: `1 : ${flip.rasioSiswa}`, d: "flipD1" },
    { tone: "mint", icon: "🎓", eyebrow: "flipE2", q: "flipQ2", a: `${flip.sertifPct}%`, d: "flipD2" },
    { tone: "peach", icon: "⏱", eyebrow: "flipE3", q: "flipQ3", a: `${flip.bebanAvg} jam`, d: "flipD3" },
  ];
  return (
    <div className="flip-row">
      {cards.map((c, i) => (
        <button key={i} type="button" className={`flip-card ${c.tone}${open === i ? " flipped" : ""}`} onClick={() => setOpen(open === i ? null : i)}>
          <div className="flip-inner">
            <div className="flip-face flip-front">
              <span className="fc-eyebrow">{c.icon} {t(c.eyebrow)}</span>
              <div className="fc-q">{t(c.q)}</div>
              <span className="fc-hint">↻ {t("flipHint")}</span>
            </div>
            <div className="flip-face flip-back">
              <div className="fc-a">{c.a}</div>
              <div className="fc-d">{t(c.d)}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
