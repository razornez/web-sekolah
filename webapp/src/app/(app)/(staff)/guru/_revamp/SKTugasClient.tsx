"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import "./sk.css";

type SK = {
  nama: string; nip: string; nuptk: string; pangkat: string; golongan: string; ttl: string; pendidikan: string;
  mapel: string; wali: string | null; kelasMapel: string; sekolah: string; alamatSekolah: string; npsn: string; telepon: string;
  kepala: string; nipKepala: string; noSK: string; ta: string; tanggalTerbit: string; kota: string;
};

export function SKTugasClient({ data: d }: { data: SK }) {
  const t = useTranslations("guru");
  const [tab, setTab] = useState(0);
  const TABS = [
    { key: "mengajar", label: t("skMengajar"), tentang: "PENUGASAN GURU MENGAJAR & WALI KELAS", tugas: [
      `Mengajar mata pelajaran ${d.mapel} pada Tahun Pelajaran ${d.ta};`,
      d.wali ? `Bertindak sebagai Wali Kelas ${d.wali};` : `Melaksanakan tugas tambahan sesuai kebutuhan sekolah;`,
      `Menyusun perangkat pembelajaran, melaksanakan penilaian, dan mengisi jurnal mengajar secara tertib;`,
      `Membimbing kegiatan ekstrakurikuler yang relevan dengan bidang keahlian;`,
      `Total beban tatap muka sesuai standar Permendikbud Nomor 15 Tahun 2018.`,
    ] },
    { key: "wali", label: t("skWali"), tentang: "PENUGASAN WALI KELAS", tugas: [
      `Bertindak sebagai Wali Kelas ${d.wali ?? "—"} pada Tahun Pelajaran ${d.ta};`,
      `Membina, membimbing, dan memantau perkembangan akademik serta kepribadian peserta didik;`,
      `Menyusun administrasi kelas, mengisi rapor, dan berkomunikasi dengan orang tua/wali;`,
      `Menangani permasalahan peserta didik bekerja sama dengan guru BK;`,
      `Melaporkan kondisi kelas secara berkala kepada Kepala Sekolah.`,
    ] },
    { key: "osn", label: t("skOsn"), tentang: "PENUGASAN PEMBIMBING OLIMPIADE SAINS (OSN)", tugas: [
      `Membimbing peserta didik dalam persiapan Olimpiade Sains Nasional bidang ${d.mapel};`,
      `Menyusun program pembinaan dan jadwal latihan secara terstruktur;`,
      `Mendampingi peserta didik pada seleksi tingkat sekolah, kota, hingga provinsi;`,
      `Melaporkan perkembangan dan hasil pembinaan kepada Kepala Sekolah;`,
      `Menjaga nama baik sekolah dalam setiap ajang kompetisi.`,
    ] },
    { key: "penilai", label: t("skPenilai"), tentang: "PENUGASAN TIM PENILAI KINERJA GURU", tugas: [
      `Menjadi anggota Tim Penilai Kinerja Guru (PKG) Tahun Pelajaran ${d.ta};`,
      `Melaksanakan observasi kelas secara objektif dan terstruktur;`,
      `Menyusun instrumen, mengumpulkan bukti, dan menilai 5 dimensi kompetensi;`,
      `Memberikan umpan balik membangun kepada guru yang dinilai;`,
      `Menjaga kerahasiaan dan integritas proses penilaian.`,
    ] },
  ];
  const T = TABS[tab];

  return (
    <div id="ak-sk">
      <div className="sk-bar">
        <div className="sk-bar-l"><h1>📄 {t("skTugas")}</h1><span>{t("skResmi")} · Nomor: {d.noSK} · {t("skTerbit")} {d.tanggalTerbit}</span></div>
        <div className="sk-bar-r">
          <button onClick={() => navigator.clipboard?.writeText(location.href)}>🔗 {t("skBagikan")}</button>
          <a className="wa" href={`https://wa.me/?text=${encodeURIComponent(`SK ${T.label} — ${d.nama}`)}`} target="_blank" rel="noopener noreferrer">💬 {t("skWa")}</a>
          <button className="print" onClick={() => window.print()}>🖨 {t("skCetak")}</button>
        </div>
      </div>
      <div className="sk-tabs">{TABS.map((x, i) => <button key={x.key} className={i === tab ? "on" : ""} onClick={() => setTab(i)}>{x.label}</button>)}</div>

      <div className="sk-paper">
        <span className="sk-corner tl" /><span className="sk-corner tr" /><span className="sk-corner bl" /><span className="sk-corner br" />
        <div className="sk-watermark">AKADEWA</div>
        <div className="sk-ribbon">SURAT KEPUTUSAN</div>

        <div className="sk-kop">
          <div className="sk-logo">🏛</div>
          <div className="sk-kop-txt">
            <div className="l1">PEMERINTAH PROVINSI JAWA BARAT</div>
            <div className="l2">DINAS PENDIDIKAN</div>
            <div className="l3">{d.sekolah.toUpperCase()}</div>
            <div className="l4">NPSN {d.npsn}</div>
            <div className="l5">{d.alamatSekolah} · Telp. {d.telepon}</div>
          </div>
          <div className="sk-logo">🎓</div>
        </div>

        <div className="sk-title">
          <h2>SURAT KEPUTUSAN</h2>
          <h3>KEPALA {d.sekolah.toUpperCase()}</h3>
          <div className="sk-no">Nomor: {d.noSK}</div>
          <div className="sk-tentang">TENTANG</div>
          <div className="sk-subject">{T.tentang}<br />TAHUN PELAJARAN {d.ta}</div>
        </div>

        <div className="sk-konsideran">
          <div className="sk-kr"><span>Menimbang</span><ol type="a"><li>bahwa dalam rangka kelancaran proses belajar mengajar, perlu ditetapkan pembagian tugas bagi tenaga pendidik;</li><li>bahwa nama yang tersebut dalam Surat Keputusan ini dipandang cakap dan memenuhi syarat;</li><li>bahwa berdasarkan pertimbangan huruf a dan b, perlu ditetapkan dengan Surat Keputusan Kepala Sekolah.</li></ol></div>
          <div className="sk-kr"><span>Mengingat</span><ol><li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li><li>Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;</li><li>Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan PP Nomor 74 Tahun 2008;</li><li>Permendikbud Nomor 15 Tahun 2018 tentang Pemenuhan Beban Kerja Guru;</li><li>Kalender Pendidikan Tahun Pelajaran {d.ta}.</li></ol></div>
          <div className="sk-kr"><span>Memperhatikan</span><p>Hasil Rapat Pembagian Tugas Dewan Guru {d.sekolah} Tahun Pelajaran {d.ta}.</p></div>
        </div>

        <div className="sk-memutuskan"><b>MEMUTUSKAN</b></div>
        <div className="sk-menetapkan">Menetapkan :</div>

        <div className="sk-diktum">
          <div className="sk-d"><span>PERTAMA</span><div>Menugaskan kepada nama berikut untuk melaksanakan tugas pada Tahun Pelajaran {d.ta}:</div></div>
          <table className="sk-tabel"><tbody>
            <tr><td>Nama Lengkap</td><td><b>{d.nama}</b></td></tr>
            <tr><td>NIP</td><td>{d.nip}</td></tr>
            <tr><td>NUPTK</td><td>{d.nuptk}</td></tr>
            <tr><td>Pangkat / Golongan</td><td>{d.pangkat} / {d.golongan}</td></tr>
            <tr><td>Tempat, Tgl Lahir</td><td>{d.ttl}</td></tr>
            <tr><td>Pendidikan</td><td>{d.pendidikan}</td></tr>
          </tbody></table>
          <div className="sk-d"><span>KEDUA</span><div>Tugas yang diberikan adalah sebagai berikut:<ol className="sk-tugas">{T.tugas.map((x, i) => <li key={i}>{x}</li>)}</ol></div></div>
          <div className="sk-d"><span>KETIGA</span><div>Yang bersangkutan wajib melaksanakan tugas dengan penuh tanggung jawab, profesional, serta menjunjung tinggi kode etik guru.</div></div>
          <div className="sk-d"><span>KEEMPAT</span><div>Segala biaya yang timbul akibat pelaksanaan Surat Keputusan ini dibebankan pada anggaran {d.sekolah} Tahun {ta(d.ta)}.</div></div>
          <div className="sk-d"><span>KELIMA</span><div>Surat Keputusan ini berlaku terhitung mulai tanggal ditetapkan. Apabila terdapat kekeliruan, akan diperbaiki sebagaimana mestinya.</div></div>
        </div>

        <div className="sk-ttd">
          <div className="sk-ttd-col"><span>Diterima oleh,</span><span>Yang Bersangkutan</span><div className="sk-sp" /><b>{d.nama}</b><span>NIP. {d.nip}</span></div>
          <div className="sk-ttd-col"><span>Ditetapkan di {d.kota}</span><span>Pada tanggal {d.tanggalTerbit}</span><span className="sk-jab">Kepala {d.sekolah},</span><div className="sk-stempel">{d.kepala.split(" ")[0]}</div><b>{d.kepala}</b><span>NIP. {d.nipKepala}</span></div>
        </div>

        <div className="sk-tembusan"><b>Tembusan disampaikan kepada Yth.:</b><ol><li>Kepala Dinas Pendidikan Provinsi Jawa Barat;</li><li>Pengawas Sekolah Wilayah;</li><li>Wakasek Kurikulum {d.sekolah};</li><li>Yang bersangkutan untuk dilaksanakan;</li><li>Arsip.</li></ol></div>
        <div className="sk-foot">{t("skFooter")} · akadewa.app/sk/{d.noSK.replace(/\//g, "-")}</div>
      </div>
    </div>
  );
}

function ta(s: string) { return s.split("/")[0]; }
