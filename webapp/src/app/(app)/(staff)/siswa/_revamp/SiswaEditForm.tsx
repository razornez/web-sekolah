"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./editsiswa.css";
import { saveSiswa, softDeleteSiswa, hardDeleteSiswa, type SiswaFormState } from "../actions";

export type EditAudit = { aksi: string; detail: string; userName: string; when: string };
export type EditInitial = Record<string, string>;

const SECTIONS = [
  { key: "identitas", ico: "👤", iconCls: "lav", title: "Identitas Pribadi", sub: "Nama, JK, tanggal lahir, NIK" },
  { key: "akademik", ico: "🎓", iconCls: "mint", title: "Data Akademik", sub: "NISN, NIS, status, asal sekolah" },
  { key: "alamat", ico: "📍", iconCls: "peach", title: "Alamat & Kontak", sub: "Tempat tinggal, HP, transportasi" },
  { key: "ortu", ico: "👨‍👩‍👧", iconCls: "pink", title: "Orang Tua & Wali", sub: "Kontak komunikasi sekolah" },
  { key: "kesehatan", ico: "💪", iconCls: "sun", title: "Kesehatan & Biometri", sub: "Tinggi, berat, gol. darah" },
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

export function SiswaEditForm({ id, initial, kelas, audit, updatedInfo }: { id: number; initial: EditInitial; kelas: string; audit: EditAudit[]; updatedInfo: string }) {
  const router = useRouter();
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
    if (busy || !confirm("Arsipkan siswa ini? Data relasi tetap aman dan bisa dipulihkan.")) return;
    setBusy(true); const fd = new FormData(); fd.set("id", String(id)); try { await softDeleteSiswa(fd); } finally { setBusy(false); }
  }
  async function onHard() {
    if (busy) return;
    const c = prompt('Hapus PERMANEN beserta semua relasi (nilai, kehadiran, SPP). Ketik "HAPUS" untuk konfirmasi:');
    if (c !== "HAPUS") return;
    setBusy(true); const fd = new FormData(); fd.set("id", String(id)); fd.set("confirm", "HAPUS"); try { await hardDeleteSiswa(fd); router.push("/siswa"); } finally { setBusy(false); }
  }

  const Body = (key: string, children: React.ReactNode) => (
    <div className={`sect-body${collapsed.has(key) ? " closed" : ""}`} style={{ maxHeight: collapsed.has(key) ? 0 : 1200 }}>{children}</div>
  );

  return (
    <div id="ak-se">
      <div className="crumb"><Link href="/siswa">Siswa</Link><span>/</span><Link href={`/siswa/${id}`}>{initial.namaLengkap}</Link><span>/</span><b>Edit</b></div>

      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="jenisKelamin" value={f.jenisKelamin ?? ""} />
        <input type="hidden" name="status" value={f.status ?? "aktif"} />

        {/* HEADER */}
        <div className="edit-h">
          <div className="av">{(initial.namaLengkap || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}</div>
          <div><span className="badge-mode">Mode edit</span><h1>{f.namaLengkap || "(tanpa nama)"}</h1><div className="meta">{kelas} · {updatedInfo}</div></div>
          <div className="actions">
            <Link href={`/siswa/${id}`} className="btn btn-ghost">← Batal</Link>
            <button type="submit" className="btn btn-save" disabled={pending}>{pending ? "Menyimpan…" : "✓ Simpan perubahan"}</button>
          </div>
        </div>

        {state.message && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 12, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{state.message}</p>}

        <div className="edit-shell">
          <div>
            {/* IDENTITAS */}
            <div className="sect">
              <button type="button" className={`sect-h${collapsed.has("identitas") ? " collapsed" : ""}`} onClick={() => toggle("identitas")}>
                <span className="ico lav">{SECTIONS[0].ico}</span><span className="tt"><b>{SECTIONS[0].title}</b><span>{SECTIONS[0].sub}</span></span>
                {sectionChanged("identitas") && <span className="cbadge">diubah</span>}
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              {Body("identitas", <>
                <div className={fc("namaLengkap")}><label>Nama Lengkap</label><input name="namaLengkap" value={f.namaLengkap ?? ""} onChange={(e) => set("namaLengkap", e.target.value)} /></div>
                <div className="field"><label>Jenis Kelamin</label><div className="jk-toggle"><button type="button" className={f.jenisKelamin === "P" ? "on" : ""} onClick={() => set("jenisKelamin", "P")}>👧 Perempuan</button><button type="button" className={f.jenisKelamin === "L" ? "on" : ""} onClick={() => set("jenisKelamin", "L")}>👦 Laki-laki</button></div></div>
                <div className="grid-2">
                  <div className={fc("tempatLahir")}><label>Tempat Lahir</label><input name="tempatLahir" value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} /></div>
                  <div className={fc("tanggalLahir")}><label>Tanggal Lahir</label><input type="date" name="tanggalLahir" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div>
                </div>
                <div className="grid-3">
                  <div className={fc("nik")}><label>NIK</label><input name="nik" maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} /></div>
                  <div className={fc("agama")}><label>Agama</label><select name="agama" value={f.agama ?? ""} onChange={(e) => set("agama", e.target.value)}><option value="">—</option>{AGAMA.map((a) => <option key={a}>{a}</option>)}</select></div>
                  <div className={fc("anakKe")}><label>Anak ke</label><input type="number" name="anakKe" value={f.anakKe ?? ""} onChange={(e) => set("anakKe", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className={fc("hobi")}><label>Hobi</label><input name="hobi" value={f.hobi ?? ""} onChange={(e) => set("hobi", e.target.value)} /></div>
                  <div className={fc("citaCita")}><label>Cita-cita</label><input name="citaCita" value={f.citaCita ?? ""} onChange={(e) => set("citaCita", e.target.value)} /></div>
                </div>
              </>)}
            </div>

            {/* AKADEMIK */}
            <div className="sect">
              <button type="button" className={`sect-h${collapsed.has("akademik") ? " collapsed" : ""}`} onClick={() => toggle("akademik")}>
                <span className="ico mint">{SECTIONS[1].ico}</span><span className="tt"><b>{SECTIONS[1].title}</b><span>{SECTIONS[1].sub}</span></span>
                {sectionChanged("akademik") && <span className="cbadge">diubah</span>}
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              {Body("akademik", <>
                <div className="grid-3">
                  <div className={fc("nisn")}><label>NISN</label><input name="nisn" value={f.nisn ?? ""} onChange={(e) => set("nisn", e.target.value)} /></div>
                  <div className={fc("nis")}><label>NIS</label><input name="nis" value={f.nis ?? ""} onChange={(e) => set("nis", e.target.value)} /></div>
                  <div className={fc("noInduk")}><label>No. Induk</label><input name="noInduk" value={f.noInduk ?? ""} onChange={(e) => set("noInduk", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className={fc("tahunMasuk")}><label>Tahun Masuk</label><input type="number" name="tahunMasuk" value={f.tahunMasuk ?? ""} onChange={(e) => set("tahunMasuk", e.target.value)} /></div>
                  <div className={fc("asalSekolah")}><label>Asal Sekolah</label><input name="asalSekolah" value={f.asalSekolah ?? ""} onChange={(e) => set("asalSekolah", e.target.value)} /></div>
                </div>
                <div className={fc("status")}><label>Status</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{STATUS.map((s) => <button type="button" key={s} onClick={() => set("status", s)} style={{ padding: "8px 14px", borderRadius: 100, border: f.status === s ? "0" : "1px solid var(--ak-rule-2)", background: f.status === s ? "var(--ak-primary)" : "var(--ak-surface-2)", color: f.status === s ? "#fff" : "var(--ak-ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div>
                </div>
                <div className="field"><label>Kelas / Rombel saat ini</label><input value={kelas} disabled /><div style={{ fontSize: 11, color: "var(--ak-muted)", marginTop: 4 }}>Ubah lewat fitur Pindah Kelas.</div></div>
              </>)}
            </div>

            {/* ALAMAT */}
            <div className="sect">
              <button type="button" className={`sect-h${collapsed.has("alamat") ? " collapsed" : ""}`} onClick={() => toggle("alamat")}>
                <span className="ico peach">{SECTIONS[2].ico}</span><span className="tt"><b>{SECTIONS[2].title}</b><span>{SECTIONS[2].sub}</span></span>
                {sectionChanged("alamat") && <span className="cbadge">diubah</span>}
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              {Body("alamat", <>
                <div className={fc("alamat")}><label>Alamat Lengkap</label><textarea name="alamat" rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} /></div>
                <div className="grid-3">
                  <div className={fc("desaKel")}><label>Kelurahan/Desa</label><input name="desaKel" value={f.desaKel ?? ""} onChange={(e) => set("desaKel", e.target.value)} /></div>
                  <div className={fc("kecamatan")}><label>Kecamatan</label><input name="kecamatan" value={f.kecamatan ?? ""} onChange={(e) => set("kecamatan", e.target.value)} /></div>
                  <div className={fc("kabupaten")}><label>Kabupaten/Kota</label><input name="kabupaten" value={f.kabupaten ?? ""} onChange={(e) => set("kabupaten", e.target.value)} /></div>
                </div>
                <div className="grid-3">
                  <div className={fc("kodePos")}><label>Kode Pos</label><input name="kodePos" value={f.kodePos ?? ""} onChange={(e) => set("kodePos", e.target.value)} /></div>
                  <div className={fc("noHp")}><label>No. HP Siswa</label><input name="noHp" value={f.noHp ?? ""} onChange={(e) => set("noHp", e.target.value)} /></div>
                  <div className={fc("transportasi")}><label>Transportasi</label><input name="transportasi" value={f.transportasi ?? ""} onChange={(e) => set("transportasi", e.target.value)} /></div>
                </div>
                <div className={fc("tinggalDengan")}><label>Tinggal Dengan</label><input name="tinggalDengan" value={f.tinggalDengan ?? ""} onChange={(e) => set("tinggalDengan", e.target.value)} /></div>
              </>)}
            </div>

            {/* ORTU */}
            <div className="sect">
              <button type="button" className={`sect-h${collapsed.has("ortu") ? " collapsed" : ""}`} onClick={() => toggle("ortu")}>
                <span className="ico pink">{SECTIONS[3].ico}</span><span className="tt"><b>{SECTIONS[3].title}</b><span>{SECTIONS[3].sub}</span></span>
                {sectionChanged("ortu") && <span className="cbadge">diubah</span>}
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              {Body("ortu", <>
                <div className="subhead">Ayah</div>
                <div className="grid-2">
                  <div className={fc("ayah_nama")}><label>Nama</label><input name="ayah_nama" value={f.ayah_nama ?? ""} onChange={(e) => set("ayah_nama", e.target.value)} /></div>
                  <div className={fc("ayah_pekerjaan")}><label>Pekerjaan</label><input name="ayah_pekerjaan" value={f.ayah_pekerjaan ?? ""} onChange={(e) => set("ayah_pekerjaan", e.target.value)} /></div>
                  <div className={fc("ayah_pendidikan")}><label>Pendidikan</label><input name="ayah_pendidikan" value={f.ayah_pendidikan ?? ""} onChange={(e) => set("ayah_pendidikan", e.target.value)} /></div>
                  <div className={fc("ayah_hp")}><label>No. HP</label><input name="ayah_hp" value={f.ayah_hp ?? ""} onChange={(e) => set("ayah_hp", e.target.value)} /></div>
                </div>
                <div className="subhead" style={{ marginTop: 14 }}>Ibu</div>
                <div className="grid-2">
                  <div className={fc("ibu_nama")}><label>Nama</label><input name="ibu_nama" value={f.ibu_nama ?? ""} onChange={(e) => set("ibu_nama", e.target.value)} /></div>
                  <div className={fc("ibu_pekerjaan")}><label>Pekerjaan</label><input name="ibu_pekerjaan" value={f.ibu_pekerjaan ?? ""} onChange={(e) => set("ibu_pekerjaan", e.target.value)} /></div>
                  <div className={fc("ibu_pendidikan")}><label>Pendidikan</label><input name="ibu_pendidikan" value={f.ibu_pendidikan ?? ""} onChange={(e) => set("ibu_pendidikan", e.target.value)} /></div>
                  <div className={fc("ibu_hp")}><label>No. HP</label><input name="ibu_hp" value={f.ibu_hp ?? ""} onChange={(e) => set("ibu_hp", e.target.value)} /></div>
                </div>
              </>)}
            </div>

            {/* KESEHATAN */}
            <div className="sect">
              <button type="button" className={`sect-h${collapsed.has("kesehatan") ? " collapsed" : ""}`} onClick={() => toggle("kesehatan")}>
                <span className="ico sun">{SECTIONS[4].ico}</span><span className="tt"><b>{SECTIONS[4].title}</b><span>{SECTIONS[4].sub}</span></span>
                {sectionChanged("kesehatan") && <span className="cbadge">diubah</span>}
                <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6 L8 10 L12 6" /></svg>
              </button>
              {Body("kesehatan", <>
                <div className="grid-3">
                  <div className={fc("tinggiBadan")}><label>Tinggi (cm)</label><input type="number" name="tinggiBadan" value={f.tinggiBadan ?? ""} onChange={(e) => set("tinggiBadan", e.target.value)} /></div>
                  <div className={fc("beratBadan")}><label>Berat (kg)</label><input type="number" name="beratBadan" value={f.beratBadan ?? ""} onChange={(e) => set("beratBadan", e.target.value)} /></div>
                  <div className={fc("golonganDarah")}><label>Gol. Darah</label><select name="golonganDarah" value={f.golonganDarah ?? ""} onChange={(e) => set("golonganDarah", e.target.value)}><option value="">—</option>{["A", "B", "AB", "O"].map((g) => <option key={g}>{g}</option>)}</select></div>
                </div>
                <div className={fc("kebutuhanKhusus")}><label>Kebutuhan Khusus</label><input name="kebutuhanKhusus" value={f.kebutuhanKhusus ?? ""} onChange={(e) => set("kebutuhanKhusus", e.target.value)} placeholder="Kosongkan jika tidak ada" /></div>
              </>)}
            </div>
          </div>

          {/* SIDE RAIL */}
          <aside className="side-rail">
            <div className="rail-card">
              <h3>📋 Riwayat Perubahan</h3>
              {audit.length === 0 ? <div className="audit-empty">Belum ada riwayat.</div> : (
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
              <h3>⚠ Tindakan Sensitif</h3>
              <div className="sub">Pikirkan dulu — memengaruhi data terkait (rapor, kehadiran, SPP).</div>
              <div className="danger-actions">
                <button type="button" className="archive" onClick={onSoft} disabled={busy}><span className="e">📦</span><div style={{ lineHeight: 1.3 }}><div>Arsipkan siswa</div><div className="sm">Bisa dipulihkan</div></div></button>
                <button type="button" className="del" onClick={onHard} disabled={busy}><span className="e">🗑</span><div style={{ lineHeight: 1.3 }}><div>Hapus permanen</div><div className="sm">Khusus admin · tidak bisa dibatalkan</div></div></button>
              </div>
            </div>
          </aside>
        </div>

        <div className={`save-bar${changedCount > 0 ? " show" : ""}`}>
          <span className="ct"><span className="dot" /><b>{changedCount}</b> perubahan belum disimpan</span>
          <span className="sep" />
          <button type="button" className="discard" onClick={() => setF(initial)}>Batalkan</button>
          <button type="submit" className="save" disabled={pending}>✓ Simpan semua</button>
        </div>
      </form>
    </div>
  );
}
