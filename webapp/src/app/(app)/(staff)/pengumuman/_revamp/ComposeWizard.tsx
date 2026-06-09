"use client";

import { useActionState, useState } from "react";
import { TiptapEditor } from "@/components/TiptapEditor";
import { createPengumuman, type PengumumanFormState } from "../actions";
import type { PengData } from "./data";

const KAT = [
  { key: "akademik", label: "Akademik", hint: "Ujian, kelulusan, rapor", cls: "c-akademik" },
  { key: "keuangan", label: "Keuangan", hint: "SPP, biaya kegiatan", cls: "c-keuangan" },
  { key: "kegiatan", label: "Kegiatan", hint: "Lomba, acara, OSIS", cls: "c-kegiatan" },
  { key: "umum", label: "Umum", hint: "Libur, peminjaman buku", cls: "c-umum" },
  { key: "penting", label: "Penting", hint: "Mendesak & prioritas", cls: "c-penting" },
];
const STEPS = [
  { t: "Pilih jenis", s: "Kategori & prioritas" },
  { t: "Tulis isi", s: "Judul & isi pesan" },
  { t: "Pilih penerima", s: "Siapa yang dikirim" },
  { t: "Kirim sekarang", s: "Tinjau & jadwalkan" },
];

export function ComposeWizard({ open, onClose, data }: { open: boolean; onClose: () => void; data: PengData }) {
  const [step, setStep] = useState(0);
  const [kategori, setKategori] = useState("akademik");
  const [pinned, setPinned] = useState(false);
  const [prioritas, setPrioritas] = useState(false);
  const [butuhBalasan, setButuhBalasan] = useState(false);
  const [judul, setJudul] = useState("");
  const [target, setTarget] = useState("semua");
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [channels, setChannels] = useState<Set<string>>(new Set(["wa"]));
  const [reminderHours, setReminderHours] = useState(0);
  const [state, formAction, pending] = useActionState<PengumumanFormState, FormData>(createPengumuman, { ok: false });

  const targets = [
    { key: "semua", label: "Semua", n: data.audience.semua, unit: "orang" },
    { key: "ortu", label: "Ortu", n: data.audience.ortu, unit: "wali" },
    { key: "siswa", label: "Siswa", n: data.audience.siswa, unit: "siswa" },
    { key: "staf", label: "Staf", n: data.audience.guru, unit: "PTK" },
  ];
  const toggleCh = (c: string) => setChannels((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const last = step === 3;
  const targetN = targets.find((t) => t.key === target)?.n ?? 0;

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
          {/* hidden state → server action */}
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
              <p className="desc">Pilih kategori agar penerima tahu pentingnya — dan otomatis terkelompok di papan.</p>
              <div className="pg-wz-grid3">
                {KAT.map((k) => (
                  <button type="button" key={k.key} className={`pg-wz-card${kategori === k.key ? " sel" : ""}`} onClick={() => setKategori(k.key)}>
                    <span className="chk">✓</span>
                    <span className={`ico ${k.cls}`} />
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
              <h4>Tulis isi</h4>
              <p className="desc">Pakai bahasa hangat dan jelas. Hindari singkatan yang membingungkan.</p>
              <div className="pg-field">
                <label>Judul pengumuman — singkat, sampai 60 huruf</label>
                <input type="text" name="judul" value={judul} maxLength={80} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Pembayaran SPP Bulan Juni 2026" />
              </div>
              <div className="pg-field">
                <label>Isi pesan</label>
                <TiptapEditor name="isi" placeholder="Tulis isi pengumuman. Gunakan toolbar untuk memformat…" minHeight="200px" />
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
                    <span className="ico c-akademik" />
                    <div className="nm">{t.label}</div>
                    <div className="hint">{t.n.toLocaleString("id-ID")} {t.unit}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 4 */}
            <div style={{ display: step === 3 ? "block" : "none" }}>
              <h4>Tinjau & kirim</h4>
              <p className="desc">Cek preview pesan. Bisa langsung kirim atau jadwalkan.</p>
              <div className="pg-wz-grid3" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
                <button type="button" className={`pg-wz-card${mode === "now" ? " sel" : ""}`} style={{ textAlign: "left" }} onClick={() => setMode("now")}>
                  <div className="nm">Kirim sekarang</div><div className="hint">Langsung ke semua penerima</div>
                </button>
                <button type="button" className={`pg-wz-card${mode === "schedule" ? " sel" : ""}`} style={{ textAlign: "left" }} onClick={() => setMode("schedule")}>
                  <div className="nm">Jadwalkan</div><div className="hint">Pilih tanggal & jam terbit</div>
                </button>
              </div>
              {mode === "schedule" && (
                <div className="pg-field"><label>Tanggal & jam terbit</label><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
              )}
              <div className="pg-field">
                <label>Kirim juga via</label>
                <div className="pg-wz-flags" style={{ marginTop: 0 }}>
                  {[["wa", "WhatsApp"], ["email", "Email"], ["sms", "SMS"]].map(([c, l]) => (
                    <button type="button" key={c} className={`pg-chip${channels.has(c) ? " on" : ""}`} onClick={() => toggleCh(c)}>{channels.has(c) ? "✓ " : "+ "}{l}</button>
                  ))}
                </div>
              </div>
              <div className="pg-field">
                <label>Pengingat ulang</label>
                <select value={reminderHours} onChange={(e) => setReminderHours(Number(e.target.value))}>
                  <option value={0}>Tidak perlu</option>
                  <option value={24}>Ulang 1× setelah 24 jam (yang belum baca)</option>
                  <option value={48}>Ulang 1× setelah 48 jam (yang belum baca)</option>
                </select>
              </div>
              <div className="pg-wa">
                <div className="pg-wa-lbl">Preview di WhatsApp</div>
                <div className="pg-wa-bubble">
                  <b>{judul || "(judul pengumuman)"}</b>{"\n"}
                  {KAT.find((k) => k.key === kategori)?.label} · {data.schoolName}
                  <span className="tm">sekarang ✓✓</span>
                </div>
              </div>
              <div className="pg-summary">
                Akan terkirim ke <b>{targetN.toLocaleString("id-ID")} {targets.find((t) => t.key === target)?.unit}</b> via kategori <b>{KAT.find((k) => k.key === kategori)?.label}</b>{mode === "schedule" && scheduledAt ? ` — terjadwal ${new Date(scheduledAt).toLocaleString("id-ID")}` : " — langsung"}.
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
