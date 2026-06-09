"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "./kartu.css";

type KData = {
  id: number; nama: string; inisial: string; foto: string | null; role: string; wali: string | null;
  nip: string; nuptk: string; status: string; berlaku: string; noTelp: string | null; alamat: string | null;
  sekolah: string; sekolahAlamat: string; kepala: string; npsn: string;
};
const THEMES = [
  { key: "ungu", grad: "linear-gradient(155deg,#5B4FE9,#3B2FA6)", tk: "th_ungu", dot: "#5B4FE9" },
  { key: "navy", grad: "linear-gradient(155deg,#1A1830,#2B3A67)", tk: "th_navy", dot: "#2B3A67" },
  { key: "hijau", grad: "linear-gradient(155deg,#2EA171,#1F7E4F)", tk: "th_hijau", dot: "#2EA171" },
  { key: "emas", grad: "linear-gradient(155deg,#C68A1C,#8A5D0E)", tk: "th_emas", dot: "#C68A1C" },
  { key: "hitam", grad: "linear-gradient(155deg,#34343a,#0f0f12)", tk: "th_hitam", dot: "#1a1a1d" },
];

export function KartuGuruClient({ data, totalGuru }: { data: KData; totalGuru: number }) {
  const t = useTranslations("guru");
  const [tema, setTema] = useState(0);
  const [flip, setFlip] = useState(false);
  const [format, setFormat] = useState<"iso" | "lanyard" | "a7">("iso");
  const [sisi, setSisi] = useState<"dua" | "depan">("dua");
  const [bahan, setBahan] = useState<"glossy" | "matte">("glossy");
  const [konten, setKonten] = useState<"darurat" | "medis" | "jadwal" | "kop">("darurat");
  const grad = THEMES[tema].grad;

  return (
    <div id="ak-gk">
      <div className="gk-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><Link href={`/guru/${data.id}`}>{data.nama}</Link><span>/</span><b>{t("kartuPageTitle")}</b></div>
      <h1 className="gk-h1">📇 {t("kartuPageTitle")}</h1>
      <p className="gk-sub">{t("kartuPageSub")}</p>

      <div className="gk-shell">
        {/* STAGE */}
        <div className="gk-stage">
          <div className="gk-tabs">
            <button className={!flip ? "on" : ""} onClick={() => setFlip(false)}>🪪 {t("depan")}</button>
            <button className={flip ? "on" : ""} onClick={() => setFlip(true)}>🔄 {t("belakang")}</button>
          </div>
          <div className={`gk-card-wrap ${format}`} onClick={() => setFlip((v) => !v)}>
            <div className={`gk-card${flip ? " flipped" : ""}${bahan === "matte" ? " matte" : ""}`}>
              <div className="gk-face gk-front" style={{ background: grad }}>
                <div className="gk-kop"><b>{data.sekolah}</b><span>{data.sekolahAlamat}</span></div>
                <span className="gk-badge">{t("kartuPengenal")}</span>
                <div className="gk-photo">{data.foto ? <img src={data.foto} alt="" /> : data.inisial}</div>
                <div className="gk-name">{data.nama}</div>
                <div className="gk-role">{data.role}{data.wali ? ` · ${t("waliShort")} ${data.wali}` : ""}</div>
                <div className="gk-databox">
                  <div><span>NIP</span><b>{data.nip}</b></div>
                  <div><span>NUPTK</span><b>{data.nuptk}</b></div>
                  <div><span>Status</span><b>{data.status}</b></div>
                  <div><span>{t("berlaku")}</span><b>s.d. {data.berlaku}</b></div>
                </div>
                <div className="gk-foot"><div className="gk-qr" /><div className="gk-ttd"><span>{t("kepalaSekolah")}</span><b>{data.kepala}</b></div></div>
              </div>
              <div className="gk-face gk-back" style={{ background: grad }}>
                <div className="gk-back-head">{data.sekolah} · {t("kartuPengenal")}</div>
                <div className="gk-back-body">
                  {konten === "darurat" && <><h4>🚨 {t("kontakDarurat")}</h4><p>{data.noTelp ?? "—"}<br /><small>{data.alamat ?? "—"}</small></p></>}
                  {konten === "medis" && <><h4>🩺 {t("infoMedisLabel")}</h4><p>{t("medisPlaceholder")}</p></>}
                  {konten === "jadwal" && <><h4>📅 {t("jadwalMengajar")}</h4><p>{t("lihatDetail")}</p></>}
                  {konten === "kop" && <><h4>🏫 {t("kopSekolah")}</h4><p>{data.sekolah}<br /><small>NPSN {data.npsn}</small></p></>}
                  <div className="gk-warn">⚠ {t("kartuHilang")}</div>
                </div>
                <div className="gk-back-foot">akadewa.app/v/{data.id}</div>
              </div>
            </div>
          </div>
          <p className="gk-hint">{t("klikBalik")}</p>
        </div>

        {/* CONTROLS */}
        <div className="gk-controls">
          <div className="gk-cc">
            <h3>🎨 {t("temaWarna")}</h3>
            <div className="gk-themes">{THEMES.map((th, i) => <button key={th.key} className={tema === i ? "on" : ""} onClick={() => setTema(i)}><span className="dot" style={{ background: th.dot }} />{t(th.tk)}</button>)}</div>
          </div>
          <div className="gk-cc">
            <h3>📐 {t("formatUkuran")}</h3>
            <label className="gk-lbl">{t("ukuran")}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}><option value="iso">{t("idCardIso")}</option><option value="lanyard">{t("lanyard")}</option><option value="a7">A7</option></select>
            <label className="gk-lbl">{t("sisiCetak")}</label>
            <div className="gk-seg"><button className={sisi === "dua" ? "on" : ""} onClick={() => setSisi("dua")}>{t("duaSisi")}</button><button className={sisi === "depan" ? "on" : ""} onClick={() => setSisi("depan")}>{t("depanSaja")}</button></div>
            <label className="gk-lbl">{t("bahanKartu")}</label>
            <div className="gk-seg"><button className={bahan === "glossy" ? "on" : ""} onClick={() => setBahan("glossy")}>PVC Glossy</button><button className={bahan === "matte" ? "on" : ""} onClick={() => setBahan("matte")}>PVC Matte</button></div>
          </div>
          <div className="gk-cc">
            <h3>📑 {t("kontenBelakang")}</h3>
            <div className="gk-seg wrap">
              <button className={konten === "darurat" ? "on" : ""} onClick={() => { setKonten("darurat"); setFlip(true); }}>📞 {t("infoDarurat")}</button>
              <button className={konten === "medis" ? "on" : ""} onClick={() => { setKonten("medis"); setFlip(true); }}>🩺 {t("infoMedis")}</button>
              <button className={konten === "jadwal" ? "on" : ""} onClick={() => { setKonten("jadwal"); setFlip(true); }}>📅 {t("jadwalMengajar")}</button>
              <button className={konten === "kop" ? "on" : ""} onClick={() => { setKonten("kop"); setFlip(true); }}>🏫 {t("kopSekolah")}</button>
            </div>
          </div>
          <div className="gk-cc">
            <h3>⬇ {t("unduhBagikan")}</h3>
            <div className="gk-dl">
              <button className="gk-pdf" onClick={() => window.print()}>⬇ {t("unduhPdf")}</button>
              <button className="gk-png" onClick={() => window.print()}>🖼 PNG</button>
            </div>
            {data.noTelp && <a className="gk-wa" href={`https://wa.me/${data.noTelp.replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer">💬 {t("kirimWa")}</a>}
          </div>
          <div className="gk-mass">
            <h3>🖨 {t("cetakMassal")}</h3>
            <p>{t("cetakMassalSub")}</p>
            <button onClick={() => window.print()}>🖨 {t("cetakNkartu", { n: totalGuru })}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
