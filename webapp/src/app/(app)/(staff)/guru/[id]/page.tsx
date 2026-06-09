/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getGuruDetail } from "../_revamp/detailData";
import { JadwalGrid } from "../_revamp/JadwalGrid";
import "../_revamp/detail.css";

const waHref = (no: string | null, text: string) => `https://wa.me/${(no ?? "").replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
const KARIR_ICON: Record<string, string> = { current: "⭐", cert: "✓", award: "🏆", education: "🎓", cpns: "📋" };

function Heatmap({ days }: { days: string[] }) {
  const set = new Set(days);
  const today = new Date();
  const start = new Date(today); start.setDate(today.getDate() - 364); start.setDate(start.getDate() - start.getDay());
  const cells: string[] = [];
  for (let w = 0; w < 53; w++) for (let d = 0; d < 7; d++) {
    const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
    const dow = dt.getDay();
    if (dt > today) { cells.push(""); continue; }
    if (dow === 0 || dow === 6) { cells.push("libur"); continue; }
    cells.push(set.has(dt.toISOString().slice(0, 10)) ? "lengkap" : "miss");
  }
  return <div className="gd-hm">{cells.map((c, i) => <i key={i} className={c} />)}</div>;
}

export default async function GuruDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const { id } = await params;
  const [g, sekolah] = await Promise.all([getGuruDetail(Number(id), sekolahId), prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true } })]);
  if (!g) notFound();
  const t = await getTranslations("guru");
  const locale = await getLocale();
  const dfmt = (s: string | null) => (s ? new Date(s).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const lastJurnal = g.jurnalRecent[0] ? dfmt(g.jurnalRecent[0].tanggal) : "—";

  return (
    <div id="ak-gd">
      <div className="gd-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><b>{g.nama}</b></div>

      {/* HERO */}
      <section className="gd-hero">
        <div className="gd-hero-bg" />
        <div className="gd-hero-row">
          <div className="gd-photo">{g.foto ? <img src={g.foto} alt={g.nama} /> : g.inisial}<span className="gd-ribbon">{t("thnMengajar", { n: g.masaKerja })}</span></div>
          <div className="gd-hero-info">
            <span className="gd-eyebrow">{t("profilEyebrow")}</span>
            <h1>{g.nama}</h1>
            <div className="gd-role">{g.role}{g.bidang !== "TU" ? ` · ${g.bidang}` : ""}</div>
            <div className="gd-chips">
              <span className="gdc">{g.status}{g.golongan ? ` ${g.golongan}` : ""}</span>
              <span className="gdc">{g.jk === "P" ? t("perempuan") : t("lakiLaki")}</span>
              {g.pendidikanTop && <span className="gdc">🎓 {g.pendidikanTop}</span>}
              {g.sertifTahun && <span className="gdc">✓ {t("sertifThn", { n: g.sertifTahun })}</span>}
              {g.impact.penghargaan > 0 && <span className="gdc gold">🏆 {t("penghargaanN", { n: g.impact.penghargaan })}</span>}
            </div>
            <div className="gd-meta">
              <span>NIP <b>{g.nip}</b></span><span>NUPTK <b>{g.nuptk}</b></span>
              {g.email && <span>{g.email}</span>}{g.alamat && <span>📍 {g.alamat}</span>}
            </div>
          </div>
          <div className="gd-hero-actions">
            <Link href={`/guru/${g.id}/kartu`} className="gd-btn gold">📇 {t("cetakKartu")}</Link>
            <a href={waHref(g.noTelp, `Assalamualaikum ${g.nama}`)} target="_blank" rel="noopener noreferrer" className="gd-btn wa">💬 WhatsApp</a>
            <Link href={`/guru/${g.id}/edit`} className="gd-btn ghost">✏ {t("editData")}</Link>
            <Link href={`/guru/${g.id}/sk-tugas`} className="gd-btn ghost">📄 {t("skTugas")}</Link>
          </div>
        </div>
      </section>

      {/* STRIP 6 */}
      <div className="gd-strip">
        <div className="gd-sb"><div className="l">{t("sBeban")}</div><div className="v">{g.strip.beban}<small>/24 {t("jamShort")}</small></div><div className={`d ${g.strip.bebanStatus}`}>{t(`beban_${g.strip.bebanStatus}`)}</div></div>
        <div className="gd-sb"><div className="l">{t("sJurnal")}</div><div className="v mint">{g.strip.jurnalPct ?? "—"}<small>%</small></div><div className="d">{t("sesiN", { n: g.strip.jurnalSesi })}</div></div>
        <div className="gd-sb"><div className="l">{t("sSiswa")}</div><div className="v">{g.strip.siswaDiampu}</div><div className="d">{t("kelasN", { n: g.mapel.length })}</div></div>
        <div className="gd-sb"><div className="l">{t("sEval")}</div><div className="v mint">{g.strip.evalRate ?? "—"}<small>/5</small></div><div className="d">PKG</div></div>
        <div className="gd-sb"><div className="l">{t("sNilai")}</div><div className="v">{g.strip.nilaiKelas ?? "—"}</div><div className="d">{t("rataMapel")}</div></div>
        <div className="gd-sb"><div className="l">{t("sPenghargaan")}</div><div className="v">{g.strip.penghargaan}</div><div className="d">{t("totalRaih")}</div></div>
      </div>

      {/* IMPACT */}
      <div className="gd-section">
        <div className="gd-sh"><h2>☀️ {t("impactTitle")}</h2><span>{t("impactSub")}</span></div>
        <div className="gd-impact">
          <div className="gi dark"><div className="gi-l">{t("iSiswaT")}</div><div className="gi-v">{g.impact.siswa}<small>{t("iSiswaU")}</small></div><div className="gi-d">{t("iSiswaD", { n: g.impact.masaKerja })}</div></div>
          <div className="gi mint"><div className="gi-l">{t("iNilaiT")}</div><div className="gi-v">{g.impact.nilai ?? "—"}</div><div className="gi-d">{t("iNilaiD")}</div></div>
          <div className="gi peach"><div className="gi-l">{t("iAwardT")}</div><div className="gi-v">{g.impact.penghargaan}</div><div className="gi-d">{g.impact.penghargaanTop ?? t("iAwardEmpty")}</div></div>
          <div className="gi sky"><div className="gi-l">{t("iExpT")}</div><div className="gi-v">{g.impact.masaKerja}<small>{t("thn")}</small></div><div className="gi-d">{t("iExpD")}</div></div>
        </div>
      </div>

      {/* KARIR */}
      <div className="gd-section">
        <div className="gd-sh"><h2>🧭 {t("karirTitle")}</h2></div>
        <div className="gd-timeline">
          {g.karir.map((k, i) => (
            <div key={i} className={`gd-tnode ${k.type}`}>
              <span className="gd-tdot">{KARIR_ICON[k.type]}</span>
              <div className="gd-tbody"><span className="gd-tyear">{k.year}</span><b>{k.title}</b>{k.sub && <span className="gd-tsub">{k.sub}</span>}</div>
            </div>
          ))}
        </div>
      </div>

      {/* JADWAL */}
      <div className="gd-section" id="jadwal">
        <div className="gd-sh"><h2>🗓 {t("jadwalTitle")}</h2><span>{t("jadwalMeta", { jam: g.strip.beban, kelas: g.mapel.length })}</span></div>
        <JadwalGrid jadwal={g.jadwal} />
      </div>

      {/* MAPEL + SISWA */}
      <div className="gd-section gd-2col">
        <div className="gd-card">
          <h3>📚 {t("mapelTitle")}</h3>
          {g.mapel.length === 0 ? <p className="gd-muted">{t("mapelEmpty")}</p> : g.mapel.map((m, i) => (
            <div className="gd-mrow" key={i}><span className="gd-mic">{m.nama[0]}</span><div className="gd-mn"><b>{m.nama}</b><span>{t("kelasN", { n: m.kelas })}</span></div><span className="gd-mjam">{t("jamMinggu", { n: m.jam })}</span></div>
          ))}
          {g.waliKelas && <div className="gd-wali">🏠 {t("waliBox", { kelas: g.waliKelas, n: g.waliSiswa })}</div>}
        </div>
        <div className="gd-card">
          <h3>🏆 {t("prestasiTitle")}</h3>
          {g.prestasiSiswa.length === 0 ? <p className="gd-muted">{t("prestasiEmpty")}</p> : g.prestasiSiswa.map((s, i) => (
            <div className="gd-prow" key={i}><span className="gd-pav">{s.nama.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span><div className="gd-pn"><b>{s.nama}</b><span>{s.kelas}</span></div><span className="gd-pbadge">{s.prestasi}</span></div>
          ))}
        </div>
      </div>

      {/* JURNAL */}
      <div className="gd-section gd-2col jurnal">
        <div className="gd-card">
          <h3>📓 {t("jurnalKonsisten")}</h3>
          <div className="gd-hm-wrap"><Heatmap days={g.heatmap} /></div>
          <div className="gd-hm-legend"><span><i className="lengkap" />{t("hmLengkap")}</span><span><i className="miss" />{t("hmMiss")}</span><span><i className="libur" />{t("hmLibur")}</span></div>
        </div>
        <div className="gd-card">
          <h3>{t("jurnalTerbaru")}</h3>
          {g.jurnalRecent.length === 0 ? <p className="gd-muted">{t("jurnalEmpty")}</p> : g.jurnalRecent.map((j, i) => (
            <div className="gd-jrow" key={i}><div className="gd-jdate">{new Date(j.tanggal).getDate()}<small>{new Date(j.tanggal).toLocaleDateString(locale, { month: "short" })}</small></div><div className="gd-jn"><b>{j.materi}</b><span>{j.kelas} · {j.mapel}</span></div></div>
          ))}
        </div>
      </div>

      {/* KONTAK / AKUN / SERTIFIKASI */}
      <div className="gd-section gd-3col">
        <div className="gd-card">
          <h3>📞 {t("kontakTitle")}</h3>
          {g.noTelp && <a href={waHref(g.noTelp, "")} target="_blank" rel="noopener noreferrer" className="gd-krow"><span className="gd-kic mint">💬</span><div><b>{g.noTelp}</b><span>WhatsApp</span></div></a>}
          {g.email && <div className="gd-krow"><span className="gd-kic sky">✉</span><div><b>{g.email}</b><span>Email</span></div></div>}
          {g.alamat && <div className="gd-krow"><span className="gd-kic lav">📍</span><div><b>{g.alamat}</b><span>{t("alamat")}</span></div></div>}
        </div>
        <div className="gd-card">
          <h3>🔑 {t("akunTitle")}</h3>
          {g.akun ? (
            <>
              <div className="gd-krow"><span className={`gd-kic ${g.akun.aktif ? "mint" : "peach"}`}>{g.akun.aktif ? "✓" : "✕"}</span><div><b>{g.akun.username}</b><span>{g.akun.aktif ? t("akunAktif") : t("akunNonaktif")}</span></div></div>
              <div className="gd-acc-meta">{g.akun.lastLogin ? t("loginTerakhir", { d: dfmt(g.akun.lastLogin) }) : t("belumLogin")}</div>
            </>
          ) : <p className="gd-muted">{t("akunEmpty")}</p>}
        </div>
        <div className="gd-card">
          <h3>📜 {t("sertifTitle")}</h3>
          {g.sertifikasi.length === 0 ? <p className="gd-muted">{t("sertifEmpty")}</p> : g.sertifikasi.map((s, i) => (
            <div className={`gd-srow ${s.status}`} key={i}><span className="gd-sic">{s.status === "expired" ? "⚠" : s.status === "soon" ? "⏰" : "✓"}</span><div className="gd-sn"><b>{s.nama}</b><span>{s.tahun}{s.expired ? ` · ${t("expiredThn", { n: s.expired })}` : ""}</span></div></div>
          ))}
          {g.sertifWarn > 0 && <div className="gd-swarn">⚠ {t("sertifWarn", { n: g.sertifWarn })}</div>}
        </div>
      </div>
      <p className="gd-foot">{t("lastJurnalFoot", { d: lastJurnal })} · {sekolah?.nama}</p>
    </div>
  );
}
