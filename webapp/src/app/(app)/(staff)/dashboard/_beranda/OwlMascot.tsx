"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Target = { sel: string; who: string; msg: string; side: "left" | "right" };
type OwlState = { who: string; msg: string; show: boolean; right: boolean; ot: number; ol: number; bt: number; bl: number };

export function OwlMascot({
  siswa,
  guru,
  agendaDekat,
  todos,
  sppDue,
}: {
  siswa: string;
  guru: number;
  agendaDekat: string | null;
  todos: number;
  sppDue: number;
}) {
  const t = useTranslations("dashboard");
  const [silenced, setSilenced] = useState(false);
  const [b, setB] = useState<OwlState>({
    who: t("ak.owlWhoGuide"),
    msg: t("ak.owlIntro"),
    show: false,
    right: false,
    ot: 120, ol: 200, bt: 120, bl: 290,
  });
  const silencedRef = useRef(false);
  const visited = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { silencedRef.current = silenced; }, [silenced]);

  useEffect(() => {
    let initSilenced = false;
    try { initSilenced = localStorage.getItem("ak-owl-silenced") === "1"; } catch {}
    if (initSilenced) { silencedRef.current = true; queueMicrotask(() => setSilenced(true)); }

    const targets: Target[] = [
      { sel: ".ak-hero", who: t("ak.owlWhoBeranda"), msg: t("ak.owlMsgBeranda"), side: "right" },
      { sel: ".ak-widgets .ak-w:nth-child(1)", who: t("ak.owlWhoSiswa"), msg: t("ak.owlMsgSiswa", { n: siswa }), side: "right" },
      { sel: ".ak-widgets .ak-w:nth-child(2)", who: t("ak.owlWhoGuru"), msg: t("ak.owlMsgGuru", { n: guru }), side: "right" },
      { sel: ".ak-widgets .ak-w:nth-child(3)", who: t("ak.owlWhoAgenda"), msg: agendaDekat ? t("ak.owlMsgAgenda", { ag: agendaDekat }) : t("ak.owlMsgAgendaEmpty"), side: "left" },
      { sel: ".ak-panel.ak-dark", who: t("ak.owlWhoPrioritas"), msg: todos > 0 ? t("ak.owlMsgPrioritas", { n: todos }) : t("ak.owlMsgPrioritasNone"), side: "right" },
      { sel: '[data-ak-nav="jadwal"]', who: t("ak.owlWhoJadwal"), msg: t("ak.owlMsgJadwal"), side: "right" },
      { sel: '[data-ak-nav="spp"]', who: t("ak.owlWhoSpp"), msg: sppDue > 0 ? t("ak.owlMsgSpp", { n: sppDue }) : t("ak.owlMsgSppNone"), side: "right" },
      { sel: ".ak-fab", who: t("ak.owlWhoTur"), msg: t("ak.owlMsgTur"), side: "left" },
    ];

    function pick(): Target {
      if (visited.current.length >= targets.length) visited.current = [];
      const pool = targets.map((_, i) => i).filter((i) => !visited.current.includes(i));
      const idx = pool[Math.floor(Math.random() * pool.length)] ?? 0;
      visited.current.push(idx);
      return targets[idx];
    }

    function fly() {
      if (silencedRef.current) return;
      const target = pick();
      const el = document.querySelector(target.sel);
      if (!el) { timers.current.push(setTimeout(fly, 300)); return; }
      const r = el.getBoundingClientRect();
      const owlW = 76, bubW = 260, gap = 16;
      let ot = Math.max(80, r.top + 12);
      let ol: number, bl: number;
      const right = target.side !== "left";
      if (!right) {
        ol = Math.max(20, r.left - owlW - gap);
        bl = Math.max(20, ol - bubW - gap);
      } else {
        ol = Math.min(window.innerWidth - owlW - 20, r.right - owlW - 4);
        bl = Math.min(window.innerWidth - bubW - 20, ol + owlW + gap);
      }
      ot = Math.min(window.innerHeight - 160, ot);
      const bt = Math.max(20, Math.min(window.innerHeight - 160, ot - 4));

      setB((prev) => ({ ...prev, ot, ol, bt, bl, right, show: false }));
      timers.current.push(setTimeout(() => {
        if (silencedRef.current) return;
        setB((prev) => ({ ...prev, who: target.who, msg: target.msg, show: true }));
      }, 1700));
      timers.current.push(setTimeout(() => setB((prev) => ({ ...prev, show: false })), 7000));
      timers.current.push(setTimeout(() => { if (!silencedRef.current) fly(); }, 8000));
    }

    timers.current.push(setTimeout(fly, 1800));
    const all = timers.current;
    return () => { all.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(v: boolean) {
    try { localStorage.setItem("ak-owl-silenced", v ? "1" : "0"); } catch {}
  }
  function toggle() {
    setSilenced((s) => {
      const next = !s;
      persist(next);
      if (next) setB((prev) => ({ ...prev, show: false }));
      return next;
    });
  }
  function mute(e: React.MouseEvent) {
    e.stopPropagation();
    setSilenced(true);
    persist(true);
    setB((prev) => ({ ...prev, show: false }));
  }

  return (
    <>
      <div className={`ak-owl${silenced ? " ak-silenced" : ""}`} style={{ top: b.ot, left: b.ol }} onClick={toggle} title="Klik untuk istirahatkan Hoo" role="button" aria-label="Maskot Hoo">
        <div className="ak-owl-inner">
          <svg width="76" height="76" viewBox="0 0 80 80" fill="none">
            <ellipse className="ak-wing-l" cx="14" cy="50" rx="7" ry="15" fill="#5B4FE9" />
            <ellipse className="ak-wing-r" cx="66" cy="50" rx="7" ry="15" fill="#5B4FE9" />
            <ellipse cx="40" cy="48" rx="26" ry="24" fill="#7E6FE8" />
            <ellipse cx="40" cy="54" rx="18" ry="17" fill="#E5DFFD" />
            <path d="M22 28 L26 14 L32 28 Z" fill="#5B4FE9" />
            <path d="M58 28 L54 14 L48 28 Z" fill="#5B4FE9" />
            <ellipse className="ak-eye" cx="30" cy="40" rx="10" ry="10" fill="#FFFFFF" />
            <ellipse className="ak-eye" cx="50" cy="40" rx="10" ry="10" fill="#FFFFFF" />
            <circle cx="30" cy="41" r="5" fill="#1A1830" />
            <circle cx="50" cy="41" r="5" fill="#1A1830" />
            <circle cx="32" cy="39" r="1.8" fill="#FFFFFF" />
            <circle cx="52" cy="39" r="1.8" fill="#FFFFFF" />
            <path d="M37 49 L43 49 L40 55 Z" fill="#FFC76A" stroke="#C68A1C" strokeWidth="0.6" />
            <path d="M32 70 L32 76 M30 76 L34 76" stroke="#FFC76A" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M48 70 L48 76 M46 76 L50 76" stroke="#FFC76A" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="18" cy="50" rx="3" ry="2" fill="#FCDDE8" opacity="0.7" />
            <ellipse cx="62" cy="50" rx="3" ry="2" fill="#FCDDE8" opacity="0.7" />
          </svg>
        </div>
      </div>
      <div className={`ak-owl-bubble${b.show ? " ak-show" : ""}${b.right ? " ak-right" : ""}`} style={{ top: b.bt, left: b.bl }} role="status" aria-live="polite">
        <div className="ak-who">{b.who}</div>
        <p>{b.msg}</p>
        <div className="ak-mute" onClick={mute}>{t("ak.owlMute")}</div>
      </div>
    </>
  );
}
