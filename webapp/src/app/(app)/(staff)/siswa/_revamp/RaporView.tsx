"use client";

import { useState } from "react";
import Link from "next/link";
import "./rapor.css";
import type { SiswaRapor } from "./raporData";

const CornerSvg = () => (
  <svg viewBox="0 0 48 48" fill="none"><path d="M 4 4 L 44 4 L 44 7 L 7 7 L 7 44 L 4 44 Z" fill="#8A5D0E" /><path d="M 10 10 Q 18 12 22 20 Q 20 26 12 22 Q 10 16 10 10 Z" fill="#C68A1C" /><circle cx="14" cy="14" r="2.5" fill="#FFE69E" /><path d="M 16 16 Q 26 22 30 32" stroke="#8A5D0E" strokeWidth="1.2" fill="none" /></svg>
);
const Corners = () => (<>{["tl", "tr", "bl", "br"].map((c) => <div key={c} className={`corner ${c}`}><CornerSvg /></div>)}</>);

function Watermark({ text, color }: { text: string; color: string }) {
  return (
    <div className="paper-wm">
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="92" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="100" cy="100" r="78" fill="none" stroke={color} strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={100 + 70 * Math.cos(a)} cy={100 + 70 * Math.sin(a)} r="2.5" fill={color} />; })}
        <path d="M100 55 L112 92 L150 92 L120 115 L131 150 L100 128 L69 150 L80 115 L50 92 L88 92 Z" fill={color} opacity="0.5" />
        <text x="100" y="180" textAnchor="middle" fontFamily="Tinos" fontSize="11" fontWeight="700" fill={color} letterSpacing="1">{text}</text>
      </svg>
    </div>
  );
}

const KopLogos = () => (<>
  <div className="kop-logo"><svg viewBox="0 0 70 70" fill="none"><circle cx="35" cy="35" r="32" fill="#FFF8E1" stroke="#000" strokeWidth="1.5" /><path d="M 35 12 L 18 26 L 18 50 L 28 50 L 28 38 L 42 38 L 42 50 L 52 50 L 52 26 Z" fill="#1A237E" /><path d="M 16 52 Q 35 60 54 52" stroke="#FFC107" strokeWidth="2" fill="none" /><path d="M 35 35 L 33 44 L 37 44 Z" fill="#FFC107" /></svg></div>
</>);

