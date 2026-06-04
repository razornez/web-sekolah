import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { RombelSelect } from "@/components/filters/RombelSelect";
import { updateUjian, addSoal, deleteSoal } from "../actions";

const inCls = "rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-gray-900";
const dtLocal = (d: Date | null) =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export default async function UjianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sekolahId = await requireModule("ujian");
  const ujianId = Number((await params).id);

  const ujian = await prisma.ujian.findFirst({
    where: { id: ujianId, sekolahId },
    include: {
      soal: { orderBy: { nomor: "asc" } },
      hasil: { include: { siswa: { select: { namaLengkap: true } } }, orderBy: { skor: "desc" } },
    },
  });
  if (!ujian) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ujian" className="text-sm text-gray-500 hover:text-gray-900">← Ujian</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{ujian.judul}</h1>
      </div>

      {/* Pengaturan */}
      <form action={updateUjian} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input type="hidden" name="id" value={ujian.id} />
        <h2 className="text-sm font-medium text-gray-700">Pengaturan</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1"><label className="block text-xs text-gray-500">Judul</label><input name="judul" defaultValue={ujian.judul} className={`${inCls} w-full`} /></div>
          <div><label className="block text-xs text-gray-500">Mapel</label><input name="mapel" defaultValue={ujian.mapel ?? ""} className={inCls} /></div>
          <div>
            <label className="block text-xs text-gray-500">Rombel</label>
            <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={ujian.rombelId ?? ""} className={inCls} />
          </div>
          <div><label className="block text-xs text-gray-500">Durasi (menit)</label><input name="durasiMenit" type="number" min={1} defaultValue={ujian.durasiMenit ?? ""} className={`${inCls} w-24`} /></div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label className="block text-xs text-gray-500">Mulai</label><input type="datetime-local" name="mulai" defaultValue={dtLocal(ujian.mulai)} className={inCls} /></div>
          <div><label className="block text-xs text-gray-500">Selesai</label><input type="datetime-local" name="selesai" defaultValue={dtLocal(ujian.selesai)} className={inCls} /></div>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="acakSoal" defaultChecked={ujian.acakSoal} /> Acak soal</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="aktif" defaultChecked={ujian.aktif} /> Aktif (publikasikan)</label>
        </div>
        <div><label className="block text-xs text-gray-500">Deskripsi</label><input name="deskripsi" defaultValue={ujian.deskripsi ?? ""} className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Simpan Pengaturan</button>
      </form>

      {/* Bank soal */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Bank Soal ({ujian.soal.length})</h2>
        <form action={addSoal} className="space-y-2 rounded-md border border-gray-100 p-3">
          <input type="hidden" name="ujianId" value={ujian.id} />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500">Tipe</label>
              <select name="tipe" defaultValue="pilihan_ganda" className={inCls}>
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="esai">Esai</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-500">Bobot</label><input name="bobot" type="number" min={1} defaultValue={1} className={`${inCls} w-20`} /></div>
            <div>
              <label className="block text-xs text-gray-500">Kunci (PG)</label>
              <select name="kunci" defaultValue="A" className={inCls}>
                {["A", "B", "C", "D", "E"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <textarea name="pertanyaan" required rows={2} placeholder="Tulis pertanyaan…" className={`${inCls} w-full`} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {["A", "B", "C", "D", "E"].map((l) => (
              <input key={l} name={`opsi${l}`} placeholder={`Opsi ${l} (kosongkan jika esai/tak dipakai)`} className={inCls} />
            ))}
          </div>
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah Soal</button>
        </form>

        <ol className="space-y-2">
          {ujian.soal.map((s) => (
            <li key={s.id} className="rounded-md border border-gray-100 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900">{s.nomor}. {s.pertanyaan}</span>
                  <div className="mt-1 text-xs text-gray-500">
                    {s.tipe === "pilihan_ganda" ? `Pilihan Ganda · kunci ${s.kunci ?? "-"}` : "Esai"} · bobot {s.bobot}
                  </div>
                </div>
                <form action={deleteSoal}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="ujianId" value={ujian.id} />
                  <button className="text-red-600 hover:underline">Hapus</button>
                </form>
              </div>
            </li>
          ))}
          {ujian.soal.length === 0 && <li className="text-sm text-gray-400">Belum ada soal.</li>}
        </ol>
      </div>

      {/* Hasil */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Hasil Peserta ({ujian.hasil.length})</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2 font-medium">Siswa</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 font-medium">Skor</th><th className="px-4 py-2 font-medium text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ujian.hasil.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Belum ada peserta.</td></tr>}
              {ujian.hasil.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-gray-900">{h.siswa.namaLengkap}</td>
                  <td className="px-4 py-2 text-gray-600">{h.status}</td>
                  <td className="px-4 py-2 text-gray-700">{h.skor ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/ujian/${ujian.id}/hasil/${h.id}`} className="text-gray-600 hover:underline">Periksa / Nilai</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
