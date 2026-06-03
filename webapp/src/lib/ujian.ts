import { prisma } from "@/lib/prisma";

/** Hitung ulang skor (0–100) = (total poin diperoleh / total bobot) * 100. */
export async function recomputeSkor(hasilId: number) {
  const hasil = await prisma.hasilUjian.findUnique({
    where: { id: hasilId },
    include: { jawaban: true, ujian: { include: { soal: { select: { bobot: true } } } } },
  });
  if (!hasil) return;
  const totalBobot = hasil.ujian.soal.reduce((s, q) => s + q.bobot, 0) || 1;
  const diperoleh = hasil.jawaban.reduce((s, j) => s + (j.nilai ?? 0), 0);
  const skor = Math.round((diperoleh / totalBobot) * 100);
  await prisma.hasilUjian.update({ where: { id: hasilId }, data: { skor } });
}
