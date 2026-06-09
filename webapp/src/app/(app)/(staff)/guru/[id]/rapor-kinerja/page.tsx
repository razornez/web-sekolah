/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import "../../_revamp/rapor.css";

const inisial = (n: string) => n.replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|S\.?Si|S\.?Ag|S\.?S|S\.?T|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "G";
const DIMENSI = [
  { key: "pedagogik", tone: "lav", f: "skorPedagogik" }, { key: "kepribadian", tone: "mint", f: "skorKepribadian" },
  { key: "sosial", tone: "sky", f: "skorSosial" }, { key: "profesional", tone: "sun", f: "skorProfesional" }, { key: "komitmen", tone: "peach", f: "skorKomitmen" },
] as const;
const PRED_TONE: Record<string, string> = { "A+": "a", "A": "a", "B+": "b", "B": "b", "C": "c", "D": "c" };

export default async function RaporKinerjaPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const { id } = await params;
  const [g, rekap, evaluasi, sertifikasi, totalGuru] = await Promise.all([
    prisma.guru.findFirst({ where: { id: Number(id), sekolahId, deletedAt: null }, include: { mapelDiampu: { select: { namaMapel: true }, take: 1 } } }),
    prisma.rekapKinerjaGuru.findFirst({ where: { guruId: Number(id) }, orderBy: { periodeId: "desc" } }),
    prisma.evaluasiKelas.findMany({ where: { guruId: Number(id) }, orderBy: { tanggal: "desc" }, take: 3 }),
    prisma.sertifikasiGuru.findMany({ where: { guruId: Number(id) }, orderBy: { tahunTerbit: "desc" } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
  ]);
  if (!g) notFound();
  const t = await getTranslations("guru");
  const sekolah = await prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true, kepalaSekolah: true } });
  const role = g.jenisJabatan && g.jenisJabatan !== "Guru Mapel" ? g.jenisJabatan : g.mapelDiampu[0]?.namaMapel ? `Guru ${g.mapelDiampu[0].namaMapel}` : "Guru";

  if (!rekap) return <div id="ak-gr"><div className="gr-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><Link href={`/guru/${id}`}>{g.namaGuru}</Link><span>/</span><b>{t("rkTitle")}</b></div><p className="gr-empty">{t("rkEmpty")}</p></div>;

  const dims = DIMENSI.map((d) => ({ ...d, val: rekap[d.f] as number }));
  const sorted = [...dims].sort((a, b) => b.val - a.val);
  const strengths = sorted.slice(0, 3), growth = sorted.slice(-2).reverse();
  const gaugeR = 88, circ = 2 * Math.PI * gaugeR, fill = (rekap.skorAkhir / 100) * circ;

  return (
    <div id="ak-gr">
      <div className="gr-bar">
        <div className="gr-crumb"><Link href="/guru">{t("title")}</Link><span>/</span><Link href={`/guru/${id}`}>{g.namaGuru}</Link><span>/</span><b>{t("rkTitle")}</b></div>
        <div className="gr-bar-r"><button>🔗 {t("skBagikan")}</button><a className="wa" href={`https://wa.me/${(g.noTelp ?? "").replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer">💬 {t("kirimGuru")}</a></div>
      </div>

      {/* HERO */}
      <section className="gr-hero">
        <div className="gr-hero-bg" />
        <div className="gr-hero-row">
          <div className="gr-photo"><span className="laurel l">🌿</span>{g.foto ? <img src={g.foto} alt="" /> : inisial(g.namaGuru)}<span className="laurel r">🌿</span></div>
          <div className="gr-hero-info">
            <span className="gr-eyebrow">— {t("rkEyebrow")}</span>
            <h1>{g.namaGuru}</h1>
            <div className="gr-role">{role} · {g.mapelDiampu[0]?.namaMapel ?? ""}</div>
            <div className="gr-pills">
              <span className="gr-pill">📊 {t("rkSkor")} {rekap.skorAkhir}/100</span>
              <span className="gr-pill">🏆 {t("rkPeringkat")} #{rekap.peringkatSekolah ?? "—"}/{totalGuru}</span>
              <span className="gr-pill">{rekap.predikat === "A+" || rekap.predikat === "A" ? "⭐" : "📈"} {rekap.predikat}</span>
            </div>
          </div>
          <div className={`gr-grade ${PRED_TONE[rekap.predikat] ?? "a"}`}><div className="gr-grade-ring" /><b>{rekap.predikat}</b><span>{t("rkPredikat")}</span></div>
        </div>
      </section>

      {/* SCORE OVERVIEW */}
      <div className="gr-overview">
        <div className="gr-gauge-card">
          <div className="gr-gauge">
            <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r={gaugeR} className="bg" /><circle cx="100" cy="100" r={gaugeR} className="fg" strokeDasharray={`${fill} ${circ}`} transform="rotate(-90 100 100)" /></svg>
            <div className="gr-gauge-num">{rekap.skorAkhir}<small>/100 · {rekap.predikat}</small></div>
          </div>
          <div className="gr-rank"><div><b>#{rekap.peringkatSekolah ?? "—"}</b><span>{t("rkRankSekolah", { n: totalGuru })}</span></div></div>
        </div>
        <div className="gr-dims">
          <h3>{t("rkDimensiTitle")}</h3><p className="gr-dims-sub">{t("rkDimensiSub")}</p>
          {dims.map((d) => (
            <div className="gr-dim" key={d.key}>
              <div className="gr-dim-l"><b>{t(`dim_${d.key}`)}</b><span>{t(`dimDesc_${d.key}`)}</span></div>
              <div className="gr-dim-bar"><i className={d.tone} style={{ width: `${d.val}%` }} /></div>
              <span className="gr-dim-v">{d.val}<small>/100</small></span>
            </div>
          ))}
        </div>
      </div>

      {/* STRENGTHS / GROWTH */}
      <div className="gr-sg">
        <div className="gr-sg-card mint"><h3>💪 {t("rkStrength")}</h3>{strengths.map((d, i) => <div className="gr-sgrow" key={i}><span className="n">{i + 1}</span><div><b>{t(`dim_${d.key}`)} — {d.val}</b><span>{t(`strengthMsg_${d.key}`)}</span></div></div>)}</div>
        <div className="gr-sg-card peach"><h3>🌱 {t("rkGrowth")}</h3>{growth.map((d, i) => <div className="gr-sgrow" key={i}><span className="n">{i + 1}</span><div><b>{t(`dim_${d.key}`)} — {d.val}</b><span>{t(`growthMsg_${d.key}`)}</span></div></div>)}</div>
      </div>

      {/* OBSERVASI */}
      {evaluasi.length > 0 && (
        <div className="gr-section">
          <div className="gr-sh"><h2>👁 {t("rkObservasi")}</h2><span>{t("rkObservasiSub", { n: evaluasi.length })}</span></div>
          {evaluasi.map((e, i) => (
            <div className={`gr-obs ${PRED_TONE[e.predikat] ?? "b"}`} key={i}>
              <div className="gr-obs-h"><b>{e.topik}</b><span className="gr-obs-p">{e.predikat}</span></div>
              <div className="gr-obs-m">{e.mapel ?? ""}{e.kelas ? ` · ${e.kelas}` : ""} · {e.tanggal.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</div>
              <p className="gr-obs-q">“{e.catatan}”</p>
              <div className="gr-obs-by">{t("rkDiobservasi")}: <b>{e.observerNama}</b> · {e.observerRole}</div>
            </div>
          ))}
        </div>
      )}

      {/* IMPACT STORY */}
      {rekap.ceritaImpact && (
        <div className="gr-impact">
          <span className="gr-impact-q">“</span>
          <p>{rekap.ceritaImpact}</p>
          {rekap.catatanKepsek && <p className="gr-impact-2">{rekap.catatanKepsek}</p>}
          <div className="gr-impact-sign"><span className="av">{inisial(sekolah?.kepalaSekolah ?? "K")}</span><div><b>{sekolah?.kepalaSekolah ?? "—"}</b><span>{t("kepalaSekolah")} {sekolah?.nama}</span></div></div>
        </div>
      )}

      {/* PENGEMBANGAN PROFESI */}
      {sertifikasi.length > 0 && (
        <div className="gr-section">
          <div className="gr-sh"><h2>🎓 {t("rkProfesi")}</h2></div>
          <div className="gr-profgrid">{sertifikasi.map((s, i) => <div className={`gr-prof t${i % 3}`} key={i}><span className="ic">{/penghargaan/i.test(s.jenis) ? "🏆" : /pelatihan/i.test(s.jenis) ? "📚" : "📜"}</span><b>{s.nama}</b><span>{s.penerbit ?? ""} · {s.tahunTerbit}</span>{s.predikat && <span className="pr">{s.predikat}</span>}</div>)}</div>
        </div>
      )}

      {/* SIGNATURE */}
      <div className="gr-sign-block">
        <div><span>{t("rkDisusun")}</span><div className="gr-sp" /><b>Tim Penilai Kinerja</b><span>{t("rkWakasek")}</span></div>
        <div><span>{t("rkDisahkan")}</span><div className="gr-sp" /><b>{sekolah?.kepalaSekolah ?? "—"}</b><span>{t("kepalaSekolah")} {sekolah?.nama}</span></div>
      </div>
    </div>
  );
}
