"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import "./editpengumuman.css";
import { TiptapEditor } from "@/components/TiptapEditor";
import { updatePengumuman, arsipPengumuman, hapusPengumuman, type PengumumanFormState } from "../actions";
import type { PengumumanEdit } from "./editData";

const KAT = [
  { key: "umum", label: "Umum", emoji: "📣", color: "var(--ak-peach-deep)" },
  { key: "akademik", label: "Akademik", emoji: "📘", color: "var(--ak-lav-deep)" },
  { key: "keuangan", label: "Keuangan", emoji: "💰", color: "var(--ak-sun-deep)" },
  { key: "kegiatan", label: "Kegiatan", emoji: "🎉", color: "var(--ak-pink-deep)" },
  { key: "staf", label: "Staf", emoji: "👥", color: "var(--ak-mint-deep)" },
];
const TARGETS = [
  { key: "semua", label: "Semua" },
  { key: "ortu", label: "👨‍👩‍👧 Orang tua" },
  { key: "siswa", label: "👤 Siswa" },
  { key: "staf", label: "👥 Staf" },
];
const CHAN = [["wa", "WhatsApp"], ["email", "Email"], ["sms", "SMS"]] as const;
const AV = ["lav", "mint", "peach", "sky", "pink"];
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
function rel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} j`;
  return `${Math.floor(h / 24)} h`;
}

export function EditPengumumanForm({ data }: { data: PengumumanEdit }) {
  const [kategori, setKategori] = useState(data.kategori);
  const [judul, setJudul] = useState(data.judul);
  const [isi, setIsi] = useState(data.isi);
  const [target, setTarget] = useState(data.target);
  const [pinned, setPinned] = useState(data.pinned);
  const [prioritas, setPrioritas] = useState(data.prioritas);
  const [butuhBalasan, setButuhBalasan] = useState(data.butuhBalasan);
  const [channels, setChannels] = useState<Set<string>>(new Set(data.channels));
  const [reminderHours, setReminderHours] = useState(data.reminderHours ?? 0);
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState<PengumumanFormState, FormData>(updatePengumuman, { ok: false });

  const ch = {
    kategori: kategori !== data.kategori,
    judul: judul !== data.judul,
    isi: isi !== data.isi,
    target: target !== data.target,
    tandai: pinned !== data.pinned || prioritas !== data.prioritas || butuhBalasan !== data.butuhBalasan,
    channels: [...channels].sort().join() !== [...data.channels].sort().join(),
    reminder: reminderHours !== (data.reminderHours ?? 0),
  };
  const changedCount = Object.values(ch).filter(Boolean).length;

  const toggleCh = (c: string) => setChannels((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const reset = () => {
    setKategori(data.kategori); setJudul(data.judul); setIsi(data.isi); setTarget(data.target);
    setPinned(data.pinned); setPrioritas(data.prioritas); setButuhBalasan(data.butuhBalasan);
    setChannels(new Set(data.channels)); setReminderHours(data.reminderHours ?? 0);
  };

  const { readByTipe, recipientTotal, readCount } = data;
  const pct = recipientTotal > 0 ? Math.round((readCount / recipientTotal) * 100) : 0;
  const belum = Math.max(0, recipientTotal - readCount);
  const seg = (n: number) => (recipientTotal > 0 ? (n / recipientTotal) * 100 : 0);
  const waText = useMemo(() => `*${judul}*\n\n${isi.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)}`, [judul, isi]);

  async function onArsip() {
    if (busy || !confirm("Arsipkan pengumuman ini? Tidak akan muncul di papan publik (bisa dipulihkan).")) return;
    setBusy(true); try { await arsipPengumuman(data.id); } finally { setBusy(false); }
  }
  async function onHapus() {
    if (busy || !confirm("Hapus permanen pengumuman ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(true); try { await hapusPengumuman(data.id); } finally { setBusy(false); }
  }

  return (
    <div id="ak-peng-edit">
      <div className="crumb">
        <Link href="/pengumuman">Pengumuman</Link>
        <span className="sep">/</span>
        <span style={{ color: "var(--ak-ink-3)", textTransform: "capitalize" }}>{data.kategori}</span>
        <span className="sep">/</span>
        <b>Edit pengumuman</b>
      </div>

      <form action={formAction}>
        <input type="hidden" name="id" value={data.id} />
        <input type="hidden" name="kategori" value={kategori} />
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="isi" value={isi} />
        {pinned && <input type="hidden" name="pinned" value="on" />}
        {prioritas && <input type="hidden" name="prioritas" value="on" />}
        {butuhBalasan && <input type="hidden" name="butuhBalasan" value="on" />}
        {[...channels].map((c) => <input key={c} type="hidden" name="channels" value={c} />)}
        {reminderHours > 0 && <input type="hidden" name="reminderHours" value={reminderHours} />}

        {/* HEADER */}
        <div className="edit-h">
          <div className="ic">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="13" cy="9" rx="9" ry="3" /><path d="M4 9 L4 17 Q4 21 13 21 Q22 21 22 17 L22 9" /></svg>
          </div>
          <div className="info">
            <span className="badge-mode">Mode edit</span>
            <h1>{judul || "(tanpa judul)"}</h1>
            <div className="meta">Kategori <b style={{ textTransform: "capitalize" }}>{data.kategori}</b> · Diposting <b>{fmtDate(data.createdAtISO)} · {fmtTime(data.createdAtISO)}</b>{data.author && <> · oleh <b>{data.author}</b></>}</div>
          </div>
          <div className="actions">
            <Link href="/pengumuman" className="btn btn-ghost">← Batal</Link>
            <button type="submit" className="btn btn-save" disabled={pending}>{pending ? "Menyimpan…" : "✓ Simpan perubahan"}</button>
          </div>
        </div>

        <div className="edit-shell">
          {/* FORM SIDE */}
          <div>
            {state.message && <p style={{ background: "#fdecec", color: "#c0392b", borderRadius: 12, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{state.message}</p>}

            <div className="card">
              <h3>📝 Konten Pengumuman</h3>
              <div className="field">
                <label>Kategori</label>
                <div className="pick-row">
                  {KAT.map((k) => (
                    <button type="button" key={k.key} className={kategori === k.key ? "selected" : ""} onClick={() => setKategori(k.key)}>
                      <span style={{ color: k.color }}>{k.emoji}</span>{k.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`field${ch.judul ? " changed" : ""}`}>
                <label>Judul pengumuman</label>
                <input type="text" name="judul" value={judul} maxLength={120} onChange={(e) => setJudul(e.target.value)} />
              </div>

              <div className="field">
                <label>Isi pesan</label>
                <div className={`rich-wrap${ch.isi ? " changed" : ""}`}>
                  <TiptapEditor name="isi-display" defaultValue={data.isi} minHeight="170px" onChange={setIsi} />
                </div>
              </div>

              <div className="field">
                <label>Tandai sebagai</label>
                <div className="tag-row">
                  <button type="button" className={pinned ? "on" : ""} onClick={() => setPinned((v) => !v)}>📌 Sematkan</button>
                  <button type="button" className={prioritas ? "on" : ""} onClick={() => setPrioritas((v) => !v)}>⚡ Prioritas tinggi</button>
                  <button type="button" className={butuhBalasan ? "on" : ""} onClick={() => setButuhBalasan((v) => !v)}>🔔 Butuh balasan</button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>👥 Penerima &amp; Saluran</h3>
              <div className={`field${ch.target ? " changed" : ""}`}>
                <label>Target penerima</label>
                <div className="target-chips">
                  {TARGETS.map((t) => (
                    <button type="button" key={t.key} className={target === t.key ? "selected" : ""} onClick={() => setTarget(t.key)}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className={`field${ch.channels ? " changed" : ""}`}>
                  <label>Kirim juga via</label>
                  <div className="chan-row">
                    {CHAN.map(([c, l]) => (
                      <button type="button" key={c} className={channels.has(c) ? "on" : ""} onClick={() => toggleCh(c)}>{channels.has(c) ? "✓ " : "+ "}{l}</button>
                    ))}
                  </div>
                </div>
                <div className={`field${ch.reminder ? " changed" : ""}`}>
                  <label>Pengingat ulang</label>
                  <select value={reminderHours} onChange={(e) => setReminderHours(Number(e.target.value))}>
                    <option value={0}>Jangan diulang</option>
                    <option value={24}>Ulang 1× setelah 24 jam</option>
                    <option value={12}>Ulang setelah 12 jam</option>
                    <option value={48}>Ulang setelah 48 jam</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ANALYTICS RAIL */}
          <aside className="analytics-rail">
            <div className="reach-card">
              <div className="lbl">Tingkat dibaca</div>
              <div className="big">{pct}<small>%</small></div>
              <div className="d">{readCount.toLocaleString("id-ID")} dari {recipientTotal.toLocaleString("id-ID")} penerima</div>
              <div className="reach-bar">
                <div className="seg" style={{ flexGrow: seg(readByTipe.siswa), background: "var(--ak-mint-deep)" }} />
                <div className="seg" style={{ flexGrow: seg(readByTipe.ortu), background: "var(--ak-lav-deep)" }} />
                <div className="seg" style={{ flexGrow: seg(readByTipe.guru), background: "var(--ak-sky-deep)" }} />
                <div className="seg" style={{ flexGrow: seg(belum), background: "transparent" }} />
              </div>
              <div className="reach-legend">
                <div className="lg"><span className="sw" style={{ background: "var(--ak-mint-deep)" }} /><span>Siswa</span><b>{readByTipe.siswa.toLocaleString("id-ID")}</b></div>
                <div className="lg"><span className="sw" style={{ background: "var(--ak-lav-deep)" }} /><span>Orang tua</span><b>{readByTipe.ortu.toLocaleString("id-ID")}</b></div>
                <div className="lg"><span className="sw" style={{ background: "var(--ak-sky-deep)" }} /><span>Guru/Staf</span><b>{readByTipe.guru.toLocaleString("id-ID")}</b></div>
              </div>
            </div>

            {belum > 0 && (
              <div className="pending-card">
                <h4>{belum.toLocaleString("id-ID")} penerima belum baca</h4>
                <p>Kemungkinan WA terhalang atau nomor tidak aktif. Coba sapa lewat saluran lain.</p>
                <a className="btn-wa" href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1 A4.5 4.5 0 0 0 1.5 8 L1 10.5 L3.5 10 A4.5 4.5 0 1 0 6 1 Z" /></svg>
                  Kirim WA susulan
                </a>
              </div>
            )}

            <div className="reads-card">
              <h3>👁 Pembaca terkini <span className="live">Live</span></h3>
              {data.recentReaders.length === 0 ? (
                <div className="reads-empty">Belum ada yang membaca.</div>
              ) : (
                <div className="reads-list">
                  {data.recentReaders.map((r, i) => (
                    <div className="read-row" key={`${r.id}-${i}`}>
                      <div className={`read-av ${AV[i % AV.length]}`}>{r.inisial}</div>
                      <div className="read-info"><div className="nm">{r.nama} ({r.tipe})</div><div className="s"><span className="ch">✓✓</span>via aplikasi</div></div>
                      <div className="read-time">{rel(r.readAtISO)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="danger-card">
              <h3>⚠ Tindakan Sensitif</h3>
              <div className="sub">Jangan ubah jika sudah banyak yang membaca.</div>
              <div className="danger-actions">
                <button type="button" className="archive" onClick={onArsip} disabled={busy}>
                  <span className="e">📦</span>
                  <div style={{ lineHeight: 1.3 }}><div>Arsipkan pengumuman</div><div className="sm">Tidak muncul di papan publik</div></div>
                </button>
                <button type="button" className="del" onClick={onHapus} disabled={busy}>
                  <span className="e">🗑</span>
                  <div style={{ lineHeight: 1.3 }}><div>Hapus permanen</div><div className="sm">Tidak bisa dibatalkan</div></div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* SAVE BAR */}
        <div className={`save-bar${changedCount > 0 ? " show" : ""}`}>
          <span className="ct"><span className="dot" /><b>{changedCount}</b> perubahan belum disimpan</span>
          <span className="sep" />
          <button type="button" className="discard" onClick={reset}>Batalkan</button>
          <button type="submit" className="save" disabled={pending}>✓ Simpan semua</button>
        </div>
      </form>
    </div>
  );
}
