"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import "./edit.css";
import { saveGuru, nonaktifkanGuru, type GuruFormState } from "../actions";

export type EditAudit = { aksi: string; detail: string; userName: string; when: string };
export type GEInitial = Record<string, string>;
export type EditExtra = { pendidikan: { jenjang: string; namaSekolah: string; jurusan: string; tahunLulus: string }[]; mapel: string[]; wali: string | null };

const SECTIONS = [
  { key: "identitas", ico: "👤", cls: "lav" }, { key: "kepegawaian", ico: "🏛", cls: "sky" },
  { key: "pendidikan", ico: "🎓", cls: "mint" }, { key: "mapel", ico: "📚", cls: "peach" }, { key: "kontak", ico: "📧", cls: "sun" },
];
const FIELD_SEC: Record<string, string[]> = {
  identitas: ["namaGuru", "jenisKelamin", "tempatLahir", "tanggalLahir", "nik"],
  kepegawaian: ["nip", "nuptk", "npk", "statusGuru", "pangkat", "golongan", "jenisJabatan", "tmt"],
  pendidikan: [], mapel: [], kontak: ["alamat", "email", "noTelp"],
};
const STATUS = ["PNS", "GTT", "GTY", "PPPK", "Honorer"];
const ALASAN = ["Pensiun", "Mutasi", "Mengundurkan diri", "Cuti", "Meninggal dunia", "Pemberhentian"];

