"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ action }: { action: () => Promise<void> }) {
  const called = useRef(false);
  useEffect(() => {
    if (called.current) return;
    called.current = true;
    action().catch(() => {});
  }, [action]);
  return null;
}
