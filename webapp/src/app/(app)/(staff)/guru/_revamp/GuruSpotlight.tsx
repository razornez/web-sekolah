"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SpotlightItem } from "./listData";

export function GuruSpotlight({ pool }: { pool: SpotlightItem[] }) {
  const t = useTranslations("guru");
  const [i, setI] = useState(0);
  const [spin, setSpin] = useState(false);
  if (!pool.length) return <div className="pulse-card spotlight" />;
  const g = pool[i % pool.length];
  const shuffle = () => {
    setSpin(true);
    setI((x) => (pool.length > 1 ? (x + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length : x));
    setTimeout(() => setSpin(false), 450);
  };
  return (
    <div className="pulse-card spotlight">
      <div className="sp-head"><span className="sp-eyebrow"><span className={`sp-slot${spin ? " spin" : ""}`}>🎰</span> {t("spotEyebrow")}</span><button onClick={shuffle} className="sp-ganti">↻ {t("spotGanti")}</button></div>
      <h3 className="sp-title">{t("spotTitle")}</h3>
      <div className={`sp-guru${spin ? " fade" : ""}`}>
        <div className="sp-av">{g.foto ? <img src={g.foto} alt="" /> : g.inisial}</div>
        <div><div className="sp-nama">{g.nama}</div><div className="sp-role">{g.role}</div></div>
      </div>
      <p className={`sp-story${spin ? " fade" : ""}`}>{t(`spotStory_${g.kind}`, { thn: g.thn, extra: g.extra })}</p>
      <div className="sp-actions">
        <button className="sp-btn pri">🙏 {t("spotApresiasi")}</button>
        <Link href={`/guru/${g.id}`} className="sp-btn">📋 {t("spotProfil")}</Link>
        <Link href={`/guru/${g.id}#jadwal`} className="sp-btn">📅 {t("spotJadwal")}</Link>
      </div>
    </div>
  );
}
