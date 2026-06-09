"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Step = { sel: string; title: string; text: string; place: "top" | "bottom" | "right" };

export function TourGuide({ siswa, guru, agendaCount, todos }: { siswa: string; guru: number; agendaCount: number; todos: number }) {
  const t = useTranslations("dashboard");
  const [step, setStep] = useState(-1); // -1 = tertutup
  const spotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    { sel: ".ak-hero", title: t("ak.tour1Title"), text: t("ak.tour1Text"), place: "bottom" },
    { sel: ".ak-widgets .ak-w:nth-child(1)", title: t("ak.tour2Title"), text: t("ak.tour2Text", { n: siswa }), place: "bottom" },
    { sel: ".ak-widgets .ak-w:nth-child(2)", title: t("ak.tour3Title"), text: t("ak.tour3Text", { n: guru }), place: "bottom" },
    { sel: ".ak-widgets .ak-w:nth-child(3)", title: t("ak.tour4Title"), text: agendaCount > 0 ? t("ak.tour4Text") : t("ak.tour4TextEmpty"), place: "bottom" },
    { sel: ".ak-panel.ak-dark", title: t("ak.tour5Title"), text: todos > 0 ? t("ak.tour5Text") : t("ak.tour5TextEmpty"), place: "top" },
    { sel: '[data-ak-nav="jadwal"]', title: t("ak.tour6Title"), text: t("ak.tour6Text"), place: "right" },
  ];

  const place = useCallback((i: number) => {
    const s = steps[i];
    if (!s) return;
    const el = document.querySelector(s.sel);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => {
      const spot = spotRef.current, tip = tipRef.current;
      if (!spot || !tip) return;
      const r = el.getBoundingClientRect();
      const pad = 8;
      spot.style.top = r.top - pad + "px";
      spot.style.left = r.left - pad + "px";
      spot.style.width = r.width + pad * 2 + "px";
      spot.style.height = r.height + pad * 2 + "px";
      const tw = 340;
      let tt: number, tl: number;
      if (s.place === "top") { tt = r.top - 210; tl = r.left + r.width / 2 - tw / 2; }
      else if (s.place === "right") { tt = r.top - 20; tl = r.right + 24; }
      else { tt = r.bottom + 18; tl = r.left; }
      tt = Math.max(20, Math.min(window.innerHeight - 240, tt));
      tl = Math.max(20, Math.min(window.innerWidth - tw - 20, tl));
      tip.style.top = tt + "px";
      tip.style.left = tl + "px";
    }, 280);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step < 0) return;
    const cleanup = place(step);
    const onResize = () => place(step);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cleanup?.(); };
  }, [step, place]);

  const open = step >= 0;
  const last = step === steps.length - 1;
  const cur = steps[step];

  return (
    <>
      <button className="ak-fab" onClick={() => setStep(0)} aria-label={t("ak.tourStep", { cur: 1, total: steps.length })} title={t("ak.tour1Title")} style={{ display: open ? "none" : "flex" }}>
        <span className="ak-fpulse" />
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 3 L13 6 M13 20 L13 23 M3 13 L6 13 M20 13 L23 13" />
          <circle cx="13" cy="13" r="6" />
          <circle cx="13" cy="13" r="2.5" fill="currentColor" stroke="none" />
        </svg>
        <span className="ak-fbadge">{t("ak.tourBadge")}</span>
      </button>

      <div className={`ak-tour-overlay${open ? " ak-show" : ""}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div ref={spotRef} className="ak-tour-spot" />
        <div ref={tipRef} className="ak-tour-tip">
          <div className="ak-step">{t("ak.tourStep", { cur: Math.max(1, step + 1), total: steps.length })}</div>
          <h4>{cur?.title ?? ""}</h4>
          <p>{cur?.text ?? ""}</p>
          <div className="ak-tour-actions">
            <div className="ak-progress">
              {steps.map((_, i) => (
                <span key={i} className={i < step ? "ak-done" : i === step ? "ak-cur" : ""} />
              ))}
            </div>
            <div className="ak-tour-btns">
              <button className="ak-skip" onClick={() => setStep(-1)}>{t("ak.tourSkip")}</button>
              <button className="ak-next" onClick={() => setStep(last ? -1 : step + 1)}>
                {last ? t("ak.tourDone") : t("ak.tourNext")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
