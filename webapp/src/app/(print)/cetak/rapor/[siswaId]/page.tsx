import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { PrintButton } from "@/components/PrintButton";

const BULAN_ID = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const fmtDate = (d: Date | null) =>
  d ? `${d.getDate()} ${BULAN_ID[d.getMonth() + 1]} ${d.getFullYear()}` : "";

export default async function CetakRaporPage({
  params,
  searchParams,
}: {
  params: Promise<{ siswaId: string }>;
  searchParams: Promise<{ periodeId?: string }>;
}) {
  const user = await getCurrentUser();
  const siswaId = Number((await params).siswaId);
  const periodeId = Number((await searchParams).periodeId) || 0;

  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: {
      sekolah: { select: { nama: true, alamat: true, kurikulumDefault: true, kepalaSekolah: true, nipKepala: true, npsn: true, telepon: true } },
      anggotaRombel: {
        include: { rombel: { include: { tingkat: { select: { nama: true, fase: true } }, tahunAjaran: { select: { tahun: true } }, waliGuru: { select: { namaGuru: true, nip: true } } } } },
        orderBy: { id: "desc" },
        take: 1,
      },
    },
  });
  if (!siswa) notFound();

  const isOwner = siswa.userId === user.id;
  const isStaffSame = isStaff(user.role) && user.sekolahId === siswa.sekolahId;
  if (!isOwner && !isStaffSame) notFound();

  const kelas = siswa.anggotaRombel[0]?.rombel;

  if (!periodeId) {
    const periode = await prisma.periode.findMany({
      where: { tahunAjaran: { sekolahId: siswa.sekolahId } },
      orderBy: [{ tahunAjaranId: "desc" }, { urutan: "asc" }],
      include: { tahunAjaran: { select: { tahun: true } } },
    });
    return (
      <div className="mx-auto max-w-lg p-8 font-sans">
        <h1 className="mb-4 text-xl font-bold text-gray-900">Cetak Rapor — {siswa.namaLengkap}</h1>
        <p className="mb-3 text-sm text-gray-600">Pilih periode rapor:</p>
        <ul className="space-y-2">
          {periode.map((p) => (
            <li key={p.id}>
              <Link href={`/cetak/rapor/${siswaId}?periodeId=${p.id}`} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{p.tahunAjaran.tahun} · {p.nama}</span>
                {p.aktif && <span className="rounded bg-green-100 px-1.5 text-xs text-green-700">aktif</span>}
              </Link>
            </li>
          ))}
          {periode.length === 0 && <li className="text-sm text-gray-400">Belum ada periode.</li>}
        </ul>
      </div>
    );
  }

  const [periode, nilai, ekstra, catatan] = await Promise.all([
    prisma.periode.findFirst({ where: { id: periodeId, tahunAjaran: { sekolahId: siswa.sekolahId } }, include: { tahunAjaran: { select: { tahun: true } } } }),
    prisma.nilaiRapor.findMany({
      where: { siswaId, periodeId },
      orderBy: { mapel: { noUrut: "asc" } },
      include: { mapel: { select: { namaMapel: true, kelompok: true, kkm: true } } },
    }),
    prisma.nilaiRaporEkstra.findMany({ where: { siswaId, periodeId }, orderBy: { id: "asc" } }),
    prisma.raporCatatan.findUnique({ where: { siswaId_periodeId: { siswaId, periodeId } } }),
  ]);
  if (!periode) notFound();

  const merdeka = siswa.sekolah.kurikulumDefault === "MERDEKA";

  const kehadiran = await prisma.kehadiranSiswa.groupBy({
    by: ["status"],
    where: { siswaId, ...(periode.tanggalMulai && periode.tanggalSelesai ? { tanggal: { gte: periode.tanggalMulai, lte: periode.tanggalSelesai } } : {}) },
    _count: true,
  });
  const hdMap: Record<string, number> = {};
  for (const k of kehadiran) hdMap[k.status] = k._count;

  // Grade band colors
  const gradeBand = (n: number | null, kkm: number) => {
    if (n == null) return { label: "—", cls: "" };
    if (n >= 90) return { label: "A", cls: "grade-a" };
    if (n >= 80) return { label: "B", cls: "grade-b" };
    if (n >= kkm) return { label: "C", cls: "grade-c" };
    return { label: "D", cls: "grade-d" };
  };

  return (
    <>
      {/* Rapor styles — Navy+Gold premium design */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');

        :root {
          --navy: #1a2e4a;
          --gold: #b8962e;
          --gold-light: #d4ae50;
          --cream: #faf8f4;
          --text: #1a1a1a;
          --border: #d0c8b4;
        }

        @page {
          size: A4;
          margin: 1.4cm 1.6cm;
        }

        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif;
          font-size: 9pt;
          color: var(--text);
          background: #f5f5f5;
        }

        .rapor-page {
          width: 21cm;
          min-height: 29.7cm;
          margin: 1cm auto;
          background: white;
          position: relative;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        /* Outer decorative frame */
        .rapor-page::before {
          content: '';
          position: absolute;
          inset: 6pt;
          border: 0.5pt solid var(--navy);
          pointer-events: none;
          z-index: 0;
        }
        .rapor-page::after {
          content: '';
          position: absolute;
          inset: 9pt;
          border: 2pt solid var(--gold);
          pointer-events: none;
          z-index: 0;
        }

        .inner {
          position: relative;
          z-index: 1;
          padding: 18pt 20pt 16pt;
        }

        /* Watermark */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 90pt;
          font-weight: 700;
          color: var(--navy);
          opacity: 0.025;
          pointer-events: none;
          z-index: 0;
          letter-spacing: -2pt;
          white-space: nowrap;
        }

        /* Header */
        .rapor-header {
          display: flex;
          align-items: center;
          gap: 12pt;
          padding-bottom: 10pt;
          border-bottom: 2.5pt solid var(--navy);
          margin-bottom: 8pt;
        }

        .school-logo {
          width: 44pt;
          height: 44pt;
          border-radius: 50%;
          background: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 20pt;
          font-weight: 700;
          color: var(--gold);
          flex-shrink: 0;
        }

        .school-info { flex: 1; }
        .school-name {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 15pt;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: 0.5pt;
          line-height: 1.1;
        }
        .school-sub {
          font-size: 7.5pt;
          color: #555;
          margin-top: 2pt;
          letter-spacing: 0.3pt;
        }
        .report-title {
          text-align: right;
        }
        .report-title-main {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 11pt;
          font-weight: 700;
          color: var(--navy);
          text-transform: uppercase;
          letter-spacing: 1pt;
        }
        .report-title-sub {
          font-size: 7.5pt;
          color: var(--gold);
          font-weight: 600;
          letter-spacing: 0.5pt;
          text-transform: uppercase;
          margin-top: 3pt;
        }

        /* Gold divider */
        .gold-rule {
          height: 1.5pt;
          background: linear-gradient(to right, var(--gold), transparent);
          margin: 6pt 0;
        }

        /* Student identity card */
        .identity-card {
          display: grid;
          grid-template-columns: 1fr 1fr 56pt;
          gap: 8pt;
          background: var(--cream);
          border: 0.5pt solid var(--border);
          border-radius: 3pt;
          padding: 8pt 10pt;
          margin-bottom: 10pt;
        }

        .identity-row { display: flex; flex-direction: column; gap: 4pt; }
        .identity-item { display: flex; gap: 4pt; align-items: baseline; }
        .id-label { font-size: 7pt; color: #666; letter-spacing: 0.4pt; text-transform: uppercase; min-width: 60pt; }
        .id-value { font-size: 9pt; font-weight: 600; color: var(--navy); }

        .student-photo-box {
          width: 56pt;
          height: 72pt;
          border: 0.5pt solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7pt;
          color: #aaa;
          background: #f9f9f9;
          font-style: italic;
        }

        /* Section heading */
        .section-heading {
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.8pt;
          text-transform: uppercase;
          color: var(--navy);
          padding: 3pt 0 3pt 6pt;
          border-left: 2.5pt solid var(--gold);
          margin: 9pt 0 5pt;
        }

        /* Grade table */
        table.grade-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
        }
        table.grade-table thead tr {
          background: var(--navy);
          color: white;
        }
        table.grade-table thead th {
          padding: 4pt 5pt;
          font-weight: 600;
          font-size: 7.5pt;
          letter-spacing: 0.3pt;
          text-align: left;
          border: 0.5pt solid #2d4a70;
        }
        table.grade-table tbody tr:nth-child(even) { background: #f9f9fc; }
        table.grade-table tbody tr:hover { background: #eef2fa; }
        table.grade-table td {
          padding: 3.5pt 5pt;
          border: 0.5pt solid #e0e0e8;
          vertical-align: middle;
        }
        .kelompok-header td {
          background: #e8edf5;
          font-weight: 700;
          font-size: 7pt;
          letter-spacing: 0.5pt;
          text-transform: uppercase;
          color: var(--navy);
          padding: 2.5pt 5pt;
        }

        /* Grade band badges */
        .grade-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16pt;
          height: 16pt;
          border-radius: 50%;
          font-size: 7.5pt;
          font-weight: 700;
        }
        .grade-a { background: #dcfce7; color: #166534; }
        .grade-b { background: #dbeafe; color: #1e40af; }
        .grade-c { background: #fef9c3; color: #854d0e; }
        .grade-d { background: #fee2e2; color: #991b1b; }

        .nilai-cell {
          font-weight: 700;
          font-size: 10pt;
          text-align: center;
        }
        .nilai-ok { color: #166534; }
        .nilai-fail { color: #dc2626; }
        .nilai-empty { color: #9ca3af; }

        /* Absensi */
        .absensi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5pt;
          margin: 6pt 0;
        }
        .absensi-item {
          background: var(--cream);
          border: 0.5pt solid var(--border);
          border-radius: 3pt;
          padding: 5pt 8pt;
          text-align: center;
        }
        .absensi-num {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 18pt;
          font-weight: 700;
          color: var(--navy);
          line-height: 1;
        }
        .absensi-label { font-size: 7pt; color: #666; margin-top: 2pt; letter-spacing: 0.3pt; text-transform: uppercase; }

        /* Catatan box */
        .catatan-box {
          background: #fffef5;
          border: 0.5pt solid #d4b483;
          border-left: 3pt solid var(--gold);
          border-radius: 2pt;
          padding: 7pt 9pt;
          font-size: 8.5pt;
          line-height: 1.5;
          color: #3d3000;
          min-height: 36pt;
          margin: 6pt 0;
        }
        .catatan-empty { color: #9ca3af; font-style: italic; }

        /* Ekstra table */
        table.ekstra-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
        }
        table.ekstra-table td, table.ekstra-table th {
          padding: 3pt 5pt;
          border: 0.5pt solid #e0e0e0;
        }
        table.ekstra-table thead { background: #f1f5f9; }
        .predikat-badge {
          display: inline-block;
          border-radius: 2pt;
          padding: 1pt 5pt;
          font-size: 7.5pt;
          font-weight: 600;
        }
        .predikat-sb { background: #dcfce7; color: #166534; }
        .predikat-b  { background: #dbeafe; color: #1e40af; }
        .predikat-c  { background: #fef9c3; color: #854d0e; }
        .predikat-k  { background: #fee2e2; color: #991b1b; }

        /* Signature */
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10pt;
          margin-top: 16pt;
          padding-top: 10pt;
          border-top: 1pt solid var(--border);
        }
        .sig-block { text-align: center; }
        .sig-label { font-size: 8pt; color: #555; margin-bottom: 32pt; }
        .sig-line { border-bottom: 0.5pt solid var(--navy); margin: 0 8pt; }
        .sig-name { font-weight: 600; font-size: 8.5pt; margin-top: 3pt; color: var(--navy); }
        .sig-nip { font-size: 7pt; color: #666; }

        /* Footer */
        .rapor-footer {
          text-align: center;
          font-size: 7pt;
          color: #aaa;
          margin-top: 8pt;
          padding-top: 5pt;
          border-top: 0.5pt solid var(--border);
        }
      `}</style>

      {/* Print button */}
      <div className="no-print m-4 flex gap-2">
        <PrintButton />
        <Link href={`/cetak/rapor/${siswaId}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          ← Pilih Periode Lain
        </Link>
      </div>

      {/* ── RAPOR PAGE ── */}
      <div className="rapor-page">
        <div className="watermark">{siswa.sekolah.nama.split(" ")[0]}</div>
        <div className="inner">

          {/* Header */}
          <div className="rapor-header">
            <div className="school-logo">
              {siswa.sekolah.nama.charAt(0)}
            </div>
            <div className="school-info">
              <div className="school-name">{siswa.sekolah.nama.toUpperCase()}</div>
              <div className="school-sub">
                {siswa.sekolah.alamat && `${siswa.sekolah.alamat} · `}
                {siswa.sekolah.telepon && `Telp: ${siswa.sekolah.telepon} · `}
                {siswa.sekolah.npsn && `NPSN: ${siswa.sekolah.npsn}`}
              </div>
            </div>
            <div className="report-title">
              <div className="report-title-main">Laporan Hasil Belajar</div>
              <div className="report-title-sub">{merdeka ? "Kurikulum Merdeka" : "Kurikulum K13"}</div>
            </div>
          </div>

          <div className="gold-rule" />

          {/* Identity */}
          <div className="identity-card">
            <div className="identity-row">
              <div className="identity-item"><span className="id-label">Nama Siswa</span><span className="id-value">{siswa.namaLengkap}</span></div>
              <div className="identity-item"><span className="id-label">NISN</span><span className="id-value">{siswa.nisn ?? "—"}</span></div>
              <div className="identity-item"><span className="id-label">NIS</span><span className="id-value">{siswa.nis ?? "—"}</span></div>
            </div>
            <div className="identity-row">
              <div className="identity-item"><span className="id-label">Kelas</span><span className="id-value">{kelas?.nama ?? "—"}</span></div>
              <div className="identity-item"><span className="id-label">Wali Kelas</span><span className="id-value">{kelas?.waliGuru?.namaGuru ?? "—"}</span></div>
              <div className="identity-item"><span className="id-label">Semester</span><span className="id-value">{periode.nama} · TA {periode.tahunAjaran.tahun}</span></div>
            </div>
            <div className="student-photo-box">
              {siswa.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={siswa.foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>Foto<br />Siswa</span>
              )}
            </div>
          </div>

          {/* Nilai per kelompok */}
          <div className="section-heading">Capaian Akademik</div>
          <table className="grade-table">
            <thead>
              <tr>
                <th style={{ width: "22pt" }}>No</th>
                <th>Mata Pelajaran</th>
                <th style={{ width: "36pt", textAlign: "center" }}>{merdeka ? "Nilai" : "Peng."}</th>
                {!merdeka && <th style={{ width: "36pt", textAlign: "center" }}>Ket.</th>}
                <th style={{ width: "24pt", textAlign: "center" }}>Band</th>
                {merdeka && <th>Capaian Kompetensi</th>}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const KELOMPOK_ORDER = ["A", "B", "C", "lintasminat", "muatanlokal"];
                const KELOMPOK_LABEL_MAP: Record<string, string> = { A: "Kelompok A — Umum/Wajib", B: "Kelompok B — Wajib Pilihan", C: "Kelompok C — Peminatan", lintasminat: "Lintas Minat", muatanlokal: "Muatan Lokal" };
                const groups: Record<string, typeof nilai> = {};
                for (const n of nilai) (groups[n.mapel.kelompok] ??= []).push(n);
                let no = 1;
                return KELOMPOK_ORDER.flatMap((kel) => {
                  const items = groups[kel];
                  if (!items?.length) return [];
                  return [
                    <tr key={`hdr-${kel}`} className="kelompok-header">
                      <td colSpan={merdeka ? 5 : 5}>{KELOMPOK_LABEL_MAP[kel] ?? kel}</td>
                    </tr>,
                    ...items.map((n) => {
                      const v = merdeka ? n.nilaiAkhir : n.nilaiPengetahuan;
                      const band = gradeBand(v, n.mapel.kkm ?? 75);
                      return (
                        <tr key={n.id}>
                          <td style={{ textAlign: "center", color: "#888" }}>{no++}</td>
                          <td>{n.mapel.namaMapel}</td>
                          <td className={`nilai-cell ${!v ? "nilai-empty" : v >= (n.mapel.kkm ?? 75) ? "nilai-ok" : "nilai-fail"}`}>{v ?? "—"}</td>
                          {!merdeka && <td className={`nilai-cell ${!n.nilaiKeterampilan ? "nilai-empty" : n.nilaiKeterampilan >= (n.mapel.kkm ?? 75) ? "nilai-ok" : "nilai-fail"}`}>{n.nilaiKeterampilan ?? "—"}</td>}
                          <td style={{ textAlign: "center" }}><span className={`grade-badge ${band.cls}`}>{band.label}</span></td>
                          {merdeka && <td style={{ fontSize: "7.5pt", color: "#444" }}>{n.deskripsiCapaian ?? <em style={{ color: "#aaa" }}>—</em>}</td>}
                        </tr>
                      );
                    }),
                  ];
                });
              })()}
              {nilai.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#aaa", fontStyle: "italic", padding: "12pt" }}>Belum ada data nilai.</td></tr>
              )}
            </tbody>
          </table>

          {/* Ekstrakurikuler */}
          {ekstra.length > 0 && (
            <>
              <div className="section-heading">Kegiatan Ekstrakurikuler</div>
              <table className="ekstra-table">
                <thead><tr><th style={{ width: "24pt" }}>No</th><th>Kegiatan</th><th style={{ width: "70pt" }}>Predikat</th><th>Keterangan</th></tr></thead>
                <tbody>
                  {ekstra.map((e, i) => {
                    const pmap: Record<string, string> = { "Sangat Baik": "predikat-sb", "Baik": "predikat-b", "Cukup": "predikat-c", "Kurang": "predikat-k" };
                    return (
                      <tr key={e.id}>
                        <td style={{ textAlign: "center", color: "#888" }}>{i + 1}</td>
                        <td>{e.namaEkstra}</td>
                        <td><span className={`predikat-badge ${pmap[e.nilai ?? ""] ?? ""}`}>{e.nilai ?? "—"}</span></td>
                        <td style={{ fontSize: "7.5pt", color: "#555" }}>{e.deskripsi ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Absensi */}
          <div className="section-heading">Ketidakhadiran</div>
          <div className="absensi-grid">
            {[["sakit","🤒","Sakit"],["izin","📋","Izin"],["alpa","❌","Tanpa Keterangan"]].map(([k, icon, label]) => (
              <div key={k} className="absensi-item">
                <div className="absensi-num">{hdMap[k] ?? 0}</div>
                <div className="absensi-label">{icon} {label}</div>
              </div>
            ))}
          </div>

          {/* Catatan Wali Kelas */}
          <div className="section-heading">Catatan Wali Kelas</div>
          {catatan?.sikap && (
            <p style={{ fontSize: "8pt", color: "#555", marginBottom: "4pt" }}>
              <strong>Sikap:</strong> {catatan.sikap}
            </p>
          )}
          <div className="catatan-box">
            {catatan?.catatan ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{catatan.catatan}</span>
            ) : (
              <span className="catatan-empty">Belum ada catatan dari wali kelas.</span>
            )}
          </div>

          {/* Signature */}
          <div className="signature-section">
            <div className="sig-block">
              <div className="sig-label">Orang Tua / Wali</div>
              <div className="sig-line" />
              <div className="sig-name">(______________________)</div>
            </div>
            <div className="sig-block">
              <div className="sig-label">Wali Kelas</div>
              <div className="sig-line" />
              <div className="sig-name">{kelas?.waliGuru?.namaGuru ?? "________________"}</div>
              {kelas?.waliGuru?.nip && <div className="sig-nip">NIP. {kelas.waliGuru.nip}</div>}
            </div>
            <div className="sig-block">
              <div className="sig-label">Mengetahui,<br/>Kepala Sekolah</div>
              <div className="sig-line" />
              <div className="sig-name">{siswa.sekolah.kepalaSekolah ?? "________________"}</div>
              {siswa.sekolah.nipKepala && <div className="sig-nip">NIP. {siswa.sekolah.nipKepala}</div>}
            </div>
          </div>

          {/* Footer */}
          <div className="rapor-footer">
            Diterbitkan oleh {siswa.sekolah.nama} · {periode.nama} Tahun Pelajaran {periode.tahunAjaran.tahun}
          </div>
        </div>
      </div>
    </>
  );
}
