/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSiswaDetail } from "../_revamp/detailData";
import { RaporTabs } from "../_revamp/RaporTabs";
import { KartuButton } from "../_revamp/KartuButton";
import { MapSection } from "../_revamp/MapSection";
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
  const t = await getTranslations("siswa");

  const m = s.metrics;
  const sppLunas = s.spp.filter((x) => x.status === "lunas").length;
  const firstParentHp = s.parents.find((p) => p.noHp)?.noHp ?? null;
  const poin = Math.max(0, 100 - m.pelanggaran);
  const ortuTone = (tipe: string) => (/ayah|ayh/i.test(tipe) ? "ayah" : /ibu/i.test(tipe) ? "ibu" : "wali");

  return (
    <div id="ak-sd">
      <div className="crumb"><Link href="/siswa">{t("title")}</Link><span>/</span><b>{s.nama}</b></div>

      {/* HERO */}
      <section className="hero-prof">
        <div className="hero-prof-row">
          <div className="hero-photo">{s.foto ? <img src={s.foto} alt={s.nama} /> : s.inisial}</div>
          <div className="hero-info">
            <span className="hero-eyebrow">{t("detail.eyebrow")}</span>
            <h1 className="hero-name">{s.nama}</h1>
            <div className="hero-chips">
              {s.status === "aktif" && <span className="hc aktif">{t("detail.chipAktif")}</span>}
              {s.jk && <span className="hc">{s.jk === "P" ? t("detail.chipP") : t("detail.chipL")}</span>}
              <span className="hc">📚 <b>{s.kelas}</b></span>
              {s.fase && <span className="hc">{t("detail.chipFase", { fase: s.fase })}</span>}
              {s.prestasiCount > 0 && <span className="hc">🏆 <b>{s.prestasiCount}</b> {t("detail.chipPrestasi")}</span>}
              {s.beasiswa && <span className="hc">💰 {s.beasiswa}</span>}
            </div>
            <div className="hero-meta">
              <span className="m">NISN <b>{s.nisn}</b></span>
              <span className="m">NIS <b>{s.nis}</b></span>
              {s.waliKelas && <span className="m">{t("detail.metaWali")} <b>{s.waliKelas}</b></span>}
              {s.absen != null && <span className="m">{t("detail.metaAbsen")} <b>{String(s.absen).padStart(2, "0")}</b></span>}
            </div>
          </div>
          <div className="hero-actions">
            <KartuButton nama={s.nama} nisn={s.nisn} kelas={s.kelas} inisial={s.inisial} sekolah={sekolah?.nama ?? "Sekolah"} ttl={s.ttl} />
            <a className="btn btn-wa" href={waHref(firstParentHp, t("detail.waHero", { sekolah: sekolah?.nama ?? "sekolah", nama: s.nama }))} target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1 A6 6 0 0 0 2 10 L1 13 L4 12 A6 6 0 1 0 7 1 Z" /></svg>{t("detail.actWa")}
            </a>
            <Link className="btn btn-ghost" href={`/siswa/${s.id}/edit`}>{t("detail.actEdit")}</Link>
            <Link className="btn btn-ghost" href={`/siswa/${s.id}/rapor`}>{t("detail.actRapor")}</Link>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div className="strip">
        <div className="sm"><div className="l">{t("detail.mRata")}</div><div className="v mint">{m.rata ?? "—"}</div><div className="d">{t("detail.mRataSub", { n: s.rapor.length })}</div></div>
        <div className="sm"><div className="l">{t("detail.mHadir")}</div><div className="v mint">{m.hadirPct != null ? m.hadirPct : "—"}<small>%</small></div><div className="d">{t("detail.mHadirSub", { h: s.hadirStats.hadir, i: s.hadirStats.izin, s: s.hadirStats.sakit, a: s.hadirStats.alpa })}</div></div>
        <div className="sm"><div className="l">{t("detail.mRank")}</div><div className="v">{m.rank ? `#${m.rank}` : "—"}</div><div className="d">{m.rankTotal ? t("detail.mRankSub", { n: m.rankTotal }) : t("detail.mRankNone")}</div></div>
        <div className="sm"><div className="l">{t("detail.mSpp")}</div><div className="v mint">{sppLunas}<small>/{s.spp.length || 12}</small></div><div className="d">{m.sppStatus === "Lunas" ? t("detail.mSppLunas") : m.sppStatus}</div></div>
        <div className="sm"><div className="l">{t("detail.mBmi")}</div><div className="v">{m.bmi?.value ?? "—"}</div><div className="d up">{m.bmi?.kategori ?? t("detail.mBmiNone")}</div></div>
        <div className="sm"><div className="l">{t("detail.mPoin")}</div><div className="v">{m.pelanggaran}</div><div className="d">{m.pelanggaran === 0 ? t("detail.mPoinClean") : t("detail.mPoinCount", { n: s.kasus.count })}</div></div>
      </div>

      {/* PERSONA */}
      <div className="section">
        <div className="section-h"><h2><span className="ico lav">✨</span>{t("detail.personaTitle", { nama: s.nama.split(" ")[0] })}</h2><span className="meta">{t("detail.personaSub")}</span></div>
        <div className="persona-grid">
          {s.zodiak ? (
            <div className="persona-card zodiac">
              <div className="persona-h"><div><div className="ttl">{t("detail.zodiak")}</div><h3>{s.zodiak.name} — <em>{s.zodiak.tags[2] ?? "—"}</em></h3></div><span className="persona-emoji">{s.zodiak.sym}</span></div>
              <div className="persona-body">{s.zodiak.desc}</div>
              <div className="persona-tags"><span>{t("detail.element", { el: s.zodiak.el })}</span>{s.zodiak.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
          ) : <div className="persona-card zodiac"><div className="persona-body">{t("detail.noTtl")}</div></div>}

          {m.bmi ? (
            <div className="persona-card bmi">
              <div className="persona-h"><div><div className="ttl">{t("detail.bmiTitle")}</div><h3>{t("detail.bmiHeight", { t: s.tinggi, b: s.berat })}</h3></div><span className="persona-emoji">💪</span></div>
              <div className="bmi-row"><div className="bmi-num">{m.bmi.value}<small>BMI</small></div><span className="bmi-status">{m.bmi.kategori.toUpperCase()}</span></div>
              <div className="bmi-meter"><div className="bmi-arrow" style={{ left: `${m.bmi.pct}%` }} /></div>
              <div className="bmi-scale"><span>&lt;18.5</span><span>18.5-25</span><span>25-30</span><span>&gt;30</span></div>
            </div>
          ) : <div className="persona-card bmi"><div className="persona-h"><div><div className="ttl">{t("detail.bmiTitle")}</div><h3>{t("detail.bmiIncomplete")}</h3></div><span className="persona-emoji">💪</span></div><div className="persona-body" style={{ fontSize: 12 }}>{t("detail.bmiFill")}</div></div>}

          {s.numero ? (
            <div className="persona-card numerologi">
              <div className="persona-h"><div><div className="ttl">{t("detail.numeroTitle")}</div><h3>Angka <span style={{ color: "var(--ak-lav-deep)" }}>{s.numero.angka}</span></h3></div><span className="persona-emoji">🔮</span></div>
              <div className="persona-body">{t("detail.numeroAngka", { n: s.numero.angka, sifat: s.numero.sifat })}</div>
              <div className="persona-tags">{s.numero.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
          ) : <div className="persona-card numerologi"><div className="persona-body">{t("detail.noTtl")}</div></div>}
        </div>
      </div>

      {/* AKADEMIK */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">📊</span>{t("detail.akademik")}</h2><span className="meta">{t("detail.akademikSub", { n: s.rapor.length, b: s.radar.filter((r) => r.value > 0).length })}</span></div>
        <div className="akademik-grid">
          <div className="chart-card"><h3>{t("detail.chartTren")}</h3><div className="sub">{t("detail.chartTrenSub")}</div><LineChart data={s.line} /></div>
          <div className="chart-card"><h3>{t("detail.chartBakat")}</h3><div className="sub">{t("detail.chartBakatSub")}</div><RadarChart data={s.radar} /></div>
        </div>
      </div>

      {/* JOURNEY */}
      {s.journey.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico lav">🧭</span>{t("detail.journey")}</h2><span className="meta">{t("detail.journeySub", { n: s.journey.length })}</span></div>
          <div className="journey">
            {s.journey.map((j, i) => (
              <div key={i} className={`jnode${j.current ? " cur" : ""}`}><span className="jdot" /><div className="jt">{j.tahun}</div><div className="jk">{j.rombel}</div><div className="js">{j.absen != null ? t("detail.journeyAbsen", { n: j.absen }) : "—"}{j.rata != null ? ` · ${t("detail.journeyRata", { r: j.rata })}` : ""}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* RAPOR */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sun">📑</span>{t("detail.raporTitle")}</h2><span className="meta">{t("detail.raporSub")}</span></div>
        <RaporTabs rapor={s.rapor} />
      </div>

      {/* HEATMAP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">🗓</span>{t("detail.heatmap")}</h2><span className="meta">{t("detail.heatmapSub")}</span></div>
        <div className="hm-wrap"><Heatmap cells={s.heatmap} /></div>
        <div className="hm-foot">
          <div className="hm-stat"><span className="n">{s.hadirStats.hadir}</span><span className="k">{t("detail.hadir")}</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.izin}</span><span className="k">{t("detail.izin")}</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.sakit}</span><span className="k">{t("detail.sakit")}</span></div>
          <div className="hm-stat"><span className="n">{s.hadirStats.alpa}</span><span className="k">{t("detail.alpa")}</span></div>
          <div className="hm-legend"><span><i style={{ background: "var(--ak-mint-deep)" }} />{t("detail.hadir")}</span><span><i style={{ background: "var(--ak-sky-deep)" }} />{t("detail.izin")}</span><span><i style={{ background: "var(--ak-sun-deep)" }} />{t("detail.sakit")}</span><span><i style={{ background: "var(--ak-peach-deep)" }} />{t("detail.alpa")}</span></div>
        </div>
      </div>

      {/* MAP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sky">📍</span>{t("detail.mapTitle")}</h2></div>
        <MapSection geo={s.geo} distanceKm={s.distanceKm} alamat={s.alamat} transportasi={s.transportasi} tinggalDengan={s.tinggalDengan} />
      </div>

      {/* BK + GAUGE */}
      <div className="section">
        <div className="section-h"><h2><span className="ico mint">🌿</span>{t("detail.bkTitle")}</h2></div>
        <div className="bk-grid">
          {s.kasus.count === 0 ? (
            <div className="bk-empty">
              <div className="e">🌿</div><h4>{t("detail.bkEmpty")}</h4><p>{t("detail.bkEmptySub")}</p>
              <div className="bk-stats"><div><div className="v">0</div><div className="k">{t("detail.pelanggaran")}</div></div><div><div className="v">{s.prestasiCount}</div><div className="k">{t("detail.penghargaan")}</div></div></div>
            </div>
          ) : (
            <div className="bk-empty" style={{ background: "var(--ak-peach)", textAlign: "left" }}>
              <h4 style={{ color: "var(--ak-peach-deep)", textAlign: "center" }}>{t("detail.bkCount", { n: s.kasus.count, p: s.kasus.poin })}</h4>
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
            <svg viewBox="0 0 200 116" width="200" height="116">
              <defs>
                <linearGradient id="poinG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--ak-peach-deep)" />
                  <stop offset="38%" stopColor="var(--ak-sun-deep)" />
                  <stop offset="70%" stopColor="var(--ak-mint-deep)" />
                  <stop offset="100%" stopColor="var(--ak-mint-deep)" />
                </linearGradient>
              </defs>
              <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="var(--ak-bg-2)" strokeWidth="14" strokeLinecap="round" />
              <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="url(#poinG)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(poin / 100) * 267} 400`} />
              <g transform={`rotate(${-90 + (poin / 100) * 180} 100 100)`}>
                <line x1="100" y1="100" x2="100" y2="34" stroke="var(--ak-ink)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="100" r="6.5" fill="var(--ak-ink)" />
              </g>
            </svg>
            <div className="gnum">{poin}<small>{t("detail.poinSisa")}</small></div><div className="gk">{t("detail.poinDisiplin")}</div>
            <div className="gpill">{poin >= 80 ? t("detail.gSangat") : poin >= 60 ? t("detail.gBaik") : poin >= 40 ? t("detail.gCukup") : poin >= 20 ? t("detail.gPeringatan") : t("detail.gKritis")}</div>
            <div className="gdesc">{t("detail.poinDesc", { max: 100 })}</div>
          </div>
        </div>
      </div>

      {/* SPP */}
      <div className="section">
        <div className="section-h"><h2><span className="ico sun">💰</span>{t("detail.sppTitle")}</h2><span className="meta">{t("detail.sppBulan", { n: s.spp.length })}</span></div>
        {s.spp.length === 0 ? <p style={{ color: "var(--ak-muted)", fontSize: 13 }}>{t("detail.sppEmpty")}</p> : (
          <>
            <div className="spp-grid">
              {Array.from({ length: 12 }, (_, i) => {
                const cell = s.spp.find((x) => x.bulan === i + 1);
                const st = cell?.status ?? "";
                return <div key={i} className={`spp-cell ${st}`}><div className="b">{BULAN3[i + 1]}</div><div className="i">{st === "lunas" ? "✓" : st === "cicil" ? "½" : st === "belum" ? "·" : ""}</div></div>;
              })}
            </div>
            <div className="spp-sum">
              <div className="ss"><div className="k">{t("detail.sppLunas")}</div><div className="v">{t("detail.sppBln", { n: sppLunas })}</div></div>
              <div className="ss"><div className="k">{t("detail.sppCicil")}</div><div className="v">{t("detail.sppBln", { n: s.spp.filter((x) => x.status === "cicil").length })}</div></div>
              <div className="ss"><div className="k">{t("detail.sppBelum")}</div><div className="v">{t("detail.sppBln", { n: s.spp.filter((x) => x.status === "belum").length })}</div></div>
              <div className="ss"><div className="k">{t("detail.sppTotal")}</div><div className="v">Rp {s.spp.filter((x) => x.status === "lunas").reduce((a, b) => a + b.nominal, 0).toLocaleString("id-ID")}</div></div>
            </div>
          </>
        )}
      </div>

      {/* PRESTASI */}
      {s.prestasi.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico sun">🏆</span>{t("detail.prestasiTitle")}</h2><span className="meta">{t("detail.prestasiSub", { n: s.prestasi.length })}</span></div>
          <div className="shelf">
            <div className="shelf-row">
              {s.prestasi.slice(0, 6).map((p, i) => {
                const tone = ["g", "s", "b", "p"][i % 4];
                const ico = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
                return <div className={`medal ${tone}`} key={i}><div className="disc">{ico}</div><div className="mt">{p.nama}</div><div className="ms">{[p.tingkat, p.tahun].filter(Boolean).join(" · ") || t("detail.penghargaanLabel")}</div></div>;
              })}
            </div>
            <div className="shelf-board" />
          </div>
        </div>
      )}

      {/* ORTU */}
      {s.parents.length > 0 && (
        <div className="section">
          <div className="section-h"><h2><span className="ico pink">👨‍👩‍👧</span>{t("detail.ortuTitle")}</h2><span className="meta">{t("detail.ortuSub")}</span></div>
          <div className="ortu-grid">
            {s.parents.slice(0, 3).map((p, i) => (
              <div className={`ortu-card ${ortuTone(p.tipe)}`} key={i}>
                <span className="ortu-tag">{p.tipe}</span>
                <h4>{p.nama}</h4>
                <div className="ortu-rows">
                  {p.pekerjaan && <div className="or"><span className="k">{t("detail.ortuPekerjaan")}</span><span className="vv">{p.pekerjaan}</span></div>}
                  {p.pendidikan && <div className="or"><span className="k">{t("detail.ortuPendidikan")}</span><span className="vv">{p.pendidikan}</span></div>}
                  {p.penghasilan && <div className="or"><span className="k">{t("detail.ortuPenghasilan")}</span><span className="vv">{p.penghasilan}</span></div>}
                  {p.noHp && <div className="or"><span className="k">{t("detail.ortuNoHp")}</span><span className="vv">{p.noHp}</span></div>}
                </div>
                {p.noHp && (
                  <div className="ortu-actions">
                    <a className="wa" href={waHref(p.noHp, t("detail.waOrtu", { nama: p.nama, anak: s.nama }))} target="_blank" rel="noopener noreferrer">{t("detail.ortuWa")}</a>
                    <a className="tel" href={`tel:${p.noHp}`}>{t("detail.ortuTel")}</a>
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
