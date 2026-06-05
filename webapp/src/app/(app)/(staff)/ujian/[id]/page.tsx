import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
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
  const t = await getTranslations("ujian");
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
        <Link href="/ujian" className="text-sm text-gray-500 hover:text-gray-900">{t("back")}</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{ujian.judul}</h1>
      </div>

      {/* Pengaturan */}
      <form action={updateUjian} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input type="hidden" name="id" value={ujian.id} />
        <h2 className="text-sm font-medium text-gray-700">{t("pengaturanHeading")}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1"><label className="block text-xs text-gray-500">{t("fieldJudul")}</label><input name="judul" defaultValue={ujian.judul} className={`${inCls} w-full`} /></div>
          <div><label className="block text-xs text-gray-500">{t("fieldMapel")}</label><input name="mapel" defaultValue={ujian.mapel ?? ""} className={inCls} /></div>
          <div>
            <label className="block text-xs text-gray-500">{t("fieldRombel")}</label>
            <RombelSelect sekolahId={sekolahId} name="rombelId" defaultValue={ujian.rombelId ?? ""} className={inCls} />
          </div>
          <div><label className="block text-xs text-gray-500">{t("fieldDurasi")}</label><input name="durasiMenit" type="number" min={1} defaultValue={ujian.durasiMenit ?? ""} className={`${inCls} w-24`} /></div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label className="block text-xs text-gray-500">{t("fieldMulai")}</label><input type="datetime-local" name="mulai" defaultValue={dtLocal(ujian.mulai)} className={inCls} /></div>
          <div><label className="block text-xs text-gray-500">{t("fieldSelesai")}</label><input type="datetime-local" name="selesai" defaultValue={dtLocal(ujian.selesai)} className={inCls} /></div>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="acakSoal" defaultChecked={ujian.acakSoal} /> {t("acakSoal")}</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="aktif" defaultChecked={ujian.aktif} /> {t("aktifPublikasikan")}</label>
        </div>
        <div><label className="block text-xs text-gray-500">{t("fieldDeskripsi")}</label><input name="deskripsi" defaultValue={ujian.deskripsi ?? ""} className={`${inCls} w-full`} /></div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("savePengaturan")}</button>
      </form>

      {/* Bank soal */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">{t("bankSoalHeading", { n: ujian.soal.length })}</h2>
        <form action={addSoal} className="space-y-2 rounded-md border border-gray-100 p-3">
          <input type="hidden" name="ujianId" value={ujian.id} />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500">{t("fieldTipe")}</label>
              <select name="tipe" defaultValue="pilihan_ganda" className={inCls}>
                <option value="pilihan_ganda">{t("tipePilihanGanda")}</option>
                <option value="esai">{t("tipeEsai")}</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-500">{t("fieldBobot")}</label><input name="bobot" type="number" min={1} defaultValue={1} className={`${inCls} w-20`} /></div>
            <div>
              <label className="block text-xs text-gray-500">{t("fieldKunci")}</label>
              <select name="kunci" defaultValue="A" className={inCls}>
                {["A", "B", "C", "D", "E"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <textarea name="pertanyaan" required rows={2} placeholder={t("pertanyaanPlaceholder")} className={`${inCls} w-full`} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {["A", "B", "C", "D", "E"].map((l) => (
              <input key={l} name={`opsi${l}`} placeholder={t("opsiPlaceholder", { l })} className={inCls} />
            ))}
          </div>
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("addSoal")}</button>
        </form>

        <ol className="space-y-2">
          {ujian.soal.map((s) => (
            <li key={s.id} className="rounded-md border border-gray-100 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900">{s.nomor}. {s.pertanyaan}</span>
                  <div className="mt-1 text-xs text-gray-500">
                    {s.tipe === "pilihan_ganda" ? t("soalMetaPG", { kunci: s.kunci ?? "-", bobot: s.bobot }) : t("soalMetaEsai", { bobot: s.bobot })}
                  </div>
                </div>
                <form action={deleteSoal}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="ujianId" value={ujian.id} />
                  <button className="text-red-600 hover:underline">{t("delete")}</button>
                </form>
              </div>
            </li>
          ))}
          {ujian.soal.length === 0 && <li className="text-sm text-gray-400">{t("emptySoal")}</li>}
        </ol>
      </div>

      {/* Hasil */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">{t("hasilHeading", { n: ujian.hasil.length })}</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2 font-medium">{t("colSiswa")}</th><th className="px-4 py-2 font-medium">{t("colStatus")}</th><th className="px-4 py-2 font-medium">{t("colSkor")}</th><th className="px-4 py-2 font-medium text-right">{t("colAksi")}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ujian.hasil.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">{t("emptyPeserta")}</td></tr>}
              {ujian.hasil.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-gray-900">{h.siswa.namaLengkap}</td>
                  <td className="px-4 py-2 text-gray-600">{h.status}</td>
                  <td className="px-4 py-2 text-gray-700">{h.skor ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/ujian/${ujian.id}/hasil/${h.id}`} className="text-gray-600 hover:underline">{t("periksaNilai")}</Link>
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
