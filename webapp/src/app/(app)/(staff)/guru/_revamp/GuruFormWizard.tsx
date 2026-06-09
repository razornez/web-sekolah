"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import "./form.css";
import { saveGuru, type GuruFormState } from "../actions";

type F = Record<string, string>;
const STEPS = [
  { key: "identitas", ico: "1", fields: ["namaGuru", "jenisKelamin", "tempatLahir", "tanggalLahir", "nik"] },
  { key: "kepegawaian", ico: "2", fields: ["statusGuru", "nip", "nuptk", "npk", "pangkat", "golongan", "jenisJabatan", "tmt"] },
  { key: "kontak", ico: "3", fields: ["alamat", "email", "noTelp"] },
  { key: "tinjau", ico: "4", fields: [] },
];
const STATUS = ["PNS", "GTT", "GTY", "PPPK", "Honorer"];
const WAJIB = ["namaGuru", "jenisKelamin", "statusGuru"];

export function GuruFormWizard() {
  const router = useRouter();
  const t = useTranslations("guru");
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [f, setF] = useState<F>({ jenisKelamin: "", statusGuru: "" });
  const [state, formAction, pending] = useActionState<GuruFormState, FormData>(saveGuru, { ok: false });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (state.ok) router.push(state.to ?? "/guru"); }, [state, router]);

  const filled = ["namaGuru", "jenisKelamin", "tempatLahir", "tanggalLahir", "nik", "statusGuru", "nip", "nuptk", "pangkat", "golongan", "tmt", "email"].filter((k) => (f[k] ?? "").trim());
  const pct = Math.round((filled.length / 12) * 100);
  const last = step === STEPS.length - 1;
  const inisial = (f.namaGuru || "?").replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

  function goNext() {
    if (step === 0 && !(f.namaGuru ?? "").trim()) { setErr(t("errNama")); return; }
    if (step === 1 && !(f.statusGuru ?? "").trim()) { setErr(t("errStatus")); return; }
    setErr(""); setStep((s) => s + 1);
  }

  const Wajib = (k: string) => (filled.includes(k) || !WAJIB.includes(k) ? null : <span className="gf-req">*</span>);

  return (
    <div id="ak-gf">
      <div className="gf-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><b>{t("newTitle")}</b></div>
      <h1 className="gf-h1">{t("newTitle")}</h1>
      <p className="gf-sub">{t("formSub")}</p>

      <div className="gf-shell">
        <aside className="gf-sidebar">
          <span className="gf-side-eyebrow">{t("panduan")}</span>
          <h3>{t("selesai4")}</h3>
          <div className="gf-steps">
            {STEPS.map((s, i) => (
              <button type="button" key={s.key} className={`gf-step${i === step ? " on" : ""}${i < step ? " done" : ""}`} onClick={() => i < step && setStep(i)}>
                <span className="gf-stepn">{i < step ? "✓" : s.ico}</span>
                <div><b>{t(`stepT_${s.key}`)}</b><span>{t(`stepS_${s.key}`)}</span></div>
              </button>
            ))}
          </div>
          <div className="gf-tip">💡 {t("formTip")}</div>
        </aside>

        <form action={formAction} className="gf-main">
          {STEPS.flatMap((s) => s.fields).map((fld) => <input key={fld} type="hidden" name={fld} value={f[fld] ?? ""} />)}

          <div className="gf-stepline">{t("langkahN", { n: step + 1, total: STEPS.length, label: t(`stepT_${STEPS[step].key}`) })}</div>

          {step === 0 && (
            <div className="gf-body">
              <h2>{t("step0H")} 👋</h2>
              <div className="gf-f"><label>{t("formNamaGuru")} {Wajib("namaGuru")}</label><input value={f.namaGuru ?? ""} onChange={(e) => set("namaGuru", e.target.value)} placeholder="cth. Sri Mulyani, S.Pd" /></div>
              <div className="gf-f"><label>{t("formJenisKelamin")} {Wajib("jenisKelamin")}</label><div className="gf-jk"><button type="button" className={f.jenisKelamin === "P" ? "on" : ""} onClick={() => set("jenisKelamin", "P")}>👩 {t("optPerempuan")}</button><button type="button" className={f.jenisKelamin === "L" ? "on" : ""} onClick={() => set("jenisKelamin", "L")}>👨 {t("optLaki")}</button></div></div>
              <div className="gf-2"><div className="gf-f"><label>{t("formTempatLahir")}</label><input value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} /></div><div className="gf-f"><label>{t("formTanggalLahir")}</label><input type="date" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div></div>
              <div className="gf-f"><label>{t("formNik")}</label><input maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} /></div>
            </div>
          )}
          {step === 1 && (
            <div className="gf-body">
              <h2>{t("step1H")}</h2>
              <div className="gf-f"><label>{t("formStatus")} {Wajib("statusGuru")}</label><div className="gf-chips">{STATUS.map((s) => <button type="button" key={s} className={f.statusGuru === s ? "on" : ""} onClick={() => set("statusGuru", s)}>{s}</button>)}</div></div>
              <div className="gf-2"><div className="gf-f"><label>{t("formNip")}</label><input value={f.nip ?? ""} onChange={(e) => set("nip", e.target.value)} /></div><div className="gf-f"><label>{t("formNuptk")}</label><input value={f.nuptk ?? ""} onChange={(e) => set("nuptk", e.target.value)} /></div></div>
              <div className="gf-2"><div className="gf-f"><label>{t("formPangkat")}</label><input value={f.pangkat ?? ""} onChange={(e) => set("pangkat", e.target.value)} /></div><div className="gf-f"><label>{t("formGolongan")}</label><input value={f.golongan ?? ""} onChange={(e) => set("golongan", e.target.value)} /></div></div>
              <div className="gf-2"><div className="gf-f"><label>{t("formJabatan")}</label><input value={f.jenisJabatan ?? ""} onChange={(e) => set("jenisJabatan", e.target.value)} placeholder="Guru Mapel" /></div><div className="gf-f"><label>{t("formTmt")}</label><input type="date" value={f.tmt ?? ""} onChange={(e) => set("tmt", e.target.value)} /></div></div>
            </div>
          )}
          {step === 2 && (
            <div className="gf-body">
              <h2>{t("step2H")}</h2>
              <div className="gf-f"><label>{t("formAlamat")}</label><textarea rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} /></div>
              <div className="gf-2"><div className="gf-f"><label>{t("formEmail")}</label><input value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div><div className="gf-f"><label>{t("formNoTelp")}</label><input value={f.noTelp ?? ""} onChange={(e) => set("noTelp", e.target.value)} /></div></div>
              <p className="gf-note">{t("formNoteRelasi")}</p>
            </div>
          )}
          {step === 3 && (
            <div className="gf-body">
              <h2>{t("step3H")}</h2>
              <div className="gf-review">
                <div><span>{t("formNamaGuru")}</span><b>{f.namaGuru || "—"}</b></div>
                <div><span>{t("formJenisKelamin")}</span><b>{f.jenisKelamin === "P" ? t("optPerempuan") : f.jenisKelamin === "L" ? t("optLaki") : "—"}</b></div>
                <div><span>{t("formStatus")}</span><b>{f.statusGuru || "—"}</b></div>
                <div><span>NIP</span><b>{f.nip || "—"}</b></div>
                <div><span>{t("formJabatan")}</span><b>{f.jenisJabatan || "—"}</b></div>
                <div><span>{t("formEmail")}</span><b>{f.email || "—"}</b></div>
              </div>
              <p className="gf-note">{t("formNoteAkun")}</p>
            </div>
          )}

          {(state.message || err) && <p className="gf-err">{state.message || err}</p>}

          <div className="gf-foot">
            <span className="gf-auto">{t("tersimpanDraf")}</span>
            {step > 0 && <button type="button" className="gf-back" onClick={() => setStep((s) => s - 1)}>← {t("mundur")}</button>}
            {!last ? <button type="button" className="gf-next" onClick={goNext}>{t("selanjutnya")} →</button>
              : <button type="submit" className="gf-save" disabled={pending}>{pending ? t("saving") : `✓ ${t("simpanGuru")}`}</button>}
          </div>
        </form>

        <aside className="gf-preview">
          <span className="gf-prev-eyebrow">🪪 {t("kartuGuruPtk")} · <i>{t("livePreview")}</i></span>
          <div className="gf-card">
            <div className="gf-card-photo">{inisial}</div>
            <div className="gf-card-body">
              <div className="gf-card-name">{f.namaGuru || t("namaPlaceholder")}</div>
              <div className="gf-card-role">{f.jenisJabatan || t("guruLabel")}{f.statusGuru ? ` · ${f.statusGuru}` : ""}</div>
              <div className="gf-card-meta">{f.nip ? `NIP ${f.nip}` : t("nipBelum")}</div>
            </div>
          </div>
          <div className="gf-complete">
            <div className="gf-cbar"><i style={{ width: `${pct}%` }} /></div>
            <div className="gf-cmeta"><b>{pct}% {t("lengkap")}</b><span>{t("dariWajib", { n: filled.filter((k) => WAJIB.includes(k)).length })}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
