"use client";

import { useEffect, useState } from "react";

/** Animasi count-up 0 → value (easeOutExpo, 1300ms, delay 300ms). Hormati reduced-motion. */
export function CountUp({
  value,
  format = "id",
  suffix = "",
  className,
}: {
  value: number;
  format?: "id" | "plain";
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    const dur = 1300;
    const delay = 300;
    const ease = (t: number) => 1 - Math.pow(2, -10 * t);
    let raf = 0;
    let begin: number | null = null;
    const tick = (ts: number) => {
      if (begin === null) begin = ts;
      const elapsed = ts - begin - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / dur);
      setDisplay(Math.round(ease(t) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const text = format === "id" ? display.toLocaleString("id-ID") : String(display);
  return (
    <span className={className} suppressHydrationWarning>
      {text}
      {suffix}
    </span>
  );
}
