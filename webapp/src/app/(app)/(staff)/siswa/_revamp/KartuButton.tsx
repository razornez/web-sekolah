"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const THEMES = [
  { key: "ungu", tk: "thUngu", grad: "linear-gradient(135deg, var(--ak-primary), var(--ak-lav-deep))" },
  { key: "navy", tk: "thNavy", grad: "linear-gradient(135deg, #1A1830, #3B2FA6)" },
  { key: "hijau", tk: "thHijau", grad: "linear-gradient(135deg, #2EA171, #1F7E4F)" },
  { key: "emas", tk: "thEmas", grad: "linear-gradient(135deg, #C68A1C, #8A5D0E)" },
];

export function KartuButton({ nama, nisn, kelas, inisial, sekolah, ttl }: { nama: string; nisn: string; kelas: string; inisial: string; sekolah: string; ttl: string }) {
  const t = useTranslations("siswa");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(0);
  const [format, setFormat] = useState<"iso" | "lanyard">("iso");
  const [belakang, setBelakang] = useState<"ortu" | "darurat">("ortu");

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>{t("detail.kartuBtn")}</button>
      <div className={`km-ov${open ? " show" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="km" style={{ position: "relative" }}>
          <button className="km-close" onClick={() => setOpen(false)} aria-label="Tutup">✕</button>
          <div className="km-stage">
            <div className={`kartu${format === "lanyard" ? " lanyard" : ""}`} style={{ background: THEMES[theme].grad }}>
              <div className="kh">{sekolah} · {t("detail.kartuSuffix")}</div>
              <div className="kbody">
                <div className="kphoto">{inisial}</div>
                <div>
                  <div className="kname">{nama}</div>
                  <div className="krow">NISN {nisn}</div>
                  <div className="krow">{t("detail.kKelas")} {kelas}</div>
                  <div className="krow">{ttl}</div>
                </div>
              </div>
              <div className="kqr">QR</div>
            </div>
            <div className="kback-note">{t("detail.kartuBack", { x: belakang === "ortu" ? t("detail.bkOrtu") : t("detail.bkDarurat") })}</div>
          </div>
          <div className="km-side">
            <h3>{t("detail.kartuTitle")}</h3>
            <div className="km-lbl">{t("detail.kartuTema")}</div>
            <div className="km-themes named">
              {THEMES.map((th, i) => (
                <button key={th.key} className={theme === i ? "on" : ""} onClick={() => setTheme(i)}>
                  <span className="dot" style={{ background: th.grad }} />{t(`detail.${th.tk}`)}
                </button>
              ))}
            </div>
            <div className="km-lbl">{t("detail.kartuFormat")}</div>
            <div className="km-seg">
              <button className={format === "iso" ? "on" : ""} onClick={() => setFormat("iso")}>🪪 {t("detail.fmtIso")}</button>
              <button className={format === "lanyard" ? "on" : ""} onClick={() => setFormat("lanyard")}>📛 {t("detail.fmtLanyard")}</button>
            </div>
            <div className="km-lbl">{t("detail.kartuBelakang")}</div>
            <div className="km-seg">
              <button className={belakang === "ortu" ? "on" : ""} onClick={() => setBelakang("ortu")}>👪 {t("detail.bkOrtu")}</button>
              <button className={belakang === "darurat" ? "on" : ""} onClick={() => setBelakang("darurat")}>🚨 {t("detail.bkDarurat")}</button>
            </div>
            <div className="km-actions">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>{t("edit.cancel")}</button>
              <button className="btn btn-primary" onClick={() => window.print()}>{t("detail.kartuDownload")}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
