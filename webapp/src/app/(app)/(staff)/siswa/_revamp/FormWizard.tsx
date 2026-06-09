"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import "./form.css";
import { saveSiswa, type SiswaFormState } from "../actions";
import { zodiakFromDate, numerologi, bmi } from "../_lib/persona";

const STATUS = ["aktif", "lulus", "pindah", "keluar", "alumni"];
const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FormWizard({ rombels, sekolah }: { rombels: { id: number; nama: string; tahun: string }[]; sekolah: string }) {
  const router = useRouter();
  const t = useTranslations("siswa");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Record<string, string>>({ jenisKelamin: "P", status: "aktif" });
  const [err, setErr] = useState("");
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(saveSiswa, { ok: false });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  function goNext() {
    if (step === 0) {
      if (!(f.namaLengkap ?? "").trim()) { setErr(t("wizard.errNama")); return; }
      if (!f.tanggalLahir) { setErr(t("wizard.errTgl")); return; }
    }
    setErr("");
    setStep((s) => s + 1);
  }

  useEffect(() => { if (state.ok) router.push(state.to ?? "/siswa"); }, [state, router]);

  const tgl = f.tanggalLahir ? new Date(f.tanggalLahir) : null;
  const valid = tgl && !isNaN(tgl.getTime());
  const z = valid ? zodiakFromDate(tgl) : null;
  const nm = valid ? numerologi(tgl) : null;
  const b = bmi(Number(f.tinggiBadan) || 0, Number(f.beratBadan) || 0);
  const rombel = rombels.find((r) => String(r.id) === f.rombelId);
  const inisial = (f.namaLengkap || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const ttlStr = valid ? `${f.tempatLahir || ""}${f.tempatLahir ? ", " : ""}${tgl.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}` : "—";

  const checks = [
    { k: t("wizard.drIdentitas"), v: f.namaLengkap, show: f.namaLengkap || "" },
    { k: t("wizard.drTgl"), v: valid ? "1" : "", show: ttlStr !== "—" ? ttlStr : "" },
    { k: t("wizard.drFoto"), v: "", show: "" },
    { k: t("wizard.drNisn"), v: f.nisn, show: f.nisn || "" },
    { k: t("wizard.drKelas"), v: f.rombelId, show: rombel?.nama || "" },
    { k: t("wizard.drAlamat"), v: f.alamat, show: f.alamat || "" },
    { k: t("wizard.drOrtu"), v: f.ayah_nama || f.ibu_nama, show: f.ayah_nama || f.ibu_nama || "" },
    { k: t("wizard.drTinggi"), v: f.tinggiBadan && f.beratBadan ? "1" : "", show: f.tinggiBadan && f.beratBadan ? `${f.tinggiBadan}/${f.beratBadan}` : "" },
    { k: t("wizard.drHp"), v: f.noHp, show: f.noHp || "" },
  ];
  const done = checks.filter((c) => c.v).length;
  const pct = Math.round((done / checks.length) * 100);
  const last = step === 3;
  const stepTitle = (i: number) => t(`wizard.s${i + 1}t`);

  return (
    <div id="ak-sf">
      <div className="sf-head"><h1>{t("wizard.pageTitle")}</h1><p>{t("wizard.pageSub")}</p></div>

      <div className="form-shell">
        <div className="form-card">
          <aside className="stepper">
            <div className="stepper-ttl">{t("wizard.guide")}</div>
            <h3>{t("wizard.guideHeading")}</h3>
            <div className="step-list">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`step${i === step ? " active" : i < step ? " done" : ""}`} onClick={() => i < step && setStep(i)}>
                  <div className="n-c"><span>{i < step ? "✓" : i + 1}</span></div>
                  <div className="info"><div className="t">{stepTitle(i)}</div><div className="s">{t(`wizard.s${i + 1}s`)}</div></div>
                </div>
              ))}
            </div>
            <div className="stepper-foot"><div className="stepper-tip">{t("wizard.tip")}</div></div>
          </aside>

          <form action={formAction} className="form-main">
            <input type="hidden" name="namaLengkap" value={f.namaLengkap || ""} />
            <input type="hidden" name="jenisKelamin" value={f.jenisKelamin || ""} />
            <input type="hidden" name="status" value={f.status || "aktif"} />
            {["tempatLahir", "tanggalLahir", "nik", "agama", "anakKe", "hobi", "citaCita", "nisn", "nis", "noInduk", "tahunMasuk", "asalSekolah", "rombelId", "alamat", "desaKel", "kecamatan", "kabupaten", "kodePos", "noHp", "tinggalDengan", "transportasi", "tinggiBadan", "beratBadan", "golonganDarah", "kebutuhanKhusus", "ayah_nama", "ayah_pekerjaan", "ayah_pendidikan", "ayah_hp", "ibu_nama", "ibu_pekerjaan", "ibu_pendidikan", "ibu_hp"].map((k) => (
              <input key={k} type="hidden" name={k} value={f[k] ?? ""} />
            ))}

            <div className="form-top">
              <span className="lbl">{t("wizard.stepLabel", { n: step + 1, step: stepTitle(step) })}</span>
              <div className="progress">{[0, 1, 2, 3].map((i) => <span key={i} className={i < step ? "done" : i === step ? "current" : ""} />)}</div>
            </div>

            <div className="form-content">
              {(state.message || err) && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>{state.message || err}</p>}

              {/* STEP 1 */}
              <div className={`pane${step === 0 ? " show" : ""}`}>
                <h2>{t("wizard.p1h")}</h2>
                <p className="desc">{t("wizard.p1d")}</p>
                <div className="photo-upload">
                  <div className="ph"><span>{inisial}</span><div className="cam">📷</div></div>
                  <div className="meta"><div className="t">{t("wizard.photoTitle")}</div><div className="s">{t("wizard.photoDesc")}</div><div className="lim">{t("wizard.photoHint")}</div></div>
                </div>
                <div className="field"><label>{t("formNamaLengkap")}<span className="req">*</span></label><input type="text" value={f.namaLengkap ?? ""} onChange={(e) => set("namaLengkap", e.target.value)} placeholder="Ananda Putri Lestari" /></div>
                <div className="field"><label>{t("formJenisKelamin")}<span className="req">*</span></label>
                  <div className="jk-toggle">
                    {([["P", "👧", t("wizard.jkP"), t("wizard.jkAsP")], ["L", "👦", t("wizard.jkL"), t("wizard.jkAsL")]] as const).map(([v, em, lbl, as]) => (
                      <label key={v} className={f.jenisKelamin === v ? "selected" : ""} onClick={() => set("jenisKelamin", v)}>
                        <span className="emoji">{em}</span><span className="info-r"><span className="t">{lbl}</span><span className="s">{as}</span></span>
                        <span className="check"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 5 L4 7 L8 3" /></svg></span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>{t("formTempatLahir")}</label><input type="text" value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} /></div>
                  <div className="field"><label>{t("formTanggalLahir")}<span className="req">*</span></label><input type="date" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">{t("wizard.divIdentitas")}</span><div className="ln" /></div>
                <div className="grid-3">
                  <div className="field"><label>{t("formNik")}</label><input type="text" maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} /></div>
                  <div className="field"><label>{t("formAgama")}</label><select value={f.agama ?? ""} onChange={(e) => set("agama", e.target.value)}><option value="">—</option>{AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
                  <div className="field"><label>{t("formAnakKe")}</label><input type="number" min={1} value={f.anakKe ?? ""} onChange={(e) => set("anakKe", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>{t("formHobi")}</label><input type="text" value={f.hobi ?? ""} onChange={(e) => set("hobi", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fCita")}</label><input type="text" value={f.citaCita ?? ""} onChange={(e) => set("citaCita", e.target.value)} /></div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className={`pane${step === 1 ? " show" : ""}`}>
                <h2>{t("wizard.p2h")}</h2>
                <p className="desc">{t("wizard.p2d")}</p>
                <div className="grid-3">
                  <div className="field"><label>{t("formNisn")}</label><input type="text" value={f.nisn ?? ""} onChange={(e) => set("nisn", e.target.value)} /></div>
                  <div className="field"><label>{t("formNis")}</label><input type="text" value={f.nis ?? ""} onChange={(e) => set("nis", e.target.value)} /></div>
                  <div className="field"><label>{t("formNoInduk")}</label><input type="text" value={f.noInduk ?? ""} onChange={(e) => set("noInduk", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>{t("formTahunMasuk")}</label><input type="number" value={f.tahunMasuk ?? ""} onChange={(e) => set("tahunMasuk", e.target.value)} placeholder="2025" /></div>
                  <div className="field"><label>{t("formAsalSekolah")}</label><input type="text" value={f.asalSekolah ?? ""} onChange={(e) => set("asalSekolah", e.target.value)} /></div>
                </div>
                <div className="field"><label>{t("formStatus")}</label><div className="chip-pick">{STATUS.map((s) => <button type="button" key={s} className={f.status === s ? "selected" : ""} onClick={() => set("status", s)}>{t(`status${cap(s)}`)}</button>)}</div></div>
                <div className="field"><label>{t("wizard.rombelLabel")}</label><select value={f.rombelId ?? ""} onChange={(e) => set("rombelId", e.target.value)}><option value="">{t("wizard.rombelNone")}</option>{rombels.map((r) => <option key={r.id} value={r.id}>{r.nama} · {r.tahun}</option>)}</select></div>
              </div>

              {/* STEP 3 */}
              <div className={`pane${step === 2 ? " show" : ""}`}>
                <h2>{t("wizard.p3h")}</h2>
                <p className="desc">{t("wizard.p3d")}</p>
                <div className="field"><label>{t("formAlamatLengkap")}</label><textarea rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} /></div>
                <div className="grid-3">
                  <div className="field"><label>{t("wizard.fDesa")}</label><input type="text" value={f.desaKel ?? ""} onChange={(e) => set("desaKel", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fKec")}</label><input type="text" value={f.kecamatan ?? ""} onChange={(e) => set("kecamatan", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fKab")}</label><input type="text" value={f.kabupaten ?? ""} onChange={(e) => set("kabupaten", e.target.value)} /></div>
                </div>
                <div className="grid-3">
                  <div className="field"><label>{t("wizard.fKodePos")}</label><input type="text" value={f.kodePos ?? ""} onChange={(e) => set("kodePos", e.target.value)} /></div>
                  <div className="field"><label>{t("formNoHp")}</label><input type="text" value={f.noHp ?? ""} onChange={(e) => set("noHp", e.target.value)} /></div>
                  <div className="field"><label>{t("formTransportasi")}</label><input type="text" value={f.transportasi ?? ""} onChange={(e) => set("transportasi", e.target.value)} /></div>
                </div>
                <div className="field"><label>{t("formTinggalBersama")}</label><input type="text" value={f.tinggalDengan ?? ""} onChange={(e) => set("tinggalDengan", e.target.value)} /></div>
              </div>

              {/* STEP 4 */}
              <div className={`pane${step === 3 ? " show" : ""}`}>
                <h2>{t("wizard.p4h")}</h2>
                <p className="desc">{t("wizard.p4d")}</p>
                <div className="div-line"><span className="t">{t("wizard.ayah")}</span><div className="ln" /></div>
                <div className="grid-2">
                  <div className="field"><label>{t("wizard.fNama")}</label><input type="text" value={f.ayah_nama ?? ""} onChange={(e) => set("ayah_nama", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fPekerjaan")}</label><input type="text" value={f.ayah_pekerjaan ?? ""} onChange={(e) => set("ayah_pekerjaan", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fPendidikan")}</label><input type="text" value={f.ayah_pendidikan ?? ""} onChange={(e) => set("ayah_pendidikan", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fHp")}</label><input type="text" value={f.ayah_hp ?? ""} onChange={(e) => set("ayah_hp", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">{t("wizard.ibu")}</span><div className="ln" /></div>
                <div className="grid-2">
                  <div className="field"><label>{t("wizard.fNama")}</label><input type="text" value={f.ibu_nama ?? ""} onChange={(e) => set("ibu_nama", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fPekerjaan")}</label><input type="text" value={f.ibu_pekerjaan ?? ""} onChange={(e) => set("ibu_pekerjaan", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fPendidikan")}</label><input type="text" value={f.ibu_pendidikan ?? ""} onChange={(e) => set("ibu_pendidikan", e.target.value)} /></div>
                  <div className="field"><label>{t("wizard.fHp")}</label><input type="text" value={f.ibu_hp ?? ""} onChange={(e) => set("ibu_hp", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">{t("wizard.divKesehatan")}</span><div className="ln" /></div>
                <div className="grid-3">
                  <div className="field"><label>{t("formTinggiBadan")}</label><input type="number" value={f.tinggiBadan ?? ""} onChange={(e) => set("tinggiBadan", e.target.value)} /></div>
                  <div className="field"><label>{t("formBeratBadan")}</label><input type="number" value={f.beratBadan ?? ""} onChange={(e) => set("beratBadan", e.target.value)} /></div>
                  <div className="field"><label>{t("formGolDarah")}</label><select value={f.golonganDarah ?? ""} onChange={(e) => set("golonganDarah", e.target.value)}><option value="">—</option>{["A", "B", "AB", "O"].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                </div>
                {b && <div style={{ background: "var(--ak-mint)", color: "var(--ak-mint-deep)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{t("wizard.bmiAuto", { v: b.value, kat: b.kategori })}</div>}
                <div className="field" style={{ marginTop: 12 }}><label>{t("formKebutuhanKhusus")}</label><input type="text" value={f.kebutuhanKhusus ?? ""} onChange={(e) => set("kebutuhanKhusus", e.target.value)} /></div>
              </div>
            </div>

            <div className="form-foot">
              <span className="auto">{t("wizard.footAuto")}</span>
              <div className="sp" />
              {step > 0 && <button type="button" className="btn-g" onClick={() => setStep((s) => s - 1)}>{t("wizard.footMundur")}</button>}
              {!last
                ? <button type="button" className="btn-p" onClick={goNext}>{t("wizard.footNext")}</button>
                : <button type="submit" disabled={pending} className="btn-p save">{pending ? t("wizard.footSaving") : t("wizard.footSave")}</button>}
            </div>
          </form>
        </div>

        {/* PREVIEW RAIL */}
        <aside className="preview-rail">
          <div className="preview-card">
            <div className="preview-h"><h3>{t("wizard.previewTitle")}</h3><span className="live">{t("wizard.live")}</span></div>
            <div className="mini-kartu">
              <div className="mk-photo">{inisial}</div>
              <div className="mk-info">
                <div className="head">{sekolah}</div>
                <div className="nm">{f.namaLengkap || t("wizard.namaPlaceholder")}</div>
                <div className="kls">{rombel ? `${rombel.nama} · ${rombel.tahun}` : t("wizard.kelasNone")}</div>
                <div className="row">NISN <b>{f.nisn || "—"}</b></div>
                <div className="row">TTL <b>{ttlStr}</b></div>
              </div>
            </div>
            {z && nm ? (
              <div className="persona-hint">
                <div className="ttl">{t("wizard.personaTitle")}</div>
                <h4>{z.name} {z.sym} — {z.tags[2] ?? "—"}</h4>
                <p>{z.desc.split(".")[0]}. {nm.angka} — {nm.tags.join(", ").toLowerCase()}.</p>
              </div>
            ) : <div className="persona-hint"><div className="ttl">{t("wizard.personaTitle")}</div><p>{t("wizard.personaEmpty")}</p></div>}
          </div>

          <div className="preview-summary">
            <h3>{t("wizard.completionTitle")}</h3>
            <div className="completion"><div className="fill" style={{ width: `${pct}%` }} /></div>
            <div className="completion-text"><span>{t("wizard.pctLengkap", { pct })}</span><span>{t("wizard.doneOf", { done, total: checks.length })}</span></div>
            <div className="data-rows">
              {checks.map((c) => (
                <div className="dr" key={c.k}>
                  <span className="lbl">{c.k}</span>
                  <span className={`v${c.v ? "" : " empty"}`}>{c.show || t("wizard.belumDiisi")}</span>
                  <span className={`ck${c.v ? "" : " empty"}`}>{c.v ? "✓" : "○"}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
