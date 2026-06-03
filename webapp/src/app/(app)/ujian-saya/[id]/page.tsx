import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { mulaiUjian } from "../actions";
import { UjianRunner, type SoalItem } from "../_components/UjianRunner";

type Opsi = { label: string; teks: string };

export default async function KerjakanUjianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (isStaff(user.role)) redirect("/ujian");
  const sekolahId = user.sekolahId ?? -1;
  const ujianId = Number((await params).id);

  const siswa = await prisma.siswa.findFirst({
    where: { userId: user.id, sekolahId },
    select: { id: true, anggotaRombel: { orderBy: { id: "desc" }, take: 1, select: { rombelId: true } } },
  });
  if (!siswa) notFound();
  const rombelId = siswa.anggotaRombel[0]?.rombelId ?? null;
  const now = new Date();

  const ujian = await prisma.ujian.findFirst({
    where: {
      id: ujianId,
      sekolahId,
      aktif: true,
      OR: [{ rombelId: null }, ...(rombelId ? [{ rombelId }] : [])],
      AND: [{ OR: [{ mulai: null }, { mulai: { lte: now } }] }, { OR: [{ selesai: null }, { selesai: { gte: now } }] }],
    },
    include: { soal: { orderBy: { nomor: "asc" } } },
  });
  if (!ujian) notFound();

  const hasil = await prisma.hasilUjian.findUnique({
    where: { ujianId_siswaId: { ujianId, siswaId: siswa.id } },
    include: { jawaban: { include: { soal: true }, orderBy: { soal: { nomor: "asc" } } } },
  });

  // Sudah selesai → tampilkan hasil + review
  if (hasil?.status === "selesai") {
    return (
      <div className="space-y-4">
        <Link href="/ujian-saya" className="text-sm text-gray-500 hover:text-gray-900">← Ujian Saya</Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{ujian.judul}</h1>
          <p className="text-gray-600">Skor Anda: <b className="text-xl">{hasil.skor ?? "-"}</b></p>
        </div>
        <ol className="space-y-3">
          {hasil.jawaban.map((j) => {
            const isPG = j.soal.tipe === "pilihan_ganda";
            const benar = isPG && j.jawaban === j.soal.kunci;
            return (
              <li key={j.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
                <div className="font-medium text-gray-900">{j.soal.nomor}. {j.soal.pertanyaan}</div>
                {isPG ? (
                  <div className="mt-1">
                    Jawaban: <b className={benar ? "text-green-700" : "text-red-600"}>{j.jawaban ?? "-"}</b>
                    <span className="ml-2 text-gray-500">(kunci {j.soal.kunci ?? "-"})</span>
                  </div>
                ) : (
                  <div className="mt-1 text-gray-600">
                    <div className="whitespace-pre-line rounded bg-gray-50 p-2">{j.jawaban ?? "-"}</div>
                    <div className="mt-1 text-xs text-gray-500">Nilai: {j.nilai ?? "menunggu penilaian"}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // Belum mulai → intro
  if (!hasil) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Link href="/ujian-saya" className="text-sm text-gray-500 hover:text-gray-900">← Ujian Saya</Link>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">{ujian.judul}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ujian.mapel ?? "-"} · {ujian.soal.length} soal{ujian.durasiMenit ? ` · ${ujian.durasiMenit} menit` : ""}
          </p>
          {ujian.deskripsi && <p className="mt-2 text-sm text-gray-600">{ujian.deskripsi}</p>}
          {ujian.durasiMenit && (
            <p className="mt-2 text-sm text-amber-700">Setelah mulai, waktu berjalan dan jawaban dikumpulkan otomatis saat waktu habis.</p>
          )}
          <form action={mulaiUjian} className="mt-4">
            <input type="hidden" name="ujianId" value={ujian.id} />
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Mulai Ujian</button>
          </form>
        </div>
      </div>
    );
  }

  // Sedang berlangsung → runner (acak bila diatur), tanpa membocorkan kunci
  let soal: SoalItem[] = ujian.soal.map((s) => ({
    id: s.id,
    nomor: s.nomor,
    pertanyaan: s.pertanyaan,
    tipe: s.tipe,
    opsi: ((s.opsi as Opsi[] | null) ?? []),
  }));
  if (ujian.acakSoal) soal = [...soal].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{ujian.judul}</h1>
        <p className="text-sm text-gray-500">{ujian.soal.length} soal · jawab semua lalu kumpulkan.</p>
      </div>
      <UjianRunner
        ujianId={ujian.id}
        durasiMenit={ujian.durasiMenit}
        mulaiAtMs={hasil.mulaiAt ? hasil.mulaiAt.getTime() : null}
        soal={soal}
      />
    </div>
  );
}
