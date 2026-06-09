/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSiswaDetail } from "../_revamp/detailData";
import { RaporTabs } from "../_revamp/RaporTabs";
import { KartuButton } from "../_revamp/KartuButton";
import "../_revamp/detail.css";

const BULAN3 = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const waHref = (no: string | null, text: string) => {
  const n = (no ?? "").replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
};

function LineChart({ data }: { data: { label: string; avg: number }[] }) {
  if (data.length < 2) return <p style={{ color: "var(--ak-muted)", fontSize: 12 }}>Butuh ≥2 semester untuk grafik tren.</p>;
  const W = 600, H = 200, P = 30;
  const vals = data.map((d) => d.avg);
  const min = Math.max(0, Math.min(...vals) - 5), max = Math.min(100, Math.max(...vals) + 5) || 100;
  const x = (i: number) => P + (i / (data.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const pts = data.map((d, i) => `${x(i)},${y(d.avg)}`).join(" ");
  return (
    <svg className="line-chart" viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="none" style={{ height: 200 }}>
      {[0, 0.5, 1].map((t) => <line key={t} x1={P} x2={W - P} y1={P + t * (H - 2 * P)} y2={P + t * (H - 2 * P)} stroke="var(--ak-rule-2)" strokeWidth="1" />)}
      <polyline points={pts} fill="none" stroke="var(--ak-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.avg)} r={i === data.length - 1 ? 6 : 4} fill={i === data.length - 1 ? "var(--ak-primary)" : "#fff"} stroke="var(--ak-primary)" strokeWidth="2.5" />
          <text x={x(i)} y={y(d.avg) - 12} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--ak-ink)">{d.avg}</text>
          <text x={x(i)} y={H + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ak-muted)">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

function RadarChart({ data }: { data: { axis: string; value: number }[] }) {
  const cx = 130, cy = 120, R = 88, n = data.length;
  const pt = (v: number, i: number): [number, number] => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = (v / 100) * R;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };
  const poly = data.map((d, i) => pt(d.value, i).join(",")).join(" ");
  return (
    <svg className="radar-chart" viewBox="0 0 260 240" style={{ height: 220 }}>
      {[0.33, 0.66, 1].map((t) => <polygon key={t} points={data.map((_, i) => pt(100 * t, i).join(",")).join(" ")} fill="none" stroke="var(--ak-rule-2)" strokeWidth="1" />)}
      {data.map((d, i) => { const [ex, ey] = pt(100, i); return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--ak-rule-2)" strokeWidth="1" />; })}
      <polygon points={poly} fill="rgba(91,79,233,0.22)" stroke="var(--ak-primary)" strokeWidth="2.5" />
      {data.map((d, i) => { const [lx, ly] = pt(118, i); return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="var(--ak-ink-3)">{d.axis}</text>; })}
    </svg>
  );
}

function Heatmap({ cells }: { cells: { date: string; status: string }[] }) {
  const map = new Map(cells.map((c) => [c.date, c.status]));
  const today = new Date();
  const start = new Date(today); start.setDate(today.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());
  const out: string[] = [];
  for (let w = 0; w < 53; w++) for (let d = 0; d < 7; d++) {
    const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
    const dow = dt.getDay();
    if (dt > today || dow === 0 || dow === 6) { out.push(""); continue; }
    const st = map.get(dt.toISOString().slice(0, 10));
    out.push(st === "hadir" || st === "terlambat" ? "hadir" : st === "izin" ? "izin" : st === "sakit" ? "sakit" : st === "alpa" ? "alpa" : "");
  }
  return <div className="hm">{out.map((c, i) => <i key={i} className={c} />)}</div>;
}

export default async function SiswaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const { id } = await params;
  const [s, sekolah] = await Promise.all([
    getSiswaDetail(Number(id), sekolahId),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true } }),
  ]);
  if (!s) notFound();

  const m = s.metrics;
  const sppLunas = s.spp.filter((x) => x.status === "lunas").length;
  const firstParentHp = s.parents.find((p) => p.noHp)?.noHp ?? null;
  const poin = Math.max(0, 100 - m.pelanggaran);
  const estTempuh = s.distanceKm != null ? Math.max(3, Math.round((s.distanceKm / 22) * 60)) : null; // ~22 km/jam motor kota
  const ortuTone = (tipe: string) => (/ayah|ayh/i.test(tipe) ? "ayah" : /ibu/i.test(tipe) ? "ibu" : "wali");

  return (
    <div id="ak-sd">
      <div className="crumb"><Link href="/siswa">Siswa</Link><span>/</span><b>{s.nama}</b></div>

      {/* HERO */}
      <section className="hero-prof">
        <div className="hero-prof-row">
          <div className="hero-photo">{s.foto ? <img src={s.foto} alt={s.nama} /> : s.inisial}</div>
          <div className="hero-info">
            <span className="hero-eyebrow">Profil Siswa</span>
            <h1 className="hero-name">{s.nama}</h1>
            <div className="hero-chips">
              {s.status === "aktif" && <span className="hc aktif">✓ Aktif</span>}
              {s.jk && <span className="hc">{s.jk === "P" ? "♀ Perempuan" : "♂ Laki-laki"}</span>}
              <span className="hc">📚 <b>{s.kelas}</b></span>
              {s.fase && <span className="hc">🎓 Fase {s.fase}</span>}
              {s.prestasiCount > 0 && <span className="hc">🏆 <b>{s.prestasiCount}</b> prestasi</span>}
              {s.beasiswa && <span className="hc">💰 {s.beasiswa}</span>}
            </div>
            <div className="hero-meta">
              <span className="m">NISN <b>{s.nisn}</b></span>
              <span className="m">NIS <b>{s.nis}</b></span>
              {s.waliKelas && <span className="m">Wali kelas <b>{s.waliKelas}</b></span>}
              {s.absen != null && <span className="m">No absen <b>{String(s.absen).padStart(2, "0")}</b></span>}
            </div>
          </div>
          <div className="hero-actions">
            <KartuButton nama={s.nama} nisn={s.nisn} kelas={s.kelas} inisial={s.inisial} sekolah={sekolah?.nama ?? "Sekolah"} ttl={s.ttl} />
            <a className="btn btn-wa" href={waHref(firstParentHp, `Assalamualaikum, kami dari ${sekolah?.nama ?? "sekolah"} ingin menyampaikan informasi terkait ananda ${s.nama}.`)} target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1 A6 6 0 0 0 2 10 L1 13 L4 12 A6 6 0 1 0 7 1 Z" /></svg>Kirim WA ke Ortu
            </a>
            <Link className="btn btn-ghost" href={`/siswa/${s.id}/edit`}>✏ Edit Data</Link>
            <Link className="btn btn-ghost" href={`/siswa/${s.id}/rapor`}>📄 Lihat Rapor</Link>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div className="strip">
        <div className="sm"><div className="l">📊 Rata-rata Nilai</div><div className="v mint">{m.rata ?? "—"}</div><div className="d">{s.rapor.length} semester dinilai</div></div>
        <div className="sm"><div className="l">✅ Kehadiran</div><div className="v mint">{m.hadirPct != null ? m.hadirPct : "—"}<small>%</small></div><div className="d">{s.hadirStats.hadir} hadir · {s.hadirStats.izin} izin · {s.hadirStats.sakit} sakit · {s.hadirStats.alpa} alpa</div></div>
        <div className="sm"><div className="l">🏆 Peringkat Kelas</div><div className="v">{m.rank ? `#${m.rank}` : "—"}</div><div className="d">{m.rankTotal ? `dari ${m.rankTotal} dinilai` : "belum ada data"}</div></div>
        <div className="sm"><div className="l">💰 SPP</div><div className="v mint">{sppLunas}<small>/{s.spp.length || 12}</small></div><div className="d">{m.sppStatus === "Lunas" ? "Lunas semua" : m.sppStatus}</div></div>
        <div className="sm"><div className="l">📏 BMI</div><div className="v">{m.bmi?.value ?? "—"}</div><div className="d up">{m.bmi?.kategori ?? "Data belum lengkap"}</div></div>
        <div className="sm"><div className="l">🎯 Poin Pelanggaran</div><div className="v">{m.pelanggaran}</div><div className="d">{m.pelanggaran === 0 ? "Bersih sejak masuk" : `${s.kasus.count} catatan BK`}</div></div>
      </div>

      {/* PERSONA */}
      <div className="section">
        <div className="section-h"><h2><span className="ico lav">✨</span>Tentang {s.nama.split(" ")[0]}</h2><span className="meta">Analisis dari tanggal lahir &amp; biometri</span></div>
        <div className="persona-grid">
          {s.zodiak ? (
            <div className="persona-card zodiac">
              <div className="persona-h"><div><div className="ttl">Zodiak</div><h3>{s.zodiak.name} — <em>{s.zodiak.tags[2] ?? "unik"}</em></h3></div><span className="persona-emoji">{s.zodiak.sym}</span></div>
              <div className="persona-body">{s.zodiak.desc}</div>
              <div className="persona-tags"><span>🌊 Element {s.zodiak.el}</span>{s.zodiak.tags.slice(0, 2).map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          ) : <div className="persona-card zodiac"><div className="persona-body">Tanggal lahir belum diisi.</div></div>}

          {m.bmi ? (
            <div className="persona-card bmi">
              <div className="persona-h"><div><div className="ttl">Status Gizi · BMI</div><h3>Tinggi {s.tinggi} cm · Berat {s.berat} kg</h3></div><span className="persona-emoji">💪</span></div>
              <div className="bmi-row"><div className="bmi-num">{m.bmi.value}<small>BMI</small></div><span className="bmi-status">{m.bmi.kategori.toUpperCase()}</span></div>
              <div className="bmi-meter"><div className="bmi-arrow" style={{ left: `${m.bmi.pct}%` }} /></div>
              <div className="bmi-scale"><span>&lt;18.5</span><span>18.5-25</span><span>25-30</span><span>&gt;30</span></div>
            </div>
          ) : <div className="persona-card bmi"><div className="persona-h"><div><div className="ttl">Status Gizi · BMI</div><h3>Belum lengkap</h3></div><span className="persona-emoji">💪</span></div><div className="persona-body" style={{ fontSize: 12 }}>Isi tinggi &amp; berat badan di Edit Data.</div></div>}

          {s.numero ? (
            <div className="persona-card numerologi">
              <div className="persona-h"><div><div className="ttl">Numerologi · Angka Hidup</div><h3>Angka <span style={{ color: "var(--ak-lav-deep)" }}>{s.numero.angka}</span></h3></div><span className="persona-emoji">🔮</span></div>
              <div className="persona-body">Angka {s.numero.angka} — {s.numero.sifat}</div>
              <div className="persona-tags">{s.numero.tags.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          ) : <div className="persona-card numerologi"><div className="persona-body">Tanggal lahir belum diisi.</div></div>}
        </div>
      </div>

      {/* AKADEMIK */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">📊</span>Perkembangan Akademik</h2><span className="meta">{s.rapor.length} semester · {s.radar.filter((r) => r.value > 0).length} bidang</span></div>
        <div className="akademik-grid">
          <div className="chart-card"><h3>Tren rata-rata per semester</h3><div className="sub">Nilai pengetahuan tiap periode</div><LineChart data={s.line} /></div>
          <div className="chart-card"><h3>Pemetaan bakat</h3><div className="sub">Rata-rata nilai per bidang</div><RadarChart data={s.radar} /></div>
        </div>
      </div>

      {/* JOURNEY */}
      {s.journey.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico lav">🧭</span>Perjalanan Akademik</h2><span className="meta">{s.journey.length} periode kelas</span></div>
          <div className="journey">
            {s.journey.map((j, i) => (
              <div key={i} className={`jnode${j.current ? " cur" : ""}`}><span className="jdot" /><div className="jt">{j.tahun}</div><div className="jk">{j.rombel}</div><div className="js">{j.absen != null ? `No absen ${j.absen}` : "—"}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* RAPOR */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sun">📑</span>Rapor Akademik</h2><span className="meta">Nilai per mata pelajaran</span></div>
        <RaporTabs rapor={s.rapor} />
      </div>

      {/* HEATMAP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">🗓</span>Heatmap Kehadiran</h2><span className="meta">Setahun terakhir</span></div>
        <div className="hm-wrap"><Heatmap cells={s.heatmap} /></div>
        <div className="hm-foot">
          <div className="hm-stat"><span className="n">{s.hadirStats.hadir}</span><span className="k">Hadir</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.izin}</span><span className="k">Izin</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.sakit}</span><span className="k">Sakit</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.alpa}</span><span className="k">Alpa</span></div>
          <div className="hm-legend"><span><i style={{ background: "var(--ak-mint-deep)" }} />Hadir</span><span><i style={{ background: "var(--ak-sky-deep)" }} />Izin</span><span><i style={{ background: "var(--ak-sun-deep)" }} />Sakit</span><span><i style={{ background: "var(--ak-peach-deep)" }} />Alpa</span></div>
        </div>
      </div>

      {/* MAP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sky">📍</span>Rumah &amp; Transportasi</h2></div>
        <div className="map-grid">
          <div className="map-canvas">
            <svg className="map-route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M20 70 L40 70 L40 40 L80 40 L80 30" fill="none" stroke="var(--ak-primary)" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            <span className="map-pin" style={{ left: "20%", top: "70%" }}>🏠<span className="ring" /></span>
            <span className="map-pin" style={{ left: "80%", top: "30%", fontSize: 24 }}>🏫<span className="ring" /></span>
            {s.distanceKm != null && <span className="map-dist">{s.distanceKm} km</span>}
          </div>
          <div className="map-info">
            <div className="mi-addr">📍 {s.alamat ?? "Alamat belum diisi"}</div>
            <div className="map-stats">
              <div className="mst"><div className="k">Jarak ke sekolah</div><div className="v">{s.distanceKm != null ? `${s.distanceKm} km` : "—"}</div></div>
              <div className="mst"><div className="k">Estimasi tempuh</div><div className="v">{estTempuh != null ? `${estTempuh} mnt` : "—"}</div></div>
              <div className="mst"><div className="k">Tinggal dengan</div><div className="v" style={{ fontSize: 13 }}>{s.tinggalDengan ?? "—"}</div></div>
              <div className="mst"><div className="k">Transportasi</div><div className="v" style={{ fontSize: 13 }}>{s.transportasi ?? "—"}</div></div>
            </div>
            <div className="map-transport">🚍 {s.transportasi ? `Menggunakan ${s.transportasi.toLowerCase()}` : "Moda transportasi belum diisi"}{s.distanceKm != null ? ` · ±${s.distanceKm} km dari sekolah` : ""}.</div>
          </div>
        </div>
      </div>

      {/* BK + GAUGE */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">🌿</span>Catatan BK &amp; Disiplin</h2></div>
        <div className="bk-grid">
          {s.kasus.count === 0 ? (
            <div className="bk-empty">
              <div className="e">🌿</div><h4>Belum ada catatan pelanggaran</h4><p>Bersikap baik sejak masuk sekolah.</p>
              <div className="bk-stats"><div><div className="v">0</div><div className="k">Pelanggaran</div></div><div><div className="v">{s.prestasiCount}</div><div className="k">Penghargaan</div></div></div>
            </div>
          ) : (
            <div className="bk-empty" style={{ background: "var(--ak-peach)", textAlign: "left" }}>
              <h4 style={{ color: "var(--ak-peach-deep)", textAlign: "center" }}>{s.kasus.count} catatan BK · {s.kasus.poin} poin</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {s.kasus.list.map((k, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, background: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
                    <span style={{ fontWeight: 700, color: "var(--ak-ink)" }}>{k.nama}</span>
                    <span style={{ fontWeight: 800, color: "var(--ak-peach-deep)", whiteSpace: "nowrap" }}>−{k.poin} · {new Date(k.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="gauge-card">
            <svg viewBox="0 0 200 110" width="200" height="110">
              <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="var(--ak-bg-2)" strokeWidth="14" strokeLinecap="round" />
              <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="var(--ak-mint-deep)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(poin / 100) * 267} 400`} />
            </svg>
            <div className="gnum">{poin}</div><div className="gk">Poin disiplin</div>
            <div className="gpill">{poin >= 80 ? "Sangat baik" : poin >= 50 ? "Cukup" : "Perlu perhatian"}</div>
          </div>
        </div>
      </div>

      {/* SPP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sun">💰</span>Pembayaran SPP</h2><span className="meta">{s.spp.length} bulan</span></div>
        {s.spp.length === 0 ? <p style={{ color: "var(--ak-muted)", fontSize: 13 }}>Belum ada tagihan SPP.</p> : (
          <>
            <div className="spp-grid">
              {Array.from({ length: 12 }, (_, i) => {
                const t = s.spp.find((x) => x.bulan === i + 1);
                const st = t?.status ?? "";
                return <div key={i} className={`spp-cell ${st}`}><div className="b">{BULAN3[i + 1]}</div><div className="i">{st === "lunas" ? "✓" : st === "cicil" ? "½" : st === "belum" ? "·" : ""}</div></div>;
              })}
            </div>
            <div className="spp-sum">
              <div className="ss"><div className="k">Lunas</div><div className="v">{sppLunas} bln</div></div>
              <div className="ss"><div className="k">Cicil</div><div className="v">{s.spp.filter((x) => x.status === "cicil").length} bln</div></div>
              <div className="ss"><div className="k">Belum</div><div className="v">{s.spp.filter((x) => x.status === "belum").length} bln</div></div>
              <div className="ss"><div className="k">Total terbayar</div><div className="v">Rp {s.spp.filter((x) => x.status === "lunas").reduce((a, b) => a + b.nominal, 0).toLocaleString("id-ID")}</div></div>
            </div>
          </>
        )}
      </div>

      {/* PRESTASI */}
      {s.prestasi.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico sun">🏆</span>Prestasi &amp; Penghargaan</h2><span className="meta">{s.prestasi.length} pencapaian</span></div>
          <div className="shelf">
            <div className="shelf-row">
              {s.prestasi.slice(0, 6).map((p, i) => {
                const tone = ["g", "s", "b", "p"][i % 4];
                const ico = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
                return <div className={`medal ${tone}`} key={i}><div className="disc">{ico}</div><div className="mt">{p.nama}</div><div className="ms">{[p.tingkat, p.tahun].filter(Boolean).join(" · ") || "Penghargaan"}</div></div>;
              })}
            </div>
            <div className="shelf-board" />
          </div>
        </div>
      )}

      {/* ORTU */}
      {s.parents.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico pink">👨‍👩‍👧</span>Orang Tua &amp; Wali</h2><span className="meta">Kontak komunikasi</span></div>
          <div className="ortu-grid">
            {s.parents.slice(0, 3).map((p, i) => (
              <div className={`ortu-card ${ortuTone(p.tipe)}`} key={i}>
                <span className="ortu-tag">{p.tipe}</span>
                <h4>{p.nama}</h4>
                <div className="ortu-rows">
                  {p.pekerjaan && <div className="or"><span className="k">Pekerjaan</span><span className="vv">{p.pekerjaan}</span></div>}
                  {p.pendidikan && <div className="or"><span className="k">Pendidikan</span><span className="vv">{p.pendidikan}</span></div>}
                  {p.penghasilan && <div className="or"><span className="k">Penghasilan</span><span className="vv">{p.penghasilan}</span></div>}
                  {p.noHp && <div className="or"><span className="k">No HP</span><span className="vv">{p.noHp}</span></div>}
                </div>
                {p.noHp && (
                  <div className="ortu-actions">
                    <a className="wa" href={waHref(p.noHp, `Assalamualaikum ${p.nama}, kami dari sekolah ingin menyampaikan informasi tentang ananda ${s.nama}.`)} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
                    <a className="tel" href={`tel:${p.noHp}`}>📞 Telepon</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
