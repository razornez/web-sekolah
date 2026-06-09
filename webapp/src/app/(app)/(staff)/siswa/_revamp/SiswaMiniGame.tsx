"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameQ } from "./listData";

export function SiswaMiniGame({ game }: { game: GameQ[] }) {
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let v = 0;
    try { v = Number(localStorage.getItem("akadewa-siswa-streak") || "0"); } catch {}
    queueMicrotask(() => setStreak(v));
  }, []);

  const saveStreak = (v: number) => { setStreak(v); try { localStorage.setItem("akadewa-siswa-streak", String(v)); } catch {} };

  const next = useCallback(() => {
    setPicked(null); setRevealed(false);
    setIdx((i) => (game.length ? (i + 1) % game.length : 0));
  }, [game.length]);

  function pick(val: number, correct: boolean) {
    if (picked !== null || !game.length) return;
    setPicked(val); setRevealed(true);
    saveStreak(correct ? streak + 1 : 0);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(next, 3500);
  }
  function skip() { if (timer.current) clearTimeout(timer.current); next(); }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!game.length) return null;
  const q = game[idx];

  return (
    <section className="quiz-strip">
      <span className="qz-emoji">🎯</span>
      <div className="qz-body">
        <div className="qz-lbl">Tebak Statistik Pagi <span className="streak">streak {streak}</span></div>
        <div className="qz-q" dangerouslySetInnerHTML={{ __html: q.q }} />
      </div>
      <div className="qz-opts">
        {q.options.map((o) => {
          let cls = "qz-opt";
          if (revealed) {
            if (o.correct) cls += picked === o.v ? " correct" : " reveal";
            else if (picked === o.v) cls += " wrong";
          }
          return <button key={o.v} className={cls} onClick={() => pick(o.v, o.correct)} disabled={picked !== null}>{o.v.toLocaleString("id-ID")}</button>;
        })}
      </div>
      <button className="qz-skip" onClick={skip}>{revealed ? "Lanjut →" : "Lewati"}</button>
      {revealed && <div className="qz-insight" dangerouslySetInnerHTML={{ __html: q.insight }} />}
    </section>
  );
}