export function GuruEditForm({ id, initial, audit, updatedInfo, extra }: { id: number; initial: GEInitial; audit: EditAudit[]; updatedInfo: string; extra: EditExtra }) {
  const router = useRouter();
  const t = useTranslations("guru");
  const [f, setF] = useState<GEInitial>(initial);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["pendidikan", "mapel"]));
  const [busy, setBusy] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [state, formAction, pending] = useActionState<GuruFormState, FormData>(saveGuru, { ok: false });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (state.ok) router.push(state.to ?? `/guru/${id}`); }, [state, router, id]);

  const ch = (k: string) => (f[k] ?? "") !== (initial[k] ?? "");
  const fc = (k: string) => `gef${ch(k) ? " changed" : ""}`;
  const secCh = (key: string) => FIELD_SEC[key].some(ch);
  const changedCount = Object.values(FIELD_SEC).flat().filter(ch).length;
  const toggle = (key: string) => setCollapsed((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  async function onNonaktif() {
    if (busy || !alasan) return;
    if (!confirm(t("nonaktifConfirm", { nama: initial.namaGuru }))) return;
    setBusy(true);
    const fd = new FormData(); fd.set("id", String(id)); fd.set("alasan", catatan ? `${alasan} — ${catatan}` : alasan);
    try { await nonaktifkanGuru(fd); router.push("/guru"); } finally { setBusy(false); }
  }

  const Head = (i: number) => {
    const s = SECTIONS[i];
    return (
      <button type="button" className={`gsec-h${collapsed.has(s.key) ? " collapsed" : ""}`} onClick={() => toggle(s.key)}>
        <span className={`gico ${s.cls}`}>{s.ico}</span><span className="tt"><b>{t(`secT_${s.key}`)}</b><span>{t(`secS_${s.key}`)}</span></span>
        {secCh(s.key) && <span className="cbadge">{t("changed")}</span>}
        <svg className="chev" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
      </button>
    );
  };
  const Body = (key: string, children: React.ReactNode) => <div className={`gsec-body${collapsed.has(key) ? " closed" : ""}`} style={{ maxHeight: collapsed.has(key) ? 0 : 1400 }}>{children}</div>;

  return (
    <div id="ak-ge">
      <div className="ge-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><Link href={`/guru/${id}`}>{initial.namaGuru}</Link><span>/</span><b>{t("editData")}</b></div>

      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="jenisKelamin" value={f.jenisKelamin ?? ""} />
        <input type="hidden" name="statusGuru" value={f.statusGuru ?? ""} />

        <div className="ge-head">
          <div className="ge-av">{(initial.namaGuru || "?").replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}</div>
          <div className="ge-ht"><span className="ge-badge">{t("modeEdit")}</span><h1>{f.namaGuru || "—"}</h1><div className="ge-meta">{updatedInfo}</div></div>
          <div className="ge-actions"><Link href={`/guru/${id}`} className="ge-btn ghost">{t("cancel")}</Link><button type="submit" className="ge-btn save" disabled={pending}>{pending ? t("saving") : t("save")}</button></div>
        </div>

        {state.message && <p className="ge-err">{state.message}</p>}

        <div className="ge-shell">
          <div>
            <div className="gsec">{Head(0)}{Body("identitas", <>
              <div className={fc("namaGuru")}><label>{t("formNamaGuru")}</label><input name="namaGuru" value={f.namaGuru ?? ""} onChange={(e) => set("namaGuru", e.target.value)} /></div>
              <div className="gef"><label>{t("formJenisKelamin")}</label><div className="jk-tog"><button type="button" className={f.jenisKelamin === "P" ? "on" : ""} onClick={() => set("jenisKelamin", "P")}>👩 {t("optPerempuan")}</button><button type="button" className={f.jenisKelamin === "L" ? "on" : ""} onClick={() => set("jenisKelamin", "L")}>👨 {t("optLaki")}</button></div></div>
              <div className="grid-2">
                <div className={fc("tempatLahir")}><label>{t("formTempatLahir")}</label><input name="tempatLahir" value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} /></div>
                <div className={fc("tanggalLahir")}><label>{t("formTanggalLahir")}</label><input type="date" name="tanggalLahir" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div>
              </div>
              <div className={fc("nik")}><label>{t("formNik")}</label><input name="nik" maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} /></div>
            </>)}</div>

            <div className="gsec">{Head(1)}{Body("kepegawaian", <>
              <div className={fc("statusGuru")}><label>{t("formStatus")}</label><div className="chips-row">{STATUS.map((s) => <button type="button" key={s} className={`schip${f.statusGuru === s ? " on" : ""}`} onClick={() => set("statusGuru", s)}>{s}</button>)}</div></div>
              <div className="grid-3">
                <div className={fc("nip")}><label>{t("formNip")}</label><input name="nip" value={f.nip ?? ""} onChange={(e) => set("nip", e.target.value)} /></div>
                <div className={fc("nuptk")}><label>{t("formNuptk")}</label><input name="nuptk" value={f.nuptk ?? ""} onChange={(e) => set("nuptk", e.target.value)} /></div>
                <div className={fc("npk")}><label>{t("formNpk")}</label><input name="npk" value={f.npk ?? ""} onChange={(e) => set("npk", e.target.value)} /></div>
              </div>
              <div className="grid-3">
                <div className={fc("pangkat")}><label>{t("formPangkat")}</label><input name="pangkat" value={f.pangkat ?? ""} onChange={(e) => set("pangkat", e.target.value)} /></div>
                <div className={fc("golongan")}><label>{t("formGolongan")}</label><input name="golongan" value={f.golongan ?? ""} onChange={(e) => set("golongan", e.target.value)} /></div>
                <div className={fc("jenisJabatan")}><label>{t("formJabatan")}</label><input name="jenisJabatan" value={f.jenisJabatan ?? ""} onChange={(e) => set("jenisJabatan", e.target.value)} /></div>
              </div>
              <div className={fc("tmt")}><label>{t("formTmt")}</label><input type="date" name="tmt" value={f.tmt ?? ""} onChange={(e) => set("tmt", e.target.value)} /></div>
            </>)}</div>

            <div className="gsec">{Head(2)}{Body("pendidikan", extra.pendidikan.length ? <div className="ge-readlist">{extra.pendidikan.map((p, i) => <div key={i} className="ge-readcard"><span className="rj">{p.jenjang}</span><div><b>{p.namaSekolah || "—"}</b><span>{[p.jurusan, p.tahunLulus].filter(Boolean).join(" · ")}</span></div></div>)}<p className="ge-note">{t("kelolaPendidikan")}</p></div> : <p className="ge-note">{t("kelolaPendidikan")}</p>)}</div>

            <div className="gsec">{Head(3)}{Body("mapel", <>
              <div className="ge-tags">{extra.mapel.length ? extra.mapel.map((m) => <span key={m} className="ge-tag">{m}</span>) : <span className="ge-note">{t("mapelEmpty")}</span>}</div>
              {extra.wali && <div className="ge-walibox">🏠 {t("waliKelasLabel")}: <b>{extra.wali}</b></div>}
              <p className="ge-note">{t("kelolaMapel")}</p>
            </>)}</div>

            <div className="gsec">{Head(4)}{Body("kontak", <>
              <div className={fc("alamat")}><label>{t("formAlamat")}</label><textarea name="alamat" rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} /></div>
              <div className="grid-2">
                <div className={fc("email")}><label>{t("formEmail")}</label><input name="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
                <div className={fc("noTelp")}><label>{t("formNoTelp")}</label><input name="noTelp" value={f.noTelp ?? ""} onChange={(e) => set("noTelp", e.target.value)} /></div>
              </div>
            </>)}</div>
          </div>

          <aside className="ge-rail">
            <div className="ge-railcard">
              <h3>📋 {t("riwayatTitle")}</h3>
              {audit.length === 0 ? <div className="ge-empty">{t("riwayatEmpty")}</div> : (
                <div className="ge-auditlist">{audit.map((a, i) => <div className="ge-arow" key={i}><span className={`ge-adot ${a.aksi}`} /><div><div className="a-t">{a.detail || a.aksi}</div><div className="a-s">{a.userName} · {a.when}</div></div></div>)}</div>
              )}
            </div>
            <div className="ge-danger">
              <h3>⛔ {t("nonaktifTitle")}</h3>
              <div className="ge-dsub">{t("nonaktifSub")}</div>
              <label className="ge-dlabel">{t("alasanLabel")}</label>
              <select value={alasan} onChange={(e) => setAlasan(e.target.value)}><option value="">{t("pilihAlasan")}</option>{ALASAN.map((a) => <option key={a} value={a}>{a}</option>)}</select>
              <label className="ge-dlabel">{t("catatanLabel")}</label>
              <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t("catatanPlaceholder")} />
              <button type="button" className="ge-dbtn" onClick={onNonaktif} disabled={busy || !alasan}>⛔ {t("nonaktifBtn", { nama: initial.namaGuru })}</button>
            </div>
          </aside>
        </div>

        <div className={`ge-savebar${changedCount > 0 ? " show" : ""}`}>
          <span className="ct"><span className="dot" />{t("savebar", { n: changedCount })}</span><span className="sep" />
          <button type="button" className="discard" onClick={() => setF(initial)}>{t("discard")}</button>
          <button type="submit" className="save" disabled={pending}>✓ {t("saveAll")}</button>
        </div>
      </form>
    </div>
  );
}
