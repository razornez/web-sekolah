import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { nilaiEsai } from "../../../actions";

export default async function HasilUjianPage({
  params,
}: {
  params: Promise<{ id: string; hasilId: string }>;
}) {
  const sekolahId = await requireModule("ujian");
  const t = await getTranslations("ujian");
  const { id, hasilId } = await params;
  const ujianId = Number(id);

  const hasil = await prisma.hasilUjian.findFirst({
    where: { id: Number(hasilId), ujian: { id: ujianId, sekolahId } },
    include: {
      siswa: { select: { namaLengkap: true, nisn: true } },
      ujian: { select: { judul: true } },
      jawaban: { include: { soal: true }, orderBy: { soal: { nomor: "asc" } } },
    },
  });
  if (!hasil) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/ujian/${ujianId}`} className="text-sm text-gray-500 hover:text-gray-900">← {hasil.ujian.judul}</Link>
        <h1 className="text-2xl font-semibold text-gray-900">{hasil.siswa.namaLengkap}</h1>
        <p className="text-sm text-gray-500">
          {t("hasilSubtitle", { nisn: hasil.siswa.nisn ?? "-", status: hasil.status })}{" "}
          <span className="font-semibold text-gray-900">{hasil.skor ?? "-"}</span>
        </p>
      </div>

      <ol className="space-y-3">
        {hasil.jawaban.map((j) => {
          const isPG = j.soal.tipe === "pilihan_ganda";
          const benar = isPG && j.jawaban === j.soal.kunci;
          return (
            <li key={j.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <div className="font-medium text-gray-900">{j.soal.nomor}. {j.soal.pertanyaan}</div>
              <div className="mt-1 text-xs text-gray-500">{isPG ? t("soalMetaPGDetail", { bobot: j.soal.bobot }) : t("soalMetaEsai", { bobot: j.soal.bobot })}</div>

              {isPG ? (
                <div className="mt-2 space-y-0.5">
                  <div>{t("jawabanSiswa")} <b className={benar ? "text-green-700" : "text-red-600"}>{j.jawaban ?? "-"}</b></div>
                  <div className="text-gray-500">{t("kunciPoin", { kunci: j.soal.kunci ?? "-", nilai: j.nilai ?? 0, bobot: j.soal.bobot })}</div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="whitespace-pre-line rounded-md bg-gray-50 p-2 text-gray-700">{j.jawaban ?? t("jawabanKosong")}</div>
                  <form action={nilaiEsai} className="flex items-center gap-2">
                    <input type="hidden" name="jawabanId" value={j.id} />
                    <input type="hidden" name="hasilId" value={hasil.id} />
                    <label className="text-xs text-gray-500">{t("nilaiRange", { bobot: j.soal.bobot })}</label>
                    <input name="nilai" type="number" min={0} max={j.soal.bobot} defaultValue={j.nilai ?? ""} className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm" />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100">{t("save")}</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {hasil.jawaban.length === 0 && <li className="text-sm text-gray-400">{t("emptyJawaban")}</li>}
      </ol>
    </div>
  );
}
