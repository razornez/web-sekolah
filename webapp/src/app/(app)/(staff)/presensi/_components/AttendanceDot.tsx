"use client";

import { useState, useTransition } from "react";
import { markSiswaHadir, setSiswaStatus } from "../actions";
import type { StatusPresensi } from "@prisma/client";

type Status = StatusPresensi | null;

const STATUS_CFG: Record<StatusPresensi, { bg: string; ring: string; label: string; icon: string }> = {
  hadir:     { bg: "bg-emerald-500", ring: "ring-emerald-300", label: "Hadir",     icon: "✓" },
  terlambat: { bg: "bg-amber-400",   ring: "ring-amber-200",   label: "Terlambat", icon: "⏱" },
  izin:      { bg: "bg-sky-400",     ring: "ring-sky-200",     label: "Izin",      icon: "i" },
  sakit:     { bg: "bg-violet-400",  ring: "ring-violet-200",  label: "Sakit",     icon: "+" },
  alpa:      { bg: "bg-red-500",     ring: "ring-red-300",     label: "Alpa",      icon: "✗" },
};

const STATUS_ORDER: StatusPresensi[] = ["hadir", "terlambat", "izin", "sakit", "alpa"];

export function AttendanceDot({
  siswaId,
  tanggal,
  status: initStatus,
  isFuture = false,
  size = "md",
}: {
  siswaId: number;
  tanggal: string;        // ISO date "YYYY-MM-DD"
  status: Status;
  isFuture?: boolean;
  size?: "sm" | "md";
}) {
  const [status, setStatus] = useState<Status>(initStatus);
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dim = size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[11px]";

  // Future → gray placeholder
  if (isFuture) {
    return (
      <div className={`${dim} rounded-full bg-gray-100 border border-dashed border-gray-200`} title="Belum terjadwal" />
    );
  }

  // Belum diisi → kuning pulsing, click = hadir
  if (!status) {
    return (
      <button
        disabled={isPending}
        title="Belum diisi — klik tandai Hadir"
        onClick={() => {
          setStatus("hadir");
          startTransition(() => markSiswaHadir(siswaId, tanggal));
        }}
        className={`${dim} rounded-full border-2 border-amber-400 bg-amber-50 font-bold text-amber-500 ${
          isPending ? "opacity-40" : "animate-pulse hover:animate-none hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
        } transition-all flex items-center justify-center cursor-pointer`}
      >
        {isPending ? "…" : "?"}
      </button>
    );
  }

  const cfg = STATUS_CFG[status];

  return (
    <div className="relative">
      <button
        title={`${cfg.label} — klik untuk ganti`}
        onClick={() => setShowMenu((v) => !v)}
        className={`${dim} rounded-full ${cfg.bg} font-bold text-white flex items-center justify-center
          ring-2 ${cfg.ring} ring-offset-1 hover:scale-110 transition-transform cursor-pointer`}
      >
        {cfg.icon}
      </button>

      {/* Quick status menu */}
      {showMenu && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-8 flex gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {STATUS_ORDER.map((s) => {
            const c = STATUS_CFG[s];
            return (
              <button key={s} title={c.label}
                onClick={() => {
                  setStatus(s);
                  setShowMenu(false);
                  startTransition(() => setSiswaStatus(siswaId, tanggal, s));
                }}
                className={`h-6 w-6 rounded-full ${c.bg} text-white text-[9px] font-bold flex items-center justify-center
                  hover:scale-125 transition-transform ${s === status ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""}`}>
                {c.icon}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
