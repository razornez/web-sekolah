"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameCard, PengData } from "./data";

const KAT: { key: string; label: string; cls: string; icon: React.ReactNode }[] = [
  { key: "akademik", label: "Akademik", cls: "c-akademik", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 L16 6 L9 9 L2 6 Z" /><path d="M5 7.5 V11 Q9 13 13 11 V7.5" /></svg> },
  { key: "keuangan", label: "Keuangan", cls: "c-keuangan", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="9" cy="5" rx="6" ry="2.3" /><path d="M3 5 V13 Q3 15.3 9 15.3 Q15 15.3 15 13 V5" /></svg> },
  { key: "kegiatan", label: "Kegiatan", cls: "c-kegiatan", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2 L11 6.5 L16 7 L12.3 10.3 L13.5 15 L9 12.5 L4.5 15 L5.7 10.3 L2 7 L7 6.5 Z" /></svg> },
  { key: "umum", label: "Umum", cls: "c-umum", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 L11 4 L11 14 L3 10 Z" /><path d="M11 6 Q15 6 15 9 Q15 12 11 12" /></svg> },
  { key: "penting", label: "Penting", cls: "c-penting", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2 L16 15 L2 15 Z" /><path d="M9 7 V10 M9 12.5 V12.6" /></svg> },
];
const KAT_LABEL: Record<string, string> = Object.fromEntries(KAT.map((k) => [k.key, k.label]));
const ROUND = 8; // detik
const RING_C = 2 * Math.PI * 24;

function buildInsights(d: PengData["insight"]): string[] {
  const out: string[] = [];
  if (d.topCatKey) out.push(`Kategori "${KAT_LABEL[d.topCatKey] ?? d.topCatKey}" paling banyak — ${d.topCatCount} pengumuman.`);
  if (d.avgReadPct > 0) out.push(`Rata-rata tingkat baca pengumuman sekolah Anda ${d.avgReadPct}%.`);
  if (d.pinnedCount > 0) out.push(`${d.pinnedCount} pengumuman sedang disematkan di papan.`);
  if (d.scheduledCount > 0) out.push(`${d.scheduledCount} pengumuman dijadwalkan terbit otomatis.`);
  if (d.emojiPct > 0) out.push(`${d.emojiPct}% judul pengumuman diawali emoji — efektif menarik perhatian.`);
  out.push(`Total ${d.total} pengumuman tercatat dari sekolah Anda.`);
  return out;
}

export function MiniGameTebakKategori({ data, onCreate }: { data: PengData; onCreate: () => void }) {
  const cards = data.gameCards;
  const insights = buildInsights(data.insight);

  const [best, setBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [card, setCard] = useState<GameCard | null>(cards[0] ?? null);
  const [timeLeft, setTimeLeft] = useState(ROUND);
  const [locked, setLocked] = useState(false);
  const [flying, setFlying] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "correct" | "wrong" | "hint">>({});
  const [pop, setPop] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);

  const idxRef = useRef(0);
  const correctRunRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    if (!cards.length) return;
    let i = Math.floor(Math.random() * cards.length);
    if (cards.length > 1 && i === idxRef.current) i = (i + 1) % cards.length;
    idxRef.current = i;
    setCard(cards[i]);
    setTimeLeft(ROUND);
    setLocked(false);
    setFlying(false);
    setShaking(false);
    setFeedback({});
    setInsight(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  // countdown
  useEffect(() => {
    let v = 0;
    try { v = Number(localStorage.getItem("akadewa-game-best") || "0"); } catch {}
    queueMicrotask(() => setBest(v));
  }, []);
  useEffect(() => {
    if (locked || insight || !card) return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) { return 0; }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [locked, insight, card]);

  // timeout → seperti salah (tanpa flash)
  useEffect(() => {
    if (timeLeft <= 0 && !locked && card && !insight) {
      correctRunRef.current = 0;
      queueMicrotask(() => { setLocked(true); setStreak(0); });
      const id = setTimeout(next, 900);
      return () => clearTimeout(id);
    }
  }, [timeLeft, locked, card, insight, next]);

  function choose(key: string) {
    if (locked || !card) return;
    setLocked(true);
    if (key === card.kategori) {
      setFeedback({ [key]: "correct" });
      setPop("+1");
      setFlying(true);
      const ns = streak + 1;
      setStreak(ns);
      if (ns > best) { setBest(ns); try { localStorage.setItem("akadewa-game-best", String(ns)); } catch {} }
      correctRunRef.current += 1;
      setTimeout(() => setPop(null), 900);
      if (correctRunRef.current % 3 === 0 && insights.length) {
        setTimeout(() => setInsight(insights[Math.floor(Math.random() * insights.length)]), 650);
      } else {
        setTimeout(next, 900);
      }
    } else {
      setFeedback({ [key]: "wrong", [card.kategori]: "hint" });
      setShaking(true);
      setStreak(0);
      correctRunRef.current = 0;
      setTimeout(next, 1100);
    }
  }

  function reset() {
    setStreak(0);
    correctRunRef.current = 0;
    next();
  }

  const ratio = Math.max(0, Math.min(1, timeLeft / ROUND));
  const danger = timeLeft <= 3;

  return (
    <div className="pg-game">
      <div className="pg-game-left">
        <span className="pg-eyebrow">Tantangan pagi · sambil seruput kopi</span>
        <h1 className="pg-title">Tebak <em>kategori</em> pengumuman ini.</h1>
        <div className="pg-stats">
          <div className="pg-stat"><div className="l">Streak</div><div className="v">{streak}</div></div>
          <div className="pg-stat"><div className="l">Rekor</div><div className="v">{best}</div></div>
          <div className="pg-stat"><div className="l">Waktu</div><div className="v">{Math.ceil(timeLeft)}<small>s</small></div></div>
        </div>

        {insight ? (
          <div className="pg-insight">
            <div className="em">💡</div>
            <div className="l">Tahukah Anda</div>
            <p>{insight}</p>
            <button className="next" onClick={next}>Lanjut →</button>
          </div>
        ) : card ? (
          <div className="pg-stage">
            <div className={`pg-ring${danger ? " danger" : ""}`}>
              <svg viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ak-bg-2)" strokeWidth="5" />
                <circle cx="28" cy="28" r="24" fill="none" stroke={danger ? "var(--ak-peach-deep)" : "var(--ak-primary)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${ratio * RING_C} ${RING_C}`} />
              </svg>
              <div className="num">{Math.ceil(timeLeft)}</div>
            </div>
            <div className={`pg-sticky${flying ? " fly" : ""}${shaking ? " shake" : ""}`} role="article" aria-live="polite">
              <div className="lbl">Pengumuman muncul di papan</div>
              <div className="snip">{card.snippet}</div>
              <div className="foot"><span>Untuk: {card.target}</span><span>Kelompokkan →</span></div>
            </div>
          </div>
        ) : (
          <div className="pg-stage"><div className="pg-sticky"><div className="snip">Belum ada pengumuman untuk ditebak. Buat dulu, yuk!</div></div></div>
        )}
      </div>

      <div className="pg-game-right">
        <div className="pg-right-lbl">Lempar ke kategori yang tepat:</div>
        <div className="pg-bins">
          {KAT.map((k) => (
            <button key={k.key} className={`pg-bin${feedback[k.key] ? " " + feedback[k.key] : ""}`} onClick={() => choose(k.key)} aria-label={`Pilih kategori ${k.label}`} disabled={!card || !!insight}>
              <span className={`ico ${k.cls}`}>{k.icon}</span>
              <span>{k.label}</span>
              {pop && feedback[k.key] === "correct" && <span className="pg-pop">{pop}</span>}
            </button>
          ))}
        </div>
        <div className="pg-right-foot">
          <button className="pg-create" onClick={onCreate}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 3 V11 M3 7 H11" /></svg>
            Buat pengumuman
          </button>
          <button className="pg-reset" onClick={reset} aria-label="Ulang permainan" title="Ulang">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5 V7 H11" /><path d="M14 7 A6 6 0 1 0 15 11" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
