"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const THEMES = [
  { key: "ungu", grad: "linear-gradient(135deg, var(--ak-primary), var(--ak-lav-deep))" },
  { key: "navy", grad: "linear-gradient(135deg, #1A1830, #3B2FA6)" },
  { key: "hijau", grad: "linear-gradient(135deg, #2EA171, #1F7E4F)" },
  { key: "emas", grad: "linear-gradient(135deg, #C68A1C, #8A5D0E)" },
];

export function KartuButton({ nama, nisn, kelas, inisial, sekolah, ttl }: { nama: string; nisn: string; kelas: string; inisial: string; sekolah: string; ttl: string }) {
  const t = useTranslations("siswa");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(0);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>{t("detail.kartuBtn")}</button>
      <div className={`km-ov${open ? " show" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="km" style={{ position: "relative" }}>
          <button className="km-close" onClick={() => setOpen(false)} aria-label="Tutup">✕</button>
          <div className="kartu" style={{ background: THEMES[theme].grad }}>
            <div className="kh">{sekolah} · {t("detail.kartuSuffix")}</div>
            <div className="kbody">
              <div className="kphoto">{inisial}</div>
              <div>
                <div className="kname">{nama}</div>
                <div className="krow">NISN {nisn}</div>
                <div className="krow">Kelas {kelas}</div>
                <div className="krow">{ttl}</div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 14, right: 16, width: 44, height: 44, borderRadius: 8, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "var(--ak-ink)" }}>QR</div>
          </div>
          <div className="km-side">
            <h3>{t("detail.kartuTitle")}</h3>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--ak-muted)", marginBottom: 8 }}>{t("detail.kartuTema")}</div>
            <div className="km-themes">
              {THEMES.map((th, i) => (
                <button key={th.key} onClick={() => setTheme(i)} style={{ background: th.grad, borderColor: theme === i ? "var(--ak-primary)" : "transparent" }} aria-label={th.key} />
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--ak-ink-2)", lineHeight: 1.5 }}>{t("detail.kartuDesc")}</p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => window.print()}>{t("detail.kartuDownload")}</button>
          </div>
        </div>
      </div>
    </>
  );
}
