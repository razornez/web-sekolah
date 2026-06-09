"use client";
import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { JadwalSlot } from "./detailData";

const HARI = [{ u: 1, n: "Senin", en: "Mon" }, { u: 2, n: "Selasa", en: "Tue" }, { u: 3, n: "Rabu", en: "Wed" }, { u: 4, n: "Kamis", en: "Thu" }, { u: 5, n: "Jumat", en: "Fri" }];
const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };

export function JadwalGrid({ jadwal }: { jadwal: JadwalSlot[] }) {
  const t = useTranslations("guru");
  const [now, setNow] = useState<{ day: number; mins: number } | null>(null);
  useEffect(() => {
    const upd = () => { const d = new Date(); setNow({ day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() }); };
    upd(); const id = setInterval(upd, 60000); return () => clearInterval(id);
  }, []);
  if (!jadwal.length) return <p className="gd-muted" style={{ padding: "20px 0" }}>{t("jadwalEmpty")}</p>;

  const slots = [...new Set(jadwal.map((j) => `${j.jamMulai}~${j.jamSelesai}`))].sort();
  const cell = (slot: string, u: number) => jadwal.find((j) => `${j.jamMulai}~${j.jamSelesai}` === slot && j.urut === u);
  const isNow = (slot: string, u: number) => { if (!now || now.day !== u) return false; const [s, e] = slot.split("~"); return now.mins >= toMin(s) && now.mins < toMin(e); };

  return (
    <div className="jdw-grid">
      <div className="jdw-corner" />
      {HARI.map((h) => <div key={h.u} className={`jdw-day${now?.day === h.u ? " today" : ""}`}>{h.n}</div>)}
      {slots.map((slot) => (
        <Fragment key={slot}>
          <div className="jdw-time">{slot.split("~")[0]}<small>{slot.split("~")[1]}</small></div>
          {HARI.map((h) => {
            const c = cell(slot, h.u); const nw = isNow(slot, h.u);
            return (
              <div key={h.u} className={`jdw-cell${c ? " filled" : ""}${nw ? " now" : ""}${now?.day === h.u ? " todaycol" : ""}`}>
                {c && <><b>{c.kelas}</b><span>{c.mapel}</span></>}
                {nw && <span className="jdw-now">● {t("sekarang")}</span>}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
