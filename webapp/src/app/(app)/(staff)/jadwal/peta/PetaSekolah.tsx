"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "./peta.css";
import type { PetaData } from "./petaData";

// Layout dasar jam pelajaran (offset menit dari 07:00 default 07:00–14:30, span 450).
// Akan diskala ke jam sekolah nyata (SettingKehadiran) agar tidak hardcoded.
const BASE = [
  { kind: "upacara" as const, num: 0, off: 0 },
  { kind: "jam" as const, num: 1, off: 30 },
  { kind: "jam" as const, num: 2, off: 75 },
  { kind: "jam" as const, num: 3, off: 120 },
  { kind: "istirahat" as const, num: 0, off: 165 },
  { kind: "jam" as const, num: 4, off: 180 },
  { kind: "jam" as const, num: 5, off: 225 },
  { kind: "jam" as const, num: 6, off: 270 },
  { kind: "jam" as const, num: 7, off: 360 },
  { kind: "jam" as const, num: 8, off: 405 },
];
const BASE_SPAN = 450; // 07:00 → 14:30
const fmtHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`;
function buildPeriods(startMin: number, endMin: number) {
  const k = Math.max(1, endMin - startMin) / BASE_SPAN;
  return BASE.map((p) => ({ ...p, start: Math.round(startMin + p.off * k) }));
}

export function PetaSekolah({ data }: { data: PetaData }) {
  const t = useTranslations("jadwal");
  const [selected, setSelected] = useState(data.defaultId);
  const [nowIdx, setNowIdx] = useState(-1);
  const periods = buildPeriods(data.startMin, data.endMin);

  useEffect(() => {
    const ps = buildPeriods(data.startMin, data.endMin);
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const mins = Number(p.find((x) => x.type === "hour")?.value ?? "0") * 60 + Number(p.find((x) => x.type === "minute")?.value ?? "0");
    let idx = -1;
    for (let i = 0; i < ps.length; i++) if (mins >= ps[i].start) idx = i;
    const raf = requestAnimationFrame(() => setNowIdx(idx));
    return () => cancelAnimationFrame(raf);
  }, [data.startMin, data.endMin]);

  const room = data.rooms.find((r) => r.id === selected) ?? data.rooms[0];
  const facade = data.schoolName.toUpperCase().slice(0, 22);

  return (
    <div id="ak-peta">
      <div className="ap-main">
        {/* ===== MAP ===== */}
        <div className="ap-map">
          <div className="ap-map-header">
            <div className="ap-title">
              <span className="ap-tag">{t("peta.headerTag")}</span>
              <h1>{t("peta.headerTitle")}</h1>
              <p>{t("peta.headerSub")}</p>
            </div>
            <div className="ap-legend">
              <span className="ap-chip"><span className="ap-d act" />{t("peta.legendActive")}</span>
              <span className="ap-chip"><span className="ap-d warn" />{t("peta.legendWarn")}</span>
              <span className="ap-chip"><span className="ap-d idle" />{t("peta.legendIdle")}</span>
            </div>
          </div>

          <div className="ap-canvas">
            <svg viewBox="0 0 800 460" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
              <defs>
                <linearGradient id="ap-skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F3F0FB" /><stop offset="100%" stopColor="#F9F6FE" /></linearGradient>
                <linearGradient id="ap-roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5B4FE9" /><stop offset="100%" stopColor="#3B2FA6" /></linearGradient>
                <linearGradient id="ap-wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#F1ECFB" /></linearGradient>
                <linearGradient id="ap-groundG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4F1E2" /><stop offset="100%" stopColor="#B5E0CA" /></linearGradient>
                <filter id="ap-shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="6" /><feOffset dx="0" dy="6" /><feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>

              <rect x="0" y="0" width="800" height="380" fill="url(#ap-skyG)" />

              <g transform="translate(720,120)">
                <g className="ap-ray"><g stroke="#FFE69E" strokeWidth="2" strokeLinecap="round" opacity="0.6"><line x1="0" y1="-48" x2="0" y2="-38" /><line x1="0" y1="38" x2="0" y2="48" /><line x1="-48" y1="0" x2="-38" y2="0" /><line x1="38" y1="0" x2="48" y2="0" /><line x1="-34" y1="-34" x2="-27" y2="-27" /><line x1="27" y1="27" x2="34" y2="34" /><line x1="-34" y1="34" x2="-27" y2="27" /><line x1="27" y1="-27" x2="34" y2="-34" /></g></g>
                <g className="ap-sun"><circle cx="0" cy="0" r="28" fill="#FFE69E" /><circle cx="0" cy="0" r="22" fill="#FFC76A" /></g>
              </g>

              <g className="ap-cloud" transform="translate(160,60)" opacity="0.95"><path d="M 0 16 Q 4 0 22 0 Q 38 -4 44 12 Q 60 10 62 26 Q 38 32 16 30 Q -8 28 0 16 Z" fill="#FFFFFF" /></g>
              <g className="ap-cloud2" transform="translate(360,40)" opacity="0.85"><path d="M 0 14 Q 4 0 18 0 Q 32 -2 36 12 Q 50 12 52 26 Q 30 30 14 28 Q -6 26 0 14 Z" fill="#FFFFFF" /></g>
              <g className="ap-cloud" transform="translate(500,80)" opacity="0.8"><path d="M 0 12 Q 3 0 16 0 Q 28 -2 32 10 Q 44 10 46 22 Q 26 26 12 24 Q -4 22 0 12 Z" fill="#FFFFFF" /></g>
              <g transform="translate(420,120)" stroke="#5B4FE9" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"><path d="M 0 0 Q 3 -4 6 0 Q 9 -4 12 0" /><path d="M 18 8 Q 21 4 24 8 Q 27 4 30 8" /></g>

              <rect x="0" y="380" width="800" height="80" fill="url(#ap-groundG)" />
              <g fill="#2EA171" opacity="0.4"><circle cx="60" cy="420" r="2" /><circle cx="140" cy="430" r="2.5" /><circle cx="260" cy="425" r="2" /><circle cx="700" cy="420" r="2.5" /><circle cx="760" cy="435" r="2" /></g>
              <path d="M 380 380 Q 380 420 360 440 L 440 440 Q 420 420 420 380 Z" fill="#FFE2D1" />

              <g transform="translate(60,310)" className="ap-tree"><rect x="-3" y="50" width="6" height="30" fill="#8C6629" /><circle cx="0" cy="36" r="28" fill="#2EA171" /><circle cx="-14" cy="44" r="20" fill="#3DAE7E" /><circle cx="14" cy="44" r="20" fill="#3DAE7E" /><circle cx="0" cy="22" r="22" fill="#3DAE7E" /></g>
              <g transform="translate(740,320)" className="ap-tree2"><rect x="-3" y="40" width="6" height="30" fill="#8C6629" /><circle cx="0" cy="28" r="24" fill="#2EA171" /><circle cx="-12" cy="36" r="18" fill="#3DAE7E" /><circle cx="12" cy="36" r="18" fill="#3DAE7E" /></g>
              <g transform="translate(280,380)"><ellipse cx="0" cy="-6" rx="14" ry="10" fill="#3DAE7E" /><ellipse cx="-8" cy="-2" rx="10" ry="8" fill="#2EA171" /><ellipse cx="8" cy="-2" rx="10" ry="8" fill="#2EA171" /></g>
              <g transform="translate(520,380)"><ellipse cx="0" cy="-6" rx="14" ry="10" fill="#3DAE7E" /><ellipse cx="-8" cy="-2" rx="10" ry="8" fill="#2EA171" /><ellipse cx="8" cy="-2" rx="10" ry="8" fill="#2EA171" /></g>

              <g filter="url(#ap-shadow)">
                <rect x="170" y="270" width="120" height="110" fill="url(#ap-wallG)" />
                <rect x="290" y="190" width="240" height="190" fill="url(#ap-wallG)" />
                <rect x="530" y="270" width="120" height="110" fill="url(#ap-wallG)" />
                <line x1="290" y1="250" x2="530" y2="250" stroke="#E5DFFD" strokeWidth="1.5" />
                <line x1="290" y1="315" x2="530" y2="315" stroke="#E5DFFD" strokeWidth="1.5" />
                <polygon points="160,272 230,238 300,272" fill="url(#ap-roofG)" />
                <polygon points="280,192 410,140 540,192" fill="url(#ap-roofG)" />
                <polygon points="280,192 290,210 530,210 540,192" fill="#3B2FA6" />
                <polygon points="520,272 590,238 660,272" fill="url(#ap-roofG)" />
                <rect x="394" y="100" width="32" height="48" fill="url(#ap-wallG)" />
                <polygon points="388,102 410,76 432,102" fill="#3B2FA6" />
                <circle cx="410" cy="98" r="3" fill="#FFE69E" />
                <path d="M 402 122 Q 402 116 410 116 Q 418 116 418 122 L 418 134 L 402 134 Z" fill="#C68A1C" />
                <line x1="410" y1="76" x2="410" y2="60" stroke="#1A1830" strokeWidth="1.5" strokeLinecap="round" />
                <g className="ap-flag"><path d="M 410 62 L 432 64 L 428 70 L 432 76 L 410 78 Z" fill="#E07650" /></g>
                <rect x="390" y="335" width="40" height="45" fill="#3B2FA6" />
                <path d="M 390 335 Q 410 320 430 335" fill="#3B2FA6" />
                <rect x="395" y="345" width="14" height="35" fill="#5B4FE9" />
                <rect x="411" y="345" width="14" height="35" fill="#5B4FE9" />
                <rect x="380" y="378" width="60" height="3" fill="#E5DFFD" />

                {/* 2nd floor windows */}
                <g><rect x="305" y="218" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="307" y="220" width="28" height="22" rx="1" fill="#FFE69E" className="ap-light" /><line x1="321" y1="220" x2="321" y2="242" stroke="#5B4FE9" strokeWidth="1" /></g>
                <g><rect x="349" y="218" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="351" y="220" width="28" height="22" rx="1" fill="#FFE69E" className="ap-light" /><line x1="365" y1="220" x2="365" y2="242" stroke="#5B4FE9" strokeWidth="1" /></g>
                <g><rect x="438" y="218" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="440" y="220" width="28" height="22" rx="1" fill="#B5A8F5" /><line x1="454" y1="220" x2="454" y2="242" stroke="#5B4FE9" strokeWidth="1" /></g>
                <g><rect x="482" y="218" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="484" y="220" width="28" height="22" rx="1" fill="#FFE69E" className="ap-light" /><line x1="498" y1="220" x2="498" y2="242" stroke="#5B4FE9" strokeWidth="1" /></g>
                {/* 1st floor windows */}
                <g><rect x="305" y="280" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="307" y="282" width="28" height="22" rx="1" fill="#FFE69E" /></g>
                <g><rect x="349" y="280" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="351" y="282" width="28" height="22" rx="1" fill="#FFE2D1" /></g>
                <g><rect x="438" y="280" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="440" y="282" width="28" height="22" rx="1" fill="#FFE69E" /></g>
                <g><rect x="482" y="280" width="32" height="26" rx="2" fill="#5B4FE9" /><rect x="484" y="282" width="28" height="22" rx="1" fill="#FFFFFF" opacity="0.6" /></g>
                {/* left wing windows */}
                <g><rect x="185" y="290" width="32" height="32" rx="2" fill="#5B4FE9" /><rect x="187" y="292" width="28" height="28" rx="1" fill="#DCEAFB" /></g>
                <g><rect x="235" y="290" width="32" height="32" rx="2" fill="#5B4FE9" /><rect x="237" y="292" width="28" height="28" rx="1" fill="#DCEAFB" /></g>
                <rect x="200" y="340" width="20" height="40" fill="#3B2FA6" />
                {/* right wing windows */}
                <g><rect x="545" y="290" width="32" height="32" rx="2" fill="#5B4FE9" /><rect x="547" y="292" width="28" height="28" rx="1" fill="#FFE2D1" /></g>
                <g><rect x="595" y="290" width="32" height="32" rx="2" fill="#5B4FE9" /><rect x="597" y="292" width="28" height="28" rx="1" fill="#FFE2D1" /></g>
                <rect x="600" y="340" width="20" height="40" fill="#3B2FA6" />
                {/* aula */}
                <g opacity="0.85"><rect x="690" y="320" width="80" height="60" fill="#F1ECFB" /><polygon points="685,322 730,300 775,322" fill="#7E6FE8" /><rect x="700" y="345" width="14" height="14" rx="1" fill="#5B4FE9" /><rect x="724" y="345" width="14" height="14" rx="1" fill="#5B4FE9" /><rect x="748" y="345" width="14" height="14" rx="1" fill="#5B4FE9" /><rect x="724" y="365" width="14" height="15" fill="#3B2FA6" /></g>
                {/* lapangan */}
                <rect x="80" y="395" width="220" height="50" rx="6" fill="#B5E0CA" opacity="0.5" />
                <line x1="190" y1="400" x2="190" y2="440" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" strokeDasharray="2 3" />
                <circle cx="190" cy="420" r="14" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
                <text x="410" y="186" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="9" fontWeight="800" fill="#3B2FA6" letterSpacing="0.18em">{facade}</text>
              </g>

              <g className="ap-walk1"><g transform="translate(120,420)"><circle cx="0" cy="-12" r="4" fill="#FFC76A" /><rect x="-3" y="-8" width="6" height="10" rx="2" fill="#5B4FE9" /><line x1="-2" y1="2" x2="-2" y2="6" stroke="#3B2FA6" strokeWidth="2" strokeLinecap="round" /><line x1="2" y1="2" x2="2" y2="6" stroke="#3B2FA6" strokeWidth="2" strokeLinecap="round" /></g></g>
              <g className="ap-walk2"><g transform="translate(450,420)"><circle cx="0" cy="-12" r="4" fill="#FFE69E" /><rect x="-3" y="-8" width="6" height="10" rx="2" fill="#E07650" /><line x1="-2" y1="2" x2="-2" y2="6" stroke="#8C6629" strokeWidth="2" strokeLinecap="round" /><line x1="2" y1="2" x2="2" y2="6" stroke="#8C6629" strokeWidth="2" strokeLinecap="round" /></g></g>
            </svg>
          </div>

          {/* hotspots */}
          {data.rooms.map((r) => (
            <button key={r.id} className={`ap-hot${selected === r.id ? " sel" : ""}`} style={{ left: r.left, top: r.top }} onClick={() => setSelected(r.id)} aria-label={r.label}>
              <span className={`ap-dot ${r.status}${r.pulse ? " active" : ""}`} />
              <span className="ap-rlabel">{r.label}</span>
            </button>
          ))}
        </div>

        {/* ===== DRAWER ===== */}
        <aside className="ap-drawer">
          <div className="ap-dtag">{room.tag}</div>
          <h2>{room.title}</h2>
          <div className="ap-dsub">{room.sub}</div>
          <div className="ap-dstats">
            {room.stats.map((s, i) => (
              <div className="ap-ds" key={i}>
                <div className="l">{s.l}</div>
                <div className="v">{s.v}{s.small && <small>{s.small}</small>}</div>
                {s.d && <div className="d">{s.d}</div>}
              </div>
            ))}
          </div>
          <div className="ap-dsec">
            <h3>{t("peta.rincian")}</h3>
            {room.info.map((it, i) => (
              <div className="ap-il" key={i}><span className="il">{it.l}</span><span className="iv">{it.v}</span></div>
            ))}
          </div>
          <div className="ap-dact">
            <Link href={room.secondaryHref} className="ap-btn soft">{room.secondaryLabel}</Link>
            <Link href={room.primaryHref} className="ap-btn prim">
              {room.primaryLabel}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6 L9 6 M6 3 L9 6 L6 9" /></svg>
            </Link>
          </div>
        </aside>
      </div>

      {/* ===== DOCK ===== */}
      <div className="ap-dock">
        <div className="ap-dock-label">
          <div className="l">{t("peta.dockToday")}</div>
          <div className="v">{t("peta.dockPelajaran")}</div>
        </div>
        <div className="ap-dock-line">
          {periods.map((p, i) => {
            const label = p.kind === "upacara" ? t("peta.pdUpacara") : p.kind === "istirahat" ? t("peta.pdIstirahat") : t("peta.pdJam", { n: p.num });
            return (
              <div key={i} className={`ap-pd${i === nowIdx ? " now" : i < nowIdx ? " past" : ""}`}>
                <span className="ph">{i === nowIdx ? t("peta.dockNow") : fmtHM(p.start)}</span>{label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
