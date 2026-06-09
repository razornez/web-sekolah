"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./form.css";
import { saveSiswa, type SiswaFormState } from "../actions";
import { zodiakFromDate, numerologi, bmi } from "../_lib/persona";

const STEPS = [
  { t: "Identitas", s: "Nama, foto, JK" },
  { t: "Akademik", s: "NISN, kelas, asal" },
  { t: "Alamat & kontak", s: "Tempat tinggal" },
  { t: "Ortu & kesehatan", s: "Wali, tinggi badan" },
];
const STATUS = ["aktif", "lulus", "pindah", "keluar", "alumni"];
const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const BULAN3 = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function FormWizard({ rombels, sekolah }: { rombels: { id: number; nama: string; tahun: string }[]; sekolah: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Record<string, string>>({ jenisKelamin: "P", status: "aktif" });
  const [state, formAction, pending] = useActionState<SiswaFormState, FormData>(saveSiswa, { ok: false });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { if (state.ok) router.push(state.to ?? "/siswa"); }, [state, router]);

  const tgl = f.tanggalLahir ? new Date(f.tanggalLahir) : null;
  const valid = tgl && !isNaN(tgl.getTime());
  const z = valid ? zodiakFromDate(tgl) : null;
  const nm = valid ? numerologi(tgl) : null;
  const b = bmi(Number(f.tinggiBadan) || 0, Number(f.beratBadan) || 0);
  const rombel = rombels.find((r) => String(r.id) === f.rombelId);
  const inisial = (f.namaLengkap || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const ttlStr = valid ? `${f.tempatLahir || ""}${f.tempatLahir ? ", " : ""}${tgl.getDate()} ${BULAN3[tgl.getMonth()]} ${tgl.getFullYear()}` : "—";

  const checks = [
    { k: "Identitas", v: f.namaLengkap, show: f.namaLengkap || "" },
    { k: "Tgl Lahir", v: valid ? "1" : "", show: ttlStr !== "—" ? ttlStr : "" },
    { k: "Foto", v: "", show: "" },
    { k: "NISN", v: f.nisn, show: f.nisn || "" },
    { k: "Kelas", v: f.rombelId, show: rombel?.nama || "" },
    { k: "Alamat", v: f.alamat, show: f.alamat || "" },
    { k: "Ortu", v: f.ayah_nama || f.ibu_nama, show: f.ayah_nama || f.ibu_nama || "" },
    { k: "Tinggi/Berat", v: f.tinggiBadan && f.beratBadan ? "1" : "", show: f.tinggiBadan && f.beratBadan ? `${f.tinggiBadan}/${f.beratBadan}` : "" },
    { k: "No. HP", v: f.noHp, show: f.noHp || "" },
  ];
  const done = checks.filter((c) => c.v).length;
  const pct = Math.round((done / checks.length) * 100);
  const last = step === 3;

  return (
    <div id="ak-sf">
      <div className="sf-head"><h1>Tambah Siswa Baru</h1><p>Isi data siswa selangkah demi selangkah. Kartu pelajar terbentuk otomatis di samping.</p></div>

      <div className="form-shell">
        <div className="form-card">
          <aside className="stepper">
            <div className="stepper-ttl">Panduan</div>
            <h3>Selesai dalam <em>4 langkah</em></h3>
            <div className="step-list">
              {STEPS.map((s, i) => (
                <div key={i} className={`step${i === step ? " active" : i < step ? " done" : ""}`} onClick={() => i < step && setStep(i)}>
                  <div className="n-c"><span>{i < step ? "✓" : i + 1}</span></div>
                  <div className="info"><div className="t">{s.t}</div><div className="s">{s.s}</div></div>
                </div>
              ))}
            </div>
            <div className="stepper-foot"><div className="stepper-tip"><span className="e">💡</span> <b>Tahukah Anda?</b> Tinggi &amp; berat dipakai untuk <b>BMI otomatis</b>, tanggal lahir untuk <b>zodiak &amp; numerologi</b> di profil.</div></div>
          </aside>

          <form action={formAction} className="form-main">
            {/* hidden mirrors of non-native-input state */}
            <input type="hidden" name="namaLengkap" value={f.namaLengkap || ""} />
            <input type="hidden" name="jenisKelamin" value={f.jenisKelamin || ""} />
            <input type="hidden" name="status" value={f.status || "aktif"} />
            {["tempatLahir", "tanggalLahir", "nik", "agama", "anakKe", "hobi", "citaCita", "nisn", "nis", "noInduk", "tahunMasuk", "asalSekolah", "rombelId", "alamat", "desaKel", "kecamatan", "kabupaten", "kodePos", "noHp", "tinggalDengan", "transportasi", "tinggiBadan", "beratBadan", "golonganDarah", "kebutuhanKhusus", "ayah_nama", "ayah_pekerjaan", "ayah_pendidikan", "ayah_hp", "ibu_nama", "ibu_pekerjaan", "ibu_pendidikan", "ibu_hp"].map((k) => (
              <input key={k} type="hidden" name={k} value={f[k] ?? ""} />
            ))}

            <div className="form-top">
              <span className="lbl">Langkah {step + 1} dari 4 · {STEPS[step].t}</span>
              <div className="progress">{STEPS.map((_, i) => <span key={i} className={i < step ? "done" : i === step ? "current" : ""} />)}</div>
            </div>

            <div className="form-content">
              {state.message && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>{state.message}</p>}

              {/* STEP 1 */}
              <div className={`pane${step === 0 ? " show" : ""}`}>
                <h2>Mulai dari identitas dasar 👋</h2>
                <p className="desc">Nama lengkap, jenis kelamin, dan tanggal lahir adalah inti — sisanya bisa dilengkapi belakangan.</p>
                <div className="photo-upload">
                  <div className="ph"><span>{inisial}</span><div className="cam">📷</div></div>
                  <div className="meta"><div className="t">Foto siswa</div><div className="s">Unggah lewat halaman profil setelah data tersimpan.</div><div className="lim">Inisial tampil di kartu untuk sementara</div></div>
                </div>
                <div className="field"><label>Nama Lengkap<span className="req">*</span></label><input type="text" value={f.namaLengkap ?? ""} onChange={(e) => set("namaLengkap", e.target.value)} placeholder="Contoh: Ananda Putri Lestari" /></div>
                <div className="field"><label>Jenis Kelamin<span className="req">*</span></label>
                  <div className="jk-toggle">
                    {[["P", "👧", "Perempuan", "♀"], ["L", "👦", "Laki-laki", "♂"]].map(([v, em, t, sym]) => (
                      <label key={v} className={f.jenisKelamin === v ? "selected" : ""} onClick={() => set("jenisKelamin", v)}>
                        <span className="emoji">{em}</span><span className="info-r"><span className="t">{t}</span><span className="s">Tampil sebagai {sym}</span></span>
                        <span className="check"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 5 L4 7 L8 3" /></svg></span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>Tempat Lahir</label><input type="text" value={f.tempatLahir ?? ""} onChange={(e) => set("tempatLahir", e.target.value)} placeholder="Contoh: Bandung" /></div>
                  <div className="field"><label>Tanggal Lahir<span className="req">*</span></label><input type="date" value={f.tanggalLahir ?? ""} onChange={(e) => set("tanggalLahir", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">Identitas tambahan</span><div className="ln" /></div>
                <div className="grid-3">
                  <div className="field"><label>NIK</label><input type="text" maxLength={16} value={f.nik ?? ""} onChange={(e) => set("nik", e.target.value)} placeholder="16 digit" /></div>
                  <div className="field"><label>Agama</label><select value={f.agama ?? ""} onChange={(e) => set("agama", e.target.value)}><option value="">—</option>{AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
                  <div className="field"><label>Anak ke</label><input type="number" min={1} value={f.anakKe ?? ""} onChange={(e) => set("anakKe", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>Hobi</label><input type="text" value={f.hobi ?? ""} onChange={(e) => set("hobi", e.target.value)} placeholder="Membaca, melukis" /></div>
                  <div className="field"><label>Cita-cita</label><input type="text" value={f.citaCita ?? ""} onChange={(e) => set("citaCita", e.target.value)} placeholder="Dokter" /></div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className={`pane${step === 1 ? " show" : ""}`}>
                <h2>Data akademik 🎓</h2>
                <p className="desc">Nomor induk & penempatan kelas. Bisa diubah kapan saja.</p>
                <div className="grid-3">
                  <div className="field"><label>NISN</label><input type="text" value={f.nisn ?? ""} onChange={(e) => set("nisn", e.target.value)} placeholder="10 digit" /></div>
                  <div className="field"><label>NIS</label><input type="text" value={f.nis ?? ""} onChange={(e) => set("nis", e.target.value)} /></div>
                  <div className="field"><label>No. Induk</label><input type="text" value={f.noInduk ?? ""} onChange={(e) => set("noInduk", e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>Tahun Masuk</label><input type="number" value={f.tahunMasuk ?? ""} onChange={(e) => set("tahunMasuk", e.target.value)} placeholder="2025" /></div>
                  <div className="field"><label>Asal Sekolah</label><input type="text" value={f.asalSekolah ?? ""} onChange={(e) => set("asalSekolah", e.target.value)} placeholder="SMP Negeri 1" /></div>
                </div>
                <div className="field"><label>Status</label><div className="chip-pick">{STATUS.map((s) => <button type="button" key={s} className={f.status === s ? "selected" : ""} onClick={() => set("status", s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></div>
                <div className="field"><label>Tempatkan di Kelas/Rombel</label><select value={f.rombelId ?? ""} onChange={(e) => set("rombelId", e.target.value)}><option value="">— Belum ditempatkan —</option>{rombels.map((r) => <option key={r.id} value={r.id}>{r.nama} · {r.tahun}</option>)}</select></div>
              </div>

              {/* STEP 3 */}
              <div className={`pane${step === 2 ? " show" : ""}`}>
                <h2>Alamat & kontak 📍</h2>
                <p className="desc">Untuk komunikasi dan estimasi perjalanan ke sekolah.</p>
                <div className="field"><label>Alamat Lengkap</label><textarea rows={2} value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} placeholder="Jl. Melati No. 24, RT 03/RW 05" /></div>
                <div className="grid-3">
                  <div className="field"><label>Kelurahan/Desa</label><input type="text" value={f.desaKel ?? ""} onChange={(e) => set("desaKel", e.target.value)} /></div>
                  <div className="field"><label>Kecamatan</label><input type="text" value={f.kecamatan ?? ""} onChange={(e) => set("kecamatan", e.target.value)} /></div>
                  <div className="field"><label>Kabupaten/Kota</label><input type="text" value={f.kabupaten ?? ""} onChange={(e) => set("kabupaten", e.target.value)} /></div>
                </div>
                <div className="grid-3">
                  <div className="field"><label>Kode Pos</label><input type="text" value={f.kodePos ?? ""} onChange={(e) => set("kodePos", e.target.value)} /></div>
                  <div className="field"><label>No. HP Siswa</label><input type="text" value={f.noHp ?? ""} onChange={(e) => set("noHp", e.target.value)} placeholder="+62 8xx" /></div>
                  <div className="field"><label>Transportasi</label><input type="text" value={f.transportasi ?? ""} onChange={(e) => set("transportasi", e.target.value)} placeholder="Sepeda motor" /></div>
                </div>
                <div className="field"><label>Tinggal Dengan</label><input type="text" value={f.tinggalDengan ?? ""} onChange={(e) => set("tinggalDengan", e.target.value)} placeholder="Orang tua" /></div>
              </div>

              {/* STEP 4 */}
              <div className={`pane${step === 3 ? " show" : ""}`}>
                <h2>Orang tua & kesehatan 👨‍👩‍👧</h2>
                <p className="desc">Kontak wali untuk komunikasi sekolah, dan biometri untuk BMI otomatis.</p>
                <div className="div-line"><span className="t">Ayah</span><div className="ln" /></div>
                <div className="grid-2">
                  <div className="field"><label>Nama Ayah</label><input type="text" value={f.ayah_nama ?? ""} onChange={(e) => set("ayah_nama", e.target.value)} /></div>
                  <div className="field"><label>Pekerjaan</label><input type="text" value={f.ayah_pekerjaan ?? ""} onChange={(e) => set("ayah_pekerjaan", e.target.value)} /></div>
                  <div className="field"><label>Pendidikan</label><input type="text" value={f.ayah_pendidikan ?? ""} onChange={(e) => set("ayah_pendidikan", e.target.value)} /></div>
                  <div className="field"><label>No. HP Ayah</label><input type="text" value={f.ayah_hp ?? ""} onChange={(e) => set("ayah_hp", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">Ibu</span><div className="ln" /></div>
                <div className="grid-2">
                  <div className="field"><label>Nama Ibu</label><input type="text" value={f.ibu_nama ?? ""} onChange={(e) => set("ibu_nama", e.target.value)} /></div>
                  <div className="field"><label>Pekerjaan</label><input type="text" value={f.ibu_pekerjaan ?? ""} onChange={(e) => set("ibu_pekerjaan", e.target.value)} /></div>
                  <div className="field"><label>Pendidikan</label><input type="text" value={f.ibu_pendidikan ?? ""} onChange={(e) => set("ibu_pendidikan", e.target.value)} /></div>
                  <div className="field"><label>No. HP Ibu</label><input type="text" value={f.ibu_hp ?? ""} onChange={(e) => set("ibu_hp", e.target.value)} /></div>
                </div>
                <div className="div-line"><span className="t">Kesehatan</span><div className="ln" /></div>
                <div className="grid-3">
                  <div className="field"><label>Tinggi (cm)</label><input type="number" value={f.tinggiBadan ?? ""} onChange={(e) => set("tinggiBadan", e.target.value)} /></div>
                  <div className="field"><label>Berat (kg)</label><input type="number" value={f.beratBadan ?? ""} onChange={(e) => set("beratBadan", e.target.value)} /></div>
                  <div className="field"><label>Gol. Darah</label><select value={f.golonganDarah ?? ""} onChange={(e) => set("golonganDarah", e.target.value)}><option value="">—</option>{["A", "B", "AB", "O"].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                </div>
                {b && <div style={{ background: "var(--ak-mint)", color: "var(--ak-mint-deep)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>📏 BMI otomatis: {b.value} — {b.kategori}</div>}
                <div className="field" style={{ marginTop: 12 }}><label>Kebutuhan Khusus</label><input type="text" value={f.kebutuhanKhusus ?? ""} onChange={(e) => set("kebutuhanKhusus", e.target.value)} placeholder="Kosongkan jika tidak ada" /></div>
              </div>
            </div>

            <div className="form-foot">
              <span className="auto">Tersimpan otomatis ke draf</span>
              <div className="sp" />
              {step > 0 && <button type="button" className="btn-g" onClick={() => setStep((s) => s - 1)}>← Mundur</button>}
              {!last
                ? <button type="button" className="btn-p" onClick={() => setStep((s) => s + 1)}>Selanjutnya →</button>
                : <button type="submit" disabled={pending} className="btn-p save">{pending ? "Menyimpan…" : "✓ Simpan siswa"}</button>}
            </div>
          </form>
        </div>

        {/* PREVIEW RAIL */}
        <aside className="preview-rail">
          <div className="preview-card">
            <div className="preview-h"><h3>🪪 Kartu Pelajar</h3><span className="live">Live preview</span></div>
            <div className="mini-kartu">
              <div className="mk-photo">{inisial}</div>
              <div className="mk-info">
                <div className="head">{sekolah}</div>
                <div className="nm">{f.namaLengkap || "Nama Siswa"}</div>
                <div className="kls">{rombel ? `${rombel.nama} · ${rombel.tahun}` : "Kelas belum dipilih"}</div>
                <div className="row">NISN <b>{f.nisn || "—"}</b></div>
                <div className="row">TTL <b>{ttlStr}</b></div>
              </div>
            </div>
            {z && nm ? (
              <div className="persona-hint">
                <div className="ttl">Profil otomatis dari TTL</div>
                <h4>{z.name} {z.sym} — {z.tags[2] ?? "unik"}</h4>
                <p>{z.desc.split(".")[0]}. Angka hidup <b>{nm.angka}</b> — {nm.tags.join(", ").toLowerCase()}.</p>
              </div>
            ) : <div className="persona-hint"><div className="ttl">Profil otomatis</div><p>Isi tanggal lahir untuk melihat zodiak &amp; numerologi.</p></div>}
          </div>

          <div className="preview-summary">
            <h3>📋 Kelengkapan data</h3>
            <div className="completion"><div className="fill" style={{ width: `${pct}%` }} /></div>
            <div className="completion-text"><span><b>{pct}%</b> lengkap</span><span>{done} dari {checks.length} wajib</span></div>
            <div className="data-rows">
              {checks.map((c) => (
                <div className="dr" key={c.k}>
                  <span className="lbl">{c.k}</span>
                  <span className={`v${c.v ? "" : " empty"}`}>{c.show || "Belum diisi"}</span>
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
