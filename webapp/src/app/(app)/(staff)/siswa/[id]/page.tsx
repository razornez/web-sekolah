import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

const fmt = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <dt className="w-40 shrink-0 text-xs text-gray-500">{label}</dt>
      <dd className="flex-1 text-sm text-gray-800">{value ?? <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <span>{icon}</span>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default async function SiswaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const { id } = await params;

  const siswa = await prisma.siswa.findFirst({
    where: { id: Number(id), sekolahId, deletedAt: null },
    include: {
      orangTuaWali: { orderBy: { tipe: "asc" } },
      anggotaRombel: {
        orderBy: { id: "desc" },
        include: { rombel: { include: { tahunAjaran: { select: { tahun: true } }, tingkat: { select: { nama: true } } } } },
      },
      nilaiRapor: {
        orderBy: [{ periodeId: "desc" }, { mapel: { noUrut: "asc" } }],
        include: { mapel: { select: { namaMapel: true, kelompok: true } }, periode: { select: { nama: true, tahunAjaran: { select: { tahun: true } } } } },
        take: 60,
      },
      penerimaPrestasiList: { include: { prestasi: { select: { nama: true, tingkat: true, kategori: true, tahun: true } } }, orderBy: { id: "desc" } },
      penerimaBeasiswaList: { include: { beasiswa: { select: { nama: true, kategori: true } } }, orderBy: { id: "desc" } },
      tagihanSpp: { orderBy: [{ tahun: "desc" }, { bulan: "desc" }], take: 24, include: { jenis: { select: { nama: true } } } },
      kehadiran: { orderBy: { tanggal: "desc" }, take: 30, select: { tanggal: true, status: true } },
      kasus: { orderBy: { tanggal: "desc" }, include: { kategori: { select: { nama: true } } } },
      user: { select: { username: true, isActive: true } },
    },
  });
  if (!siswa) notFound();

  const kelasAktif = siswa.anggotaRombel[0]?.rombel;

  // Group nilai by periode
  const nilaiByPeriode: Record<string, typeof siswa.nilaiRapor> = {};
  for (const n of siswa.nilaiRapor) {
    const key = `${n.periode.tahunAjaran.tahun} · ${n.periode.nama}`;
    (nilaiByPeriode[key] ??= []).push(n);
  }

  // Kehadiran summary
  const hdSummary = siswa.kehadiran.reduce<Record<string, number>>((acc, k) => {
    acc[k.status] = (acc[k.status] ?? 0) + 1;
    return acc;
  }, {});

  // SPP grouped by tahun
  const sppByTahun: Record<string, typeof siswa.tagihanSpp> = {};
  for (const t of siswa.tagihanSpp) {
    (sppByTahun[String(t.tahun)] ??= []).push(t);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {siswa.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={siswa.foto} alt="Foto" className="h-24 w-24 rounded-xl border border-gray-200 object-cover shadow-sm" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 text-3xl font-bold text-gray-400">
              {siswa.namaLengkap.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{siswa.namaLengkap}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {siswa.nisn && <span>NISN: {siswa.nisn}</span>}
                  {siswa.nis && <><span>·</span><span>NIS: {siswa.nis}</span></>}
                  {kelasAktif && <><span>·</span><span className="font-medium text-gray-700">{kelasAktif.nama}</span><span>({kelasAktif.tahunAjaran.tahun})</span></>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/siswa" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">← Daftar</Link>
                <Link href={`/siswa/${siswa.id}/edit`} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">✏️ Edit</Link>
                <a href={`/cetak/rapor/${siswa.id}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">🖨 Rapor</a>
              </div>
            </div>
            {/* Quick stats */}
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Status", value: siswa.status, color: siswa.status === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600" },
                { label: "JK", value: siswa.jenisKelamin === "L" ? "♂ Laki-laki" : siswa.jenisKelamin === "P" ? "♀ Perempuan" : "—", color: "bg-gray-100 text-gray-600" },
                { label: "Agama", value: siswa.agama, color: "bg-blue-50 text-blue-700" },
                { label: "Tahun Masuk", value: siswa.tahunMasuk, color: "bg-amber-50 text-amber-700" },
              ].filter(s => s.value).map(s => (
                <span key={s.label} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.value}</span>
              ))}
              {siswa.user && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${siswa.user.isActive ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  Akun: {siswa.user.username}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Data Pribadi */}
        <Section title="Data Pribadi" icon="🪪">
          <dl>
            <InfoRow label="Tempat Lahir" value={siswa.tempatLahir} />
            <InfoRow label="Tanggal Lahir" value={siswa.tanggalLahir ? fmt(siswa.tanggalLahir) : null} />
            <InfoRow label="NIK" value={siswa.nik} />
            <InfoRow label="No. Induk" value={siswa.noInduk} />
            <InfoRow label="Gol. Darah" value={siswa.golonganDarah} />
            <InfoRow label="Tinggi / Berat" value={siswa.tinggiBadan ? `${siswa.tinggiBadan} cm / ${siswa.beratBadan ?? "?"} kg` : null} />
            <InfoRow label="Kebutuhan Khusus" value={siswa.kebutuhanKhusus} />
            <InfoRow label="Asal Sekolah" value={siswa.asalSekolah} />
          </dl>
        </Section>

        {/* Alamat & Kontak */}
        <Section title="Alamat & Kontak" icon="📍">
          <dl>
            <InfoRow label="Alamat" value={siswa.alamat} />
            <InfoRow label="Desa/Kel." value={[siswa.desaKel, siswa.kecamatan, siswa.kabupaten].filter(Boolean).join(", ")} />
            <InfoRow label="Kode Pos" value={siswa.kodePos} />
            <InfoRow label="No. HP" value={siswa.noHp} />
            <InfoRow label="Tinggal Bersama" value={siswa.tinggalDengan} />
            <InfoRow label="Transportasi" value={siswa.transportasi} />
          </dl>
        </Section>
      </div>

      {/* Orang Tua / Wali */}
      {siswa.orangTuaWali.length > 0 && (
        <Section title="Orang Tua / Wali" icon="👨‍👩‍👦">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {siswa.orangTuaWali.map((ot) => (
              <div key={ot.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{ot.tipe}</div>
                <div className="font-medium text-gray-900">{ot.nama}</div>
                <dl className="mt-1 space-y-0.5 text-xs text-gray-500">
                  {ot.pekerjaan && <div>{ot.pekerjaan}</div>}
                  {ot.pendidikan && <div>Pend: {ot.pendidikan}</div>}
                  {ot.noHp && <div>📱 {ot.noHp}</div>}
                  {ot.penghasilan && <div>Rp {Number(ot.penghasilan).toLocaleString("id-ID")}/bln</div>}
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Riwayat Kelas */}
      <Section title="Riwayat Kelas" icon="🏫">
        {siswa.anggotaRombel.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat kelas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Kelas / Rombel</th>
                <th className="px-3 py-2 text-left font-medium">Tingkat</th>
                <th className="px-3 py-2 text-left font-medium">Tahun Ajaran</th>
                <th className="px-3 py-2 text-right font-medium">No. Absen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {siswa.anggotaRombel.map((ar, i) => (
                <tr key={ar.id} className={i === 0 ? "bg-green-50" : "hover:bg-gray-50"}>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {ar.rombel.nama}
                    {i === 0 && <span className="ml-1.5 rounded bg-green-200 px-1 py-0.5 text-xs text-green-800">Saat ini</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{ar.rombel.tingkat.nama}</td>
                  <td className="px-3 py-2 text-gray-600">{ar.rombel.tahunAjaran.tahun}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{ar.nomorAbsen ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Nilai Akademik */}
      <Section title="Nilai Akademik" icon="📊">
        {Object.keys(nilaiByPeriode).length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data nilai.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(nilaiByPeriode).map(([periode, nilais]) => (
              <details key={periode} className="group" open={Object.keys(nilaiByPeriode).indexOf(periode) === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  <span>{periode}</span>
                  <span className="text-xs font-normal text-gray-500">{nilais.length} mapel</span>
                </summary>
                <table className="mt-2 w-full text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr><th className="px-3 py-1 text-left font-medium">Mapel</th><th className="px-3 py-1 font-medium">Nilai</th><th className="px-3 py-1 font-medium text-left">Capaian</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {nilais.map((n) => {
                      const nilai = n.nilaiAkhir ?? n.nilaiPengetahuan;
                      const color = !nilai ? "text-gray-400" : nilai >= n.kkm ? "text-green-700" : "text-red-600";
                      return (
                        <tr key={n.id} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-800">{n.mapel.namaMapel}</td>
                          <td className={`px-3 py-1.5 text-center font-semibold ${color}`}>{nilai ?? "—"}</td>
                          <td className="px-3 py-1.5 max-w-xs truncate text-xs text-gray-500">{n.deskripsiCapaian ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </details>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Prestasi */}
        <Section title="Prestasi" icon="🏆">
          {siswa.penerimaPrestasiList.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data prestasi.</p>
          ) : (
            <ul className="space-y-2">
              {siswa.penerimaPrestasiList.map((p) => (
                <li key={p.id} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <span className="text-base">🥇</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.prestasi.nama}</div>
                    <div className="text-xs text-gray-500">{p.prestasi.tingkat} · {p.prestasi.kategori} · {p.tahun ?? p.prestasi.tahun ?? "—"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Beasiswa */}
        <Section title="Beasiswa" icon="🎓">
          {siswa.penerimaBeasiswaList.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data beasiswa.</p>
          ) : (
            <ul className="space-y-2">
              {siswa.penerimaBeasiswaList.map((b) => (
                <li key={b.id} className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                  <span className="text-base">💰</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{b.beasiswa.nama}</div>
                    <div className="text-xs text-gray-500">{b.beasiswa.kategori} · {b.tahun ?? "—"}{b.nominal ? ` · ${rupiah(b.nominal)}` : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* SPP / Keuangan */}
      <Section title="SPP / Keuangan" icon="💳">
        {Object.keys(sppByTahun).length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data tagihan.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(sppByTahun).map(([tahun, tagihanList]) => (
              <div key={tahun}>
                <div className="mb-2 text-xs font-semibold text-gray-500">Tahun {tahun}</div>
                <div className="flex flex-wrap gap-2">
                  {tagihanList.map((t) => (
                    <div key={t.id} className={`rounded-md border px-2.5 py-1.5 text-center text-xs ${t.status === "lunas" ? "border-green-200 bg-green-50 text-green-700" : t.status === "cicil" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      <div className="font-medium">{BULAN[t.bulan]}</div>
                      <div>{t.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Link href={`/spp?siswaId=${siswa.id}`} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">Kelola SPP →</Link>
        </div>
      </Section>

      {/* Kehadiran */}
      <Section title="Rekap Kehadiran" icon="📅">
        <div className="flex flex-wrap gap-3">
          {[["hadir","✅","text-green-700","bg-green-50"],["izin","📋","text-blue-700","bg-blue-50"],["sakit","🤒","text-amber-700","bg-amber-50"],["alpa","❌","text-red-700","bg-red-50"],["terlambat","⏰","text-orange-700","bg-orange-50"]].map(([s, icon, tc, bg]) => (
            <div key={s} className={`rounded-xl border px-4 py-3 text-center ${bg}`}>
              <div className="text-xl">{icon}</div>
              <div className={`text-lg font-bold ${tc}`}>{hdSummary[s] ?? 0}</div>
              <div className="text-xs text-gray-500">{s}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">*Data {siswa.kehadiran.length} presensi terakhir</p>
      </Section>

      {/* Catatan BK */}
      {siswa.kasus.length > 0 && (
        <Section title="Catatan BK / Pelanggaran" icon="📝">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr><th className="px-3 py-1 text-left font-medium">Tanggal</th><th className="px-3 py-1 text-left font-medium">Pelanggaran</th><th className="px-3 py-1 font-medium">Poin</th><th className="px-3 py-1 text-left font-medium">Keterangan</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {siswa.kasus.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmt(k.tanggal)}</td>
                  <td className="px-3 py-2 text-gray-800">{k.namaKasus}</td>
                  <td className="px-3 py-2 text-center font-semibold text-red-600">{k.poin}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{k.keterangan ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs font-semibold text-red-600">Total poin: {siswa.kasus.reduce((s, k) => s + k.poin, 0)}</p>
        </Section>
      )}
    </div>
  );
}