export function RaporView({ data }: { data: SiswaRapor }) {
  const [tab, setTab] = useState<"akademik" | "p5">("akademik");
  const s = data.sekolah, id = data.identitas;
  const place = `${(s.alamat ?? "").split(",")[0] || "—"}, ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`;

  const Kop = (
    <header className="kop">
      <KopLogos />
      <div className="kop-center">
        <div className="l1">PEMERINTAH DAERAH</div>
        <div className="l2">DINAS PENDIDIKAN</div>
        <div className="l3">{s.nama.toUpperCase()}</div>
        <div className="l4">NPSN {s.npsn ?? "—"}</div>
        <div className="l5">{s.alamat ?? "—"}{s.telepon ? <> · <b>Telp.</b> {s.telepon}</> : null}{s.email ? <> · <b>Email</b> {s.email}</> : null}</div>
      </div>
      <div className="kop-logo"><svg viewBox="0 0 70 70" fill="none"><circle cx="35" cy="35" r="32" fill="#fff" stroke="#000" strokeWidth="1.5" /><path d="M 20 50 L 35 22 L 50 50 Z" fill="#5B4FE9" /><path d="M 26 42 Q 35 38 44 42" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg></div>
    </header>
  );

  const Identitas = (rows: [string, string][]) => (
    <section className="identitas">
      <div className="identitas-title">A. IDENTITAS PESERTA DIDIK</div>
      <div className="id-grid">{rows.map(([l, v], i) => <div className="id-row" key={i}><span className="l">{l}</span><span className="v">{v}</span></div>)}</div>
    </section>
  );

  const idRows: [string, string][] = [
    ["Nama", id.nama], ["Kelas", id.kelas], ["NISN", id.nisn], ["Fase", id.fase], ["NIS", id.nis], ["Semester", id.semester],
    ["Tempat, Tgl Lahir", id.ttl], ["Tahun Pelajaran", id.tahun], ["Jenis Kelamin", id.jk], ["Wali Kelas", id.waliKelas], ["Agama", id.agama], ["No. Absen", id.absen],
  ];

  return (
    <div id="ak-rp">
      <div className="crumb"><Link href="/siswa">Siswa</Link> / <Link href={`/siswa/${data.id}`}>Profil</Link> / <b>Rapor</b></div>
      <div className="action-bar">
        <div className="ttl"><h1>Laporan Hasil Belajar</h1><p>{id.semester} · {id.tahun} · Fase {id.fase}</p></div>
        <div className="acts">
          <button className="btn btn-g" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>🔗 Bagikan link</button>
          <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(`Rapor ${id.nama} — rata-rata ${data.rataAkhir} (${data.predikat})`)}`} target="_blank" rel="noopener noreferrer">Kirim ke ortu via WA</a>
          <button className="btn btn-ink" onClick={() => window.print()}>🖨 Cetak / PDF</button>
        </div>
      </div>
      <div className="doc-tabs">
        <button className={tab === "akademik" ? "active" : ""} onClick={() => setTab("akademik")}>📄 Rapor Akademik</button>
        <button className={tab === "p5" ? "active" : ""} onClick={() => setTab("p5")}>🌱 Rapor P5</button>
      </div>

      {/* ============ AKADEMIK ============ */}
      {tab === "akademik" && (
        <article className="paper">
          <Watermark text="BHINNEKA TUNGGAL IKA" color="#8A5D0E" />
          <div className="paper-inner">
            <Corners />
            {Kop}
            <div className="doc-title"><h2>LAPORAN HASIL BELAJAR PESERTA DIDIK</h2><div className="sub">Semester {id.semester} · Tahun Pelajaran {id.tahun}</div></div>
            {Identitas(idRows)}

            <div className="sec-head">B. NILAI MATA PELAJARAN</div>
            <div className="tbl-wrap">
              {data.groups.length === 0 ? <p style={{ fontStyle: "italic", fontSize: 12 }}>Belum ada nilai untuk periode ini.</p> : (
                <table className="doc-table">
                  <thead><tr><th style={{ width: 32 }}>No</th><th>Mata Pelajaran</th><th style={{ width: 60 }}>Nilai Akhir</th><th>Capaian Kompetensi</th></tr></thead>
                  <tbody>
                    {data.groups.flatMap((g) => [
                      <tr className="group-row" key={`g-${g.label}`}><td colSpan={4}>{g.label.toUpperCase()}</td></tr>,
                      ...g.items.map((m) => <tr key={`${g.label}-${m.no}`}><td className="no">{m.no}</td><td className="mp">{m.nama}</td><td className="na">{m.nilai}</td><td className="cap">{m.capaian ?? "—"}</td></tr>),
                    ])}
                  </tbody>
                  <tfoot><tr><td className="label-foot" colSpan={2}>Rata-rata Nilai Akhir</td><td className="val">{data.rataAkhir}</td><td>Predikat: <b>{data.predikat}</b></td></tr></tfoot>
                </table>
              )}
            </div>

            <div className="sec-head">C. KEGIATAN EKSTRAKURIKULER</div>
            <div className="tbl-wrap">
              <table className="doc-table"><thead><tr><th style={{ width: 32 }}>No</th><th>Kegiatan</th><th>Keterangan</th></tr></thead>
                <tbody>{data.ekstra.length === 0 ? <tr><td className="no">—</td><td className="nm">Tidak ada data</td><td>—</td></tr> : data.ekstra.map((e, i) => <tr key={i}><td className="no">{i + 1}</td><td className="nm">{e.nama}</td><td>{e.ket || "—"}</td></tr>)}</tbody>
              </table>
            </div>

            <div className="sec-head">D. KETIDAKHADIRAN</div>
            <div className="tbl-wrap">
              <table className="doc-table hadir-table"><thead><tr><th style={{ width: 32 }}>No</th><th>Keterangan</th><th>Jumlah (hari)</th></tr></thead>
                <tbody>
                  <tr><td className="no">1</td><td className="nm">Sakit</td><td className="v">{data.hadir.sakit}</td></tr>
                  <tr><td className="no">2</td><td className="nm">Izin</td><td className="v">{data.hadir.izin}</td></tr>
                  <tr><td className="no">3</td><td className="nm">Tanpa Keterangan</td><td className="v">{data.hadir.alpa}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="sec-head">E. CATATAN WALI KELAS</div>
            <div className="box-wrap"><div className="doc-box">{data.catatan ?? `Ananda menunjukkan perkembangan dengan rata-rata ${data.rataAkhir} (${data.predikat}). Pertahankan semangat belajar dan tingkatkan keaktifan di kelas.`}</div></div>

            <div className="sec-head">F. KEPUTUSAN</div>
            <div className="box-wrap"><div className="doc-box">Berdasarkan hasil yang dicapai pada semester ini, peserta didik dinyatakan:
              <div style={{ marginTop: 10 }}>
                <span className={`opt${data.naik ? " selected" : ""}`}><span className="cbox" />NAIK ke Kelas berikutnya (Fase {id.fase})</span>
                <span className={`opt${!data.naik ? " selected" : ""}`}><span className="cbox" />TINGGAL di Kelas {id.kelas}</span>
              </div>
            </div></div>

            <section className="ttd-section">
              <div className="ttd-cell"><div className="role">Mengetahui,</div><div className="role">Orang Tua / Wali Murid</div><div className="place">{place}</div><div className="sign">&nbsp;</div><div className="nama">(……………………)</div></div>
              <div className="ttd-cell signed"><div className="role">Wali Kelas {id.kelas}</div><div className="place">{place}</div><div className="sign">{id.waliKelas.split(" ")[0]}</div><div className="nama">{id.waliKelas}</div>{id.nipWali && <div className="nip">NIP. {id.nipWali}</div>}</div>
              <div className="ttd-cell signed"><div className="role">Mengesahkan,</div><div className="role">Kepala {s.nama}</div><div className="place">{place}</div><div className="sign stamp">{(s.kepala ?? "").split(" ")[0] || "—"}</div><div className="nama">{s.kepala ?? "(……………………)"}</div>{s.nipKepala && <div className="nip">NIP. {s.nipKepala}</div>}</div>
            </section>
          </div>
          <div className="doc-foot"><span>Dokumen ini diterbitkan oleh Sistem Informasi Sekolah <b>Akadewa</b>.</span><span>No. dok: {data.noDok}</span></div>
        </article>
      )}

      {/* ============ P5 ============ */}
      {tab === "p5" && (
        <article className="paper">
          <Watermark text="PROFIL PELAJAR PANCASILA" color="#1F7E4F" />
          <div className="paper-inner">
            <Corners />
            {Kop}
            <div className="doc-title"><h2>LAPORAN PROYEK PENGUATAN PROFIL PELAJAR PANCASILA</h2><div className="sub">{id.semester} · Tahun Pelajaran {id.tahun}</div></div>
            {Identitas([["Nama", id.nama], ["Kelas", id.kelas], ["NISN", id.nisn], ["Fase", id.fase], ["NIS", id.nis], ["Tahun Pelajaran", id.tahun]])}
            <div className="skala-info"><b>Skala capaian:</b> BB = Belum Berkembang · MB = Mulai Berkembang · BSH = Berkembang Sesuai Harapan · SAB = Sangat Berkembang</div>
            <div className="sec-head">B. PROYEK YANG DIIKUTI &amp; CAPAIAN</div>
            <div className="tbl-wrap">
              {!data.p5 || data.p5.projek.length === 0 ? <p style={{ fontStyle: "italic", fontSize: 12 }}>Belum ada penilaian P5 untuk siswa ini.</p> : (
                <table className="doc-table p5-table"><thead><tr><th style={{ width: 28 }}>No</th><th>Tema &amp; Judul Proyek</th><th>Dimensi &amp; Sub-elemen</th><th style={{ width: 80 }}>Capaian</th></tr></thead>
                  <tbody>{data.p5.projek.map((p, i) => (
                    <tr key={i}><td className="no">{i + 1}</td><td className="tema"><b>{p.tema}</b><br /><em>{`"${p.judul}"`}</em></td><td className="dim">{p.elemen.map((e) => e.dimensi).join(" · ")}</td><td className="capx">{p.elemen.map((e) => e.predikat).join(", ")}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <section className="ttd-section">
              <div className="ttd-cell"><div className="role">Mengetahui,</div><div className="role">Orang Tua / Wali</div><div className="place">{place}</div><div className="sign">&nbsp;</div><div className="nama">(……………………)</div></div>
              <div className="ttd-cell signed"><div className="role">Koordinator P5</div><div className="place">{place}</div><div className="sign">&nbsp;</div><div className="nama">(……………………)</div></div>
              <div className="ttd-cell signed"><div className="role">Mengesahkan,</div><div className="role">Kepala {s.nama}</div><div className="place">{place}</div><div className="sign stamp">{(s.kepala ?? "").split(" ")[0] || "—"}</div><div className="nama">{s.kepala ?? "(……………………)"}</div>{s.nipKepala && <div className="nip">NIP. {s.nipKepala}</div>}</div>
            </section>
          </div>
          <div className="doc-foot"><span>Dokumen P5 diterbitkan oleh <b>Akadewa</b>.</span><span>No. dok: {data.noDok}-P5</span></div>
        </article>
      )}
    </div>
  );
}
