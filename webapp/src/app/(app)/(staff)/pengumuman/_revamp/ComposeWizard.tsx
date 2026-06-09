"use client";

import { useActionState, useRef, useState } from "react";
import { TiptapEditor } from "@/components/TiptapEditor";
import { createPengumuman, type PengumumanFormState } from "../actions";
import type { PengData } from "./data";

function strip(html: string, n = 220): string {
  const t = html.replace(/<\/(p|div|h[1-6]|li)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

const I = {
  akademik: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6 L10 11 L17 6" /><rect x="3" y="6" width="14" height="10" rx="1.5" /></svg>,
  keuangan: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="6" rx="7" ry="2.6" /><path d="M3 6 V14 Q3 16.6 10 16.6 Q17 16.6 17 14 V6" /></svg>,
  kegiatan: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2.5 L12.4 7.5 L18 8 L13.8 11.6 L15.2 17 L10 14 L4.8 17 L6.2 11.6 L2 8 L7.6 7.5 Z" /></svg>,
  umum: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 L12 5 L12 15 L3 11 Z" /><path d="M12 7 Q17 7 17 10 Q17 13 12 13" /></svg>,
  staf: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="7" r="2.3" /><circle cx="13" cy="7" r="2.3" /><path d="M2.5 16 Q2.5 12 6.5 12 Q9 12 10 13" /><path d="M17.5 16 Q17.5 12 13 12 Q10.5 12 9.5 13.5" /></svg>,
  lainnya: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.5" /><path d="M8 8 Q8 6 10 6 Q12 6 12 8 Q12 9.4 10 10 L10 11.6" /><circle cx="10" cy="14" r="0.6" fill="currentColor" /></svg>,
};
const KAT = [
  { key: "akademik", label: "Akademik", hint: "Ujian, kelulusan, rapor", cls: "c-akademik", ico: I.akademik },
  { key: "keuangan", label: "Keuangan", hint: "SPP, biaya kegiatan", cls: "c-keuangan", ico: I.keuangan },
  { key: "kegiatan", label: "Kegiatan", hint: "Lomba, acara, OSIS", cls: "c-kegiatan", ico: I.kegiatan },
  { key: "umum", label: "Umum", hint: "Libur, peminjaman buku", cls: "c-umum", ico: I.umum },
  { key: "staf", label: "Staf", hint: "Rapat guru, internal", cls: "c-penting", ico: I.staf },
  { key: "lainnya", label: "Lainnya", hint: "Buat kategori baru", cls: "c-akademik", ico: I.lainnya },
];
const TGT_I = {
  semua: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="6.5" r="3" /><path d="M3.5 16.5 Q3.5 11 10 11 Q16.5 11 16.5 16.5" /></svg>,
  ortu: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8 H17 M7 2.5 V5 M13 2.5 V5" /></svg>,
  siswa: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="6.5" r="3" /><path d="M3.5 16.5 Q3.5 11 10 11 Q16.5 11 16.5 16.5" /></svg>,
  staf: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="7" r="2.3" /><circle cx="13" cy="7" r="2.3" /><path d="M2.5 16 Q2.5 12 6.5 12 Q9 12 10 13" /><path d="M17.5 16 Q17.5 12 13 12 Q10.5 12 9.5 13.5" /></svg>,
};
const STEPS = [
  { t: "Pilih jenis", s: "Kategori & prioritas" },
  { t: "Tulis isi", s: "Judul & isi pesan" },
  { t: "Pilih penerima", s: "Siapa yang dikirim" },
  { t: "Kirim sekarang", s: "Tinjau & jadwalkan" },
];
const KELAS = ["Kelas 10", "Kelas 11", "Kelas 12", "MIPA", "IPS", "Bahasa"];

export function ComposeWizard({ open, onClose, data }: { open: boolean; onClose: () => void; data: PengData }) {
  const [step, setStep] = useState(0);
  const [kategori, setKategori] = useState("akademik");
  const [pinned, setPinned] = useState(false);
  const [prioritas, setPrioritas] = useState(false);
  const [butuhBalasan, setButuhBalasan] = useState(false);
  const [judul, setJudul] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("semua");
  const [kelas, setKelas] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [channels, setChannels] = useState<Set<string>>(new Set(["wa"]));
  const [reminderHours, setReminderHours] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [mention, setMention] = useState("");
  const [sug, setSug] = useState<{ id: number; namaLengkap: string; nisn: string | null }[]>([]);
  const [state, formAction, pending] = useActionState<PengumumanFormState, FormData>(createPengumuman, { ok: false });

  async function onMention(v: string) {
    setMention(v);
    const m = (v.split(",").pop() ?? "").trim().replace(/^@/, "");
    if (m.length < 2) { setSug([]); return; }
    try { const r = await fetch(`/api/siswa/cari?q=${encodeURIComponent(m)}`); setSug(r.ok ? await r.json() : []); } catch { setSug([]); }
  }
  function pickSug(name: string) {
    const parts = mention.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) parts[parts.length - 1] = `@${name}`; else parts.push(`@${name}`);
    setMention(parts.join(", ") + ", ");
    setSug([]);
  }
  function onFiles(list: FileList | null) { setFileNames([...(list ?? [])].map((f) => f.name)); }

  const targets = [
    { key: "semua", label: "Semua", n: data.audience.semua, unit: "orang" },
    { key: "ortu", label: "Ortu", n: data.audience.ortu, unit: "wali" },
    { key: "siswa", label: "Siswa", n: data.audience.siswa, unit: "siswa" },
    { key: "staf", label: "Staf", n: data.audience.guru, unit: "PTK" },
  ];
  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, c: string) => set((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const last = step === 3;
  const tgt = targets.find((t) => t.key === target)!;
  const katLabel = KAT.find((k) => k.key === kategori)?.label ?? "Umum";
  const bodyText = strip(body);

  return (
    <div className={`pg-modal-ov${open ? " show" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pg-modal">
        <div className="pg-wz-side">
          <div className="wl">Buat pengumuman</div>
          <h3>Sampaikan <em>tepat sasaran</em>, dalam 4 langkah.</h3>
          {STEPS.map((s, i) => (
            <div key={i} className={`pg-wz-step${i === step ? " active" : i < step ? " done" : ""}`} onClick={() => i < step && setStep(i)}>
              <span className="num">{i < step ? "✓" : i + 1}</span>
              <div><div className="st">{s.t}</div><div className="ss">{s.s}</div></div>
            </div>
          ))}
        </div>

        <form action={formAction} className="pg-wz-main">
          <input type="hidden" name="kategori" value={kategori} />
          <input type="hidden" name="target" value={target} />
          {pinned && <input type="hidden" name="pinned" value="on" />}
          {prioritas && <input type="hidden" name="prioritas" value="on" />}
          {butuhBalasan && <input type="hidden" name="butuhBalasan" value="on" />}
          {mode === "schedule" && scheduledAt && <input type="hidden" name="scheduledAt" value={scheduledAt} />}
          {[...channels].map((c) => <input key={c} type="hidden" name="channels" value={c} />)}
          {reminderHours > 0 && <input type="hidden" name="reminderHours" value={reminderHours} />}

          <div className="pg-wz-top">
            <span className="tag">Langkah {step + 1} dari 4</span>
            <button type="button" className="x" onClick={onClose} aria-label="Tutup">✕</button>
          </div>

          <div className="pg-wz-content">
            {state.message && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>{state.message}</p>}

            {/* STEP 1 */}
            <div style={{ display: step === 0 ? "block" : "none" }}>
              <h4>Pengumuman tentang apa?</h4>
              <p className="desc">Pilih kategori agar penerima tahu pentingnya — dan agar otomatis terkelompok di papan pengumuman.</p>
              <div className="pg-wz-grid3">
                {KAT.map((k) => (
                  <button type="button" key={k.key} className={`pg-wz-card${kategori === k.key ? " sel" : ""}`} onClick={() => setKategori(k.key)}>
                    <span className="chk">✓</span>
                    <span className={`ico ${k.cls}`}>{k.ico}</span>
                    <div className="nm">{k.label}</div>
                    <div className="hint">{k.hint}</div>
                  </button>
                ))}
              </div>
              <div className="pg-wz-flags">
                <span className="pg-wz-flaglbl">Tandai sebagai</span>
                <button type="button" className={`pg-chip${pinned ? " on" : ""}`} onClick={() => setPinned((v) => !v)}>📌 Sematkan di atas</button>
                <button type="button" className={`pg-chip${prioritas ? " on" : ""}`} onClick={() => setPrioritas((v) => !v)}>⚡ Prioritas tinggi</button>
                <button type="button" className={`pg-chip${butuhBalasan ? " on" : ""}`} onClick={() => setButuhBalasan((v) => !v)}>🔔 Butuh balasan</button>
              </div>
            </div>

            {/* STEP 2 */}
            <div style={{ display: step === 1 ? "block" : "none" }}>
              <h4>Tulis pesan Anda</h4>
              <p className="desc">Pakai bahasa hangat dan jelas. Hindari singkatan yang membingungkan orang tua.</p>
              <div className="pg-field">
                <label>Judul pengumuman — singkat, sampai 60 huruf</label>
                <input type="text" name="judul" value={judul} maxLength={80} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Pembayaran SPP Bulan Juni 2026" />
              </div>
              <div className="pg-field">
                <label>Isi pesan</label>
                <TiptapEditor name="isi" placeholder="Tulis isi pengumuman. Gunakan toolbar untuk memformat…" minHeight="170px" onChange={setBody} />
              </div>
              <div className="pg-field">
                <label>Lampiran — gambar atau dokumen</label>
                <input ref={fileRef} id="pg-lampiran" type="file" name="lampiran" multiple accept="image/png,image/jpeg,image/webp,application/pdf" style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
                <label htmlFor="pg-lampiran"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (fileRef.current) { fileRef.current.files = e.dataTransfer.files; onFiles(e.dataTransfer.files); } }}
                  style={{ display: "block", border: "1.5px dashed var(--ak-rule)", borderRadius: 14, padding: "26px 16px", textAlign: "center", color: "var(--ak-muted)", background: "var(--ak-surface-2)", cursor: "pointer" }}>
                  <div style={{ fontSize: 22 }}>📎</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ak-ink-2)", marginTop: 4 }}>Tarik file ke sini atau klik untuk pilih</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>PNG · JPG · PDF · maks 5MB</div>
                  {fileNames.length > 0 && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--ak-primary)" }}>{fileNames.join(" · ")}</div>}
                </label>
              </div>
            </div>

            {/* STEP 3 */}
            <div style={{ display: step === 2 ? "block" : "none" }}>
              <h4>Siapa yang menerima?</h4>
              <p className="desc">Pengumuman akan muncul di aplikasi, portal, dan WhatsApp masing-masing penerima.</p>
              <div className="pg-wz-grid4">
                {targets.map((t) => (
                  <button type="button" key={t.key} className={`pg-wz-card${target === t.key ? " sel" : ""}`} onClick={() => setTarget(t.key)}>
                    <span className="chk">✓</span>
                    <span className={`ico ${target === t.key ? "c-akademik" : ""}`} style={target === t.key ? { background: "var(--ak-primary)", color: "#fff" } : { background: "var(--ak-surface-2)", color: "var(--ak-muted)" }}>{TGT_I[t.key as keyof typeof TGT_I]}</span>
                    <div className="nm">{t.label}</div>
                    <div className="hint">{t.n.toLocaleString("id-ID")} {t.unit}</div>
                  </button>
                ))}
              </div>
              <div className="pg-field" style={{ marginTop: 16 }}>
                <label>Persempit ke kelas tertentu — opsional</label>
                <div className="pg-wz-flags" style={{ marginTop: 0 }}>
                  {KELAS.map((c) => (
                    <button type="button" key={c} className={`pg-chip${kelas.has(c) ? " on" : ""}`} onClick={() => toggle(setKelas, c)}>{kelas.has(c) ? "✓ " : "+ "}{c}</button>
                  ))}
                </div>
              </div>
              <div className="pg-field" style={{ position: "relative" }}>
                <label>Atau sapa langsung beberapa orang — ketik nama / NISN</label>
                <input type="text" value={mention} onChange={(e) => onMention(e.target.value)} placeholder="@Bayu Pratama, @Ananda Putri…" autoComplete="off" />
                {sug.length > 0 && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, background: "var(--ak-surface)", border: "1px solid var(--ak-rule)", borderRadius: 12, boxShadow: "var(--ak-shadow)", zIndex: 5, overflow: "hidden" }}>
                    {sug.map((s) => (
                      <button type="button" key={s.id} onClick={() => pickSug(s.namaLengkap)} style={{ display: "flex", width: "100%", gap: 8, alignItems: "center", padding: "9px 12px", border: 0, background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: "var(--ak-ink)" }}>{s.namaLengkap}</span>
                        {s.nisn && <span style={{ fontSize: 11, color: "var(--ak-muted)" }}>NISN {s.nisn}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4 */}
            <div style={{ display: step === 3 ? "block" : "none" }}>
              <h4>Tinjau & kirim</h4>
              <p className="desc">Cek preview bagaimana penerima akan menerima pesan ini. Bisa langsung kirim atau jadwalkan.</p>
              <div className="pg-wz-grid3" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
                <button type="button" className={`pg-wz-card${mode === "now" ? " sel" : ""}`} style={{ textAlign: "left" }} onClick={() => setMode("now")}>
                  <div className="nm">Kirim sekarang</div><div className="hint">Akan langsung dikirim ke semua penerima</div>
                </button>
                <button type="button" className={`pg-wz-card${mode === "schedule" ? " sel" : ""}`} style={{ textAlign: "left" }} onClick={() => setMode("schedule")}>
                  <div className="nm">Jadwalkan</div><div className="hint">Pilih tanggal dan jam terbit</div>
                </button>
              </div>
              {mode === "schedule" && (
                <div className="pg-field"><label>Tanggal & jam terbit</label><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
              )}
              <div className="pg-wz-grid3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="pg-field" style={{ marginBottom: 8 }}>
                  <label>Kirim juga via</label>
                  <div className="pg-wz-flags" style={{ marginTop: 0 }}>
                    {[["wa", "WhatsApp"], ["email", "Email"], ["sms", "SMS"]].map(([c, l]) => (
                      <button type="button" key={c} className={`pg-chip${channels.has(c) ? " on" : ""}`} onClick={() => toggle(setChannels, c)}>{channels.has(c) ? "✓ " : "+ "}{l}</button>
                    ))}
                  </div>
                </div>
                <div className="pg-field" style={{ marginBottom: 8 }}>
                  <label>Pengingat ulang</label>
                  <select value={reminderHours} onChange={(e) => setReminderHours(Number(e.target.value))}>
                    <option value={0}>Tidak perlu</option>
                    <option value={24}>Ulang 1× setelah 24 jam (yang belum baca)</option>
                    <option value={48}>Ulang 1× setelah 48 jam (yang belum baca)</option>
                  </select>
                </div>
              </div>
              <div className="pg-wa">
                <div className="pg-wa-lbl">Preview di WhatsApp</div>
                <div className="pg-wa-bubble">
                  <b>{judul || "(judul pengumuman)"}</b>{"\n\n"}
                  {bodyText || "(isi pesan akan tampil di sini)"}{"\n\n"}
                  _{katLabel} · {data.schoolName}_
                  <span className="tm">sekarang ✓✓</span>
                </div>
              </div>
              <div className="pg-summary">
                Pengumuman ini akan terkirim ke <b>{tgt.n.toLocaleString("id-ID")} {tgt.unit}</b> dengan kategori <b>{katLabel}</b>{mode === "schedule" && scheduledAt ? ` — terjadwal ${new Date(scheduledAt).toLocaleString("id-ID")}` : " — langsung"}.
              </div>
            </div>
          </div>

          <div className="pg-wz-foot">
            <div className="pg-wz-dots">{STEPS.map((_, i) => <span key={i} className={i < step ? "done" : i === step ? "cur" : ""} />)}</div>
            <div className="sp" />
            {step > 0 && <button type="button" className="pg-btn-g" onClick={() => setStep((s) => s - 1)}>← Mundur</button>}
            {!last
              ? <button type="button" className="pg-btn-p" onClick={() => setStep((s) => s + 1)}>Selanjutnya →</button>
              : <button type="submit" disabled={pending} className="pg-btn-p send">{pending ? "Mengirim…" : "Kirim pengumuman"}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
