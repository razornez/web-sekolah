import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { AccountPanel } from "@/components/AccountPanel";
import { FotoUpload } from "@/components/FotoUpload";
import GuruForm from "../_components/GuruForm";
import { nonaktifkanGuru, aktifkanKembaliGuru } from "../actions";
import { ConfirmForm } from "@/components/ConfirmForm";

const fmt = (d: Date | null) => d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function EditGuruPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const { id } = await params;

  const guru = await prisma.guru.findFirst({
    where: { id: Number(id), sekolahId },
    include: {
      user: { select: { id: true, username: true, isActive: true } },
      mapelDiampu: { select: { id: true, namaMapel: true, kodeMapel: true, kelompok: true } },
      jadwalGuru: { include: { hari: { select: { nama: true, urutan: true } } }, orderBy: { hari: { urutan: "asc" } } },
      jurnalGuru: { orderBy: { tanggal: "desc" }, take: 6 },
      pendidikan: { orderBy: { id: "asc" } },
    },
  });
  if (!guru) notFound();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/guru" className="text-sm text-gray-500 hover:text-gray-900">← Data Guru</Link>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">{guru.namaGuru}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            {guru.statusGuru && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${guru.statusGuru === "PNS" ? "bg-blue-100 text-blue-700" : guru.statusGuru === "GTT" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                {guru.statusGuru}
              </span>
            )}
            {guru.jenisJabatan && <span>· {guru.jenisJabatan}</span>}
            {guru.pangkat && <span>· {guru.pangkat} ({guru.golongan})</span>}
            {guru.deletedAt && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">⛔ Nonaktif sejak {fmt(guru.deletedAt)}</span>}
          </div>
        </div>
      </div>

      {/* Nonaktif banner */}
      {guru.deletedAt && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <span className="text-xl">⛔</span>
          <div className="flex-1">
            <div className="font-semibold text-red-800">Guru ini sudah dinonaktifkan</div>
            <div className="text-sm text-red-600">Alasan: {guru.alasanHapus ?? "—"}</div>
          </div>
          <form action={aktifkanKembaliGuru}>
            <input type="hidden" name="id" value={guru.id} />
            <button className="rounded-md border border-green-300 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50">↩ Aktifkan Kembali</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Kiri: Biodata + Form */}
        <div className="xl:col-span-2 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">✏️ Data Pribadi & Kepegawaian</h2>
            <GuruForm
              initial={{
                id: guru.id, namaGuru: guru.namaGuru, nip: guru.nip, npk: guru.npk,
                nuptk: guru.nuptk, nik: guru.nik, jenisKelamin: guru.jenisKelamin,
                tempatLahir: guru.tempatLahir,
                tanggalLahir: guru.tanggalLahir?.toISOString().slice(0, 10) ?? null,
                alamat: guru.alamat, email: guru.email, noTelp: guru.noTelp,
                pangkat: guru.pangkat, golongan: guru.golongan,
                jenisJabatan: guru.jenisJabatan, statusGuru: guru.statusGuru,
              }}
            />
          </div>

          {/* Jadwal Mengajar */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">📅 Jadwal Mengajar</h2>
            {guru.jadwalGuru.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada jadwal terdaftar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr><th className="px-3 py-2 text-left font-medium">Hari</th><th className="px-3 py-2 text-left font-medium">Mapel</th><th className="px-3 py-2 text-left font-medium">Jam</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guru.jadwalGuru.map((j) => (
                    <tr key={j.id}>
                      <td className="px-3 py-2 font-medium text-gray-800">{j.hari.nama}</td>
                      <td className="px-3 py-2 text-gray-600">{j.mapel ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{j.jamMulai ?? "—"}{j.jamSelesai ? `–${j.jamSelesai}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-2">
              <Link href="/jadwal" className="text-xs text-gray-500 hover:text-gray-900 hover:underline">Kelola jadwal →</Link>
            </div>
          </div>

          {/* Jurnal Terbaru */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">📓 Jurnal Mengajar Terbaru</h2>
            {guru.jurnalGuru.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada jurnal.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {guru.jurnalGuru.map((j) => (
                  <li key={j.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800">{j.materi ?? "—"}</span>
                      <span className="text-xs text-gray-400">{fmt(j.tanggal)}</span>
                    </div>
                    <div className="text-xs text-gray-500">{j.kelas ?? "—"} · {j.mapel ?? "—"}</div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/jurnal" className="mt-2 block text-xs text-gray-500 hover:text-gray-900 hover:underline">Lihat semua jurnal →</Link>
          </div>
        </div>

        {/* Kanan: Mapel + Pendidikan + Foto + Akun + Nonaktifkan */}
        <div className="space-y-4">
          {/* Foto */}
          <FotoUpload kind="guru" ownerId={guru.id} current={guru.foto} />

          {/* Mapel yang diajar */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">📚 Mapel yang Diajar</h2>
            {guru.mapelDiampu.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada mapel terdaftar.</p>
            ) : (
              <ul className="space-y-1.5">
                {guru.mapelDiampu.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{m.namaMapel}</span>
                    <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{m.kelompok}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/mapel" className="mt-2 block text-xs text-gray-500 hover:text-gray-900 hover:underline">Kelola mapel →</Link>
          </div>

          {/* Pendidikan */}
          {guru.pendidikan.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">🎓 Riwayat Pendidikan</h2>
              <ul className="space-y-2">
                {guru.pendidikan.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="font-medium text-gray-800">{p.jenjang} — {p.jurusan ?? "—"}</div>
                    <div className="text-xs text-gray-500">{p.namaSekolah ?? "—"}{p.tahunLulus ? ` · Lulus ${p.tahunLulus}` : ""}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Akun Login */}
          <AccountPanel
            kind="guru"
            ownerId={guru.id}
            account={guru.user ? { userId: guru.user.id, username: guru.user.username, isActive: guru.user.isActive } : null}
          />

          {/* Nonaktifkan */}
          {!guru.deletedAt && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <h2 className="mb-1 text-sm font-semibold text-red-800">⛔ Nonaktifkan Guru</h2>
              <p className="mb-3 text-xs text-red-600">Data tidak dihapus permanen. Guru bisa diaktifkan kembali kapan saja.</p>
              <ConfirmForm
                action={nonaktifkanGuru}
                message={`Yakin nonaktifkan ${guru.namaGuru}?`}
                className="space-y-2"
              >
                <input type="hidden" name="id" value={guru.id} />
                <div>
                  <label className="block text-xs font-medium text-red-700">Alasan nonaktif *</label>
                  <input
                    name="alasan"
                    required
                    placeholder="Pensiun / Mengundurkan diri / Mutasi / …"
                    className="mt-1 w-full rounded-md border border-red-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
                <button type="submit" className="w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
                  Nonaktifkan
                </button>
              </ConfirmForm>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
