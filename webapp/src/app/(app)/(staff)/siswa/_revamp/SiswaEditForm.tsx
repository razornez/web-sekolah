"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import "./editsiswa.css";
import { saveSiswa, softDeleteSiswa, hardDeleteSiswa, type SiswaFormState } from "../actions";

export type EditAudit = { aksi: string; detail: string; userName: string; when: string };
export type EditInitial = Record<string, string>;

const SECTIONS = [
  { key: "identitas", ico: "👤", iconCls: "lav" },
  { key: "akademik", ico: "🎓", iconCls: "mint" },
  { key: "alamat", ico: "📍", iconCls: "peach" },
  { key: "ortu", ico: "👨‍👩‍👧", iconCls: "pink" },
  { key: "kesehatan", ico: "💪", iconCls: "sun" },
];
const FIELD_SECTION: Record<string, string[]> = {
  identitas: ["namaLengkap", "jenisKelamin", "tempatLahir", "tanggalLahir", "nik", "agama", "anakKe", "hobi", "citaCita"],
  akademik: ["nisn", "nis", "noInduk", "tahunMasuk", "status", "asalSekolah"],
  alamat: ["alamat", "desaKel", "kecamatan", "kabupaten", "kodePos", "noHp", "tinggalDengan", "transportasi"],
  ortu: ["ayah_nama", "ayah_pekerjaan", "ayah_pendidikan", "ayah_hp", "ibu_nama", "ibu_pekerjaan", "ibu_pendidikan", "ibu_hp"],
  kesehatan: ["tinggiBadan", "beratBadan", "golonganDarah", "kebutuhanKhusus"],
};
const STATUS = ["aktif", "lulus", "pindah", "keluar", "alumni"];
const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SiswaEditForm({ id, initial, kelas, audit, updatedInfo }: { id: number; initial: EditInitial; kelas: string; audit: EditAudit[]; updatedInfo: string }) {
  const router = useRouter();
  const t = useTranslations("siswa");
  const [f, setF] = useState<EditInitial>(initial);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(saveSiswa, { ok: false });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (state.ok) router.push(state.to ?? `/siswa/${id}`); }, [state, router, id]);

  const ch = (k: string) => (f[k] ?? "") !== (initial[k] ?? "");
  const fc = (k: string) => `field${ch(k) ? " changed" : ""}`;
  const sectionChanged = (key: string) => FIELD_SECTION[key].some(ch);
  const changedCount = Object.keys(FIELD_SECTION).flatMap((k) => FIELD_SECTION[k]).filter(ch).length;
  const toggle = (key: string) => setCollapsed((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  async function onSoft() {
    if (busy || !confirm(t("edit.archiveConfirm"))) return;
    setBusy(true); const fd = new FormData(); fd.set("id", String(id)); try { await softDeleteSiswa(fd); } finally { setBusy(false); }
  }
  async function onHard() {
    if (busy) return;
    const c = prompt(t("edit.hapusConfirm"));
    if (c !== "HAPUS") return;
    setBusy(true); const fd = new FormData(); fd.set("id", String(id)); fd.set("confirm", "HAPUS"); try { await hardDeleteSiswa(fd); router.push("/siswa"); } finally { setBusy(false); }
  }

  const Head = (i: number) => {
    const s = SECTIONS[i];
    return (
      <button type="button" className={`sect-h${collapsed.has(s.key) ? " collapsed" : ""}`} onClick={() => toggle(s.key)}>
        <span className={`ico ${s.iconCls}`}>{s.ico}</span><span className="tt"><b>{t(`edit.s${i + 1}t`)}</b><span>{t(`edit.s${i + 1}s`)}</span></span>
        {sectionChanged(s.key) && <span className="cbadge">{t("edit.changed")}</span>}
        <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
      </button>
    );
  };
  const Body = (key: string, children: React.ReactNode) => (
    <div className={`sect-body${collapsed.has(key) ? " closed" : ""}`} style={{ maxHeight: collapsed.has(key) ? 0 : 1200 }}>{children}</div>
  );

  return (
    <div id="ak-se">
      <div className="crumb"><Link href="/siswa">{t("title")}</Link><span>/</span><Link href={`/siswa/${id}`}>{initial.namaLengkap}</Link><span>/</span><b>{t("edit.crumb")}</b></div>

      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="jenisKelamin" value={f.jenisKelamin ?? ""} />
        <input type="hidden" name="status" value={f.status ?? "aktif"} />

        <div className="edit-h">
          <div className="av">{(initial.namaLengkap || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}</div>
          <div><span className="badge-mode">{t("edit.modeEdit")}</span><h1>{f.namaLengkap || "—"}</h1><div className="meta">{kelas} · {updatedInfo}</div></div>
          <div className="actions">
            <Link href={`/siswa/${id}`} className="btn btn-ghost">{t("edit.cancel")}</Link>
            <button type="submit" className="btn btn-save" disabled={pending}>{pending ? t("edit.saving") : t("edit.save")}</button>
          </div>
        </div>

        {state.message && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 12, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{state.message}</p>}

        <div className="edit-shell">
          <div>
            <div className="sect">{Head(0)}{Body("identitas", <>
              <div className={fc("namaLengkap")}><label>{t("formNamaLengkap")}</label><input name="namaLengkap" value={f.namaLengkap ?? ""} onChange={(e) => set("namaLengkap", e.target.value)} /></div>
              <div className="field"><label>{t("formJenisKelamin")}</label><div className="jk-toggle"><button type="button" className={f.jenisKelamin === "P" ? "on" : ""} onClick={() => set("jenisKelamin", "P")}>{t("edit.jkP")}</button><button type="button" className={f.jenisKelamin === "L" ? "on" : ""} onClick={() => set("jenisKelamin", "L")}>{t("edit.jkL")}</button></div></div>
              <div className="grid-2">
                <div className={fc("tempatLahir")}><label>{t("formTempatLahir")}</label><input name="tempatLahir" value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} /></div>
                <div className={fc("tanggalLahir")}><label>{t("formTanggalLahir")}</label><input type="date" name="tanggalLahir" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div>
              </div>
              <div className="grid-3">
                <div className={fc("nik")}><label>{t("formNik")}</label><input name="nik" maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} /></div>
                <div className={fc("agama")}><label>{t("formAgama")}</label><select name="agama" value={f.agama ?? ""} onChange={(e) => set("agama", e.target.value)}><option value="">—</option>{AGAMA.map((a) => <option key={a}>{a}</option>)}</select></div>
                <div className={fc("anakKe")}><label>{t("formAnakKe")}</label><input type="number" name="anakKe" value={f.anakKe ?? ""} onChange={(e) => set("anakKe", e.target.value)} /></div>
              </div>
              <div className="grid-2">
                <div className={fc("hobi")}><label>{t("formHobi")}</label><input name="hobi" value={f.hobi ?? ""} onChange={(e) => set("hobi", e.target.value)} /></div>
                <div className={fc("citaCita")}><label>{t("wizard.fCita")}</label><input name="citaCita" value={f.citaCita ?? ""} onChange={(e) => set("citaCita", e.target.value)} /></div>
              </div>
            </>)}</div>

            <div className="sect">{Head(1)}{Body("akademik", <>
              <div className="grid-3">
                <div className={fc("nisn")}><label>{t("formNisn")}</label><input name="nisn" value={f.nisn ?? ""} onChange={(e) => set("nisn", e.target.value)} /></div>
                <div className={fc("nis")}><label>{t("formNis")}</label><input name="nis" value={f.nis ?? ""} onChange={(e) => set("nis", e.target.value)} /></div>
                <div className={fc("noInduk")}><label>{t("formNoInduk")}</label><input name="noInduk" value={f.noInduk ?? ""} onChange={(e) => set("noInduk", e.target.value)} /></div>
              </div>
              <div className="grid-2">
                <div className={fc("tahunMasuk")}><label>{t("formTahunMasuk")}</label><input type="number" name="tahunMasuk" value={f.tahunMasuk ?? ""} onChange={(e) => set("tahunMasuk", e.target.value)} /></div>
                <div className={fc("asalSekolah")}><label>{t("formAsalSekolah")}</label><input name="asalSekolah" value={f.asalSekolah ?? ""} onChange={(e) => set("asalSekolah", e.target.value)} /></div>
              </div>
              <div className={fc("status")}><label>{t("formStatus")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{STATUS.map((s) => <button type="button" key={s} onClick={() => set("status", s)} style={{ padding: "8px 14px", borderRadius: 100, border: f.status === s ? "0" : "1px solid var(--ak-rule-2)", background: f.status === s ? "var(--ak-primary)" : "var(--ak-surface-2)", color: f.status === s ? "#fff" : "var(--ak-ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{t(`status${cap(s)}`)}</button>)}</div>
              </div>
              <div className="field"><label>{t("edit.rombelLabel")}</label><input value={kelas} disabled /><div style={{ fontSize: 11, color: "var(--ak-muted)", marginTop: 4 }}>{t("edit.rombelNote")}</div></div>
            </>)}</div>

            <div className="sect">{Head(2)}{Body("alamat", <>
              <div className={fc("alamat")}><label>{t("formAlamatLengkap")}</label><textarea name="alamat" rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} /></div>
              <div className="grid-3">
                <div className={fc("desaKel")}><label>{t("wizard.fDesa")}</label><input name="desaKel" value={f.desaKel ?? ""} onChange={(e) => set("desaKel", e.target.value)} /></div>
                <div className={fc("kecamatan")}><label>{t("wizard.fKec")}</label><input name="kecamatan" value={f.kecamatan ?? ""} onChange={(e) => set("kecamatan", e.target.value)} /></div>
                <div className={fc("kabupaten")}><label>{t("wizard.fKab")}</label><input name="kabupaten" value={f.kabupaten ?? ""} onChange={(e) => set("kabupaten", e.target.value)} /></div>
              </div>
              <div className="grid-3">
                <div className={fc("kodePos")}><label>{t("wizard.fKodePos")}</label><input name="kodePos" value={f.kodePos ?? ""} onChange={(e) => set("kodePos", e.target.value)} /></div>
                <div className={fc("noHp")}><label>{t("formNoHp")}</label><input name="noHp" value={f.noHp ?? ""} onChange={(e) => set("noHp", e.target.value)} /></div>
                <div className={fc("transportasi")}><label>{t("formTransportasi")}</label><input name="transportasi" value={f.transportasi ?? ""} onChange={(e) => set("transportasi", e.target.value)} /></div>
              </div>
              <div className={fc("tinggalDengan")}><label>{t("formTinggalBersama")}</label><input name="tinggalDengan" value={f.tinggalDengan ?? ""} onChange={(e) => set("tinggalDengan", e.target.value)} /></div>
            </>)}</div>

            <div className="sect">{Head(3)}{Body("ortu", <>
              <div className="subhead">{t("wizard.ayah")}</div>
              <div className="grid-2">
                <div className={fc("ayah_nama")}><label>{t("wizard.fNama")}</label><input name="ayah_nama" value={f.ayah_nama ?? ""} onChange={(e) => set("ayah_nama", e.target.value)} /></div>
                <div className={fc("ayah_pekerjaan")}><label>{t("wizard.fPekerjaan")}</label><input name="ayah_pekerjaan" value={f.ayah_pekerjaan ?? ""} onChange={(e) => set("ayah_pekerjaan", e.target.value)} /></div>
                <div className={fc("ayah_pendidikan")}><label>{t("wizard.fPendidikan")}</label><input name="ayah_pendidikan" value={f.ayah_pendidikan ?? ""} onChange={(e) => set("ayah_pendidikan", e.target.value)} /></div>
                <div className={fc("ayah_hp")}><label>{t("wizard.fHp")}</label><input name="ayah_hp" value={f.ayah_hp ?? ""} onChange={(e) => set("ayah_hp", e.target.value)} /></div>
              </div>
              <div className="subhead" style={{ marginTop: 14 }}>{t("wizard.ibu")}</div>
              <div className="grid-2">
                <div className={fc("ibu_nama")}><label>{t("wizard.fNama")}</label><input name="ibu_nama" value={f.ibu_nama ?? ""} onChange={(e) => set("ibu_nama", e.target.value)} /></div>
                <div className={fc("ibu_pekerjaan")}><label>{t("wizard.fPekerjaan")}</label><input name="ibu_pekerjaan" value={f.ibu_pekerjaan ?? ""} onChange={(e) => set("ibu_pekerjaan", e.target.value)} /></div>
                <div className={fc("ibu_pendidikan")}><label>{t("wizard.fPendidikan")}</label><input name="ibu_pendidikan" value={f.ibu_pendidikan ?? ""} onChange={(e) => set("ibu_pendidikan", e.target.value)} /></div>
                <div className={fc("ibu_hp")}><label>{t("wizard.fHp")}</label><input name="ibu_hp" value={f.ibu_hp ?? ""} onChange={(e) => set("ibu_hp", e.target.value)} /></div>
              </div>
            </>)}</div>

            <div className="sect">{Head(4)}{Body("kesehatan", <>
              <div className="grid-3">
                <div className={fc("tinggiBadan")}><label>{t("formTinggiBadan")}</label><input type="number" name="tinggiBadan" value={f.tinggiBadan ?? ""} onChange={(e) => set("tinggiBadan", e.target.value)} /></div>
                <div className={fc("beratBadan")}><label>{t("formBeratBadan")}</label><input type="number" name="beratBadan" value={f.beratBadan ?? ""} onChange={(e) => set("beratBadan", e.target.value)} /></div>
                <div className={fc("golonganDarah")}><label>{t("formGolDarah")}</label><select name="golonganDarah" value={f.golonganDarah ?? ""} onChange={(e) => set("golonganDarah", e.target.value)}><option value="">—</option>{["A", "B", "AB", "O"].map((g) => <option key={g}>{g}</option>)}</select></div>
              </div>
              <div className={fc("kebutuhanKhusus")}><label>{t("formKebutuhanKhusus")}</label><input name="kebutuhanKhusus" value={f.kebutuhanKhusus ?? ""} onChange={(e) => set("kebutuhanKhusus", e.target.value)} placeholder={t("edit.kebutuhanPlaceholder")} /></div>
            </>)}</div>
          </div>

          <aside className="side-rail">
            <div className="rail-card">
              <h3>{t("edit.auditTitle")}</h3>
              {audit.length === 0 ? <div className="audit-empty">{t("edit.auditEmpty")}</div> : (
                <div className="audit-list">
                  {audit.map((a, i) => (
                    <div className="audit-row" key={i}>
                      <span className={`audit-dot ${a.aksi}`} />
                      <div><div className="a-t">{a.detail || a.aksi}</div><div className="a-s">{a.userName} · {a.when}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="danger-card">
              <h3>{t("edit.dangerTitle")}</h3>
              <div className="sub">{t("edit.dangerSub")}</div>
              <div className="danger-actions">
                <button type="button" className="archive" onClick={onSoft} disabled={busy}><span className="e">📦</span><div style={{ lineHeight: 1.3 }}><div>{t("edit.archive")}</div><div className="sm">{t("edit.archiveSub")}</div></div></button>
                <button type="button" className="del" onClick={onHard} disabled={busy}><span className="e">🗑</span><div style={{ lineHeight: 1.3 }}><div>{t("edit.hapus")}</div><div className="sm">{t("edit.hapusSub")}</div></div></button>
              </div>
            </div>
          </aside>
        </div>

        <div className={`save-bar${changedCount > 0 ? " show" : ""}`}>
          <span className="ct"><span className="dot" />{t("edit.saveBar", { n: changedCount })}</span>
          <span className="sep" />
          <button type="button" className="discard" onClick={() => setF(initial)}>{t("edit.discard")}</button>
          <button type="submit" className="save" disabled={pending}>{t("edit.saveAll")}</button>
        </div>
      </form>
    </div>
  );
}
