import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { PrintButton } from "@/components/PrintButton";

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
      sekolah: { select: { nama: true, alamat: true, kurikulumDefault: true, kepalaSekolah: true } },
      anggotaRombel: {
        include: { rombel: { include: { tingkat: { select: { nama: true, fase: true } }, tahunAjaran: { select: { tahun: true } } } } },
        orderBy: { id: "desc" },
        take: 1,
      },
    },
  });
  if (!siswa) notFound();

  // Otorisasi: pemilik (siswa sendiri) atau staf di sekolah yang sama
  const isOwner = siswa.userId === user.id;
  const isStaffSame = isStaff(user.role) && user.sekolahId === siswa.sekolahId;
  if (!isOwner && !isStaffSame) notFound();

  const kelas = siswa.anggotaRombel[0]?.rombel;

  // Belum pilih periode → tampilkan pemilih
  if (!periodeId) {
    const periode = await prisma.periode.findMany({
      where: { tahunAjaran: { sekolahId: siswa.sekolahId } },
      orderBy: [{ tahunAjaranId: "desc" }, { urutan: "asc" }],
      include: { tahunAjaran: { select: { tahun: true } } },
    });
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-lg font-semibold">Cetak Rapor — {siswa.namaLengkap}</h1>
        <p className="mb-3 text-sm text-gray-500">Pilih periode:</p>
        <ul className="space-y-1">
          {periode.length === 0 && <li className="text-sm text-gray-400">Belum ada periode.</li>}
          {periode.map((p) => (
            <li key={p.id}>
              <Link href={`/cetak/rapor/${siswaId}?periodeId=${p.id}`} className="text-blue-700 underline">
                {p.tahunAjaran.tahun} · {p.nama}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const [periode, nilai] = await Promise.all([
    prisma.periode.findFirst({ where: { id: periodeId, tahunAjaran: { sekolahId: siswa.sekolahId } }, include: { tahunAjaran: { select: { tahun: true } } } }),
    prisma.nilaiRapor.findMany({
      where: { siswaId, periodeId },
      orderBy: { mapel: { noUrut: "asc" } },
      include: { mapel: { select: { namaMapel: true } } },
    }),
  ]);
  if (!periode) notFound();

  const merdeka = siswa.sekolah.kurikulumDefault === "MERDEKA";

  return (
    <div className="mx-auto max-w-3xl p-8 text-sm">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      {/* Kop */}
      <div className="border-b-2 border-black pb-2 text-center">
        <div className="text-lg font-bold uppercase">{siswa.sekolah.nama}</div>
        {siswa.sekolah.alamat && <div className="text-xs">{siswa.sekolah.alamat}</div>}
      </div>

      <h1 className="my-4 text-center text-base font-semibold uppercase">Laporan Hasil Belajar</h1>

      {/* Identitas */}
      <table className="mb-4 text-sm">
        <tbody>
          <tr><td className="pr-2">Nama</td><td className="pr-6">: {siswa.namaLengkap}</td><td className="pr-2">Kelas</td><td>: {kelas?.nama ?? "-"}</td></tr>
          <tr><td className="pr-2">NISN</td><td>: {siswa.nisn ?? "-"}</td><td className="pr-2">Fase</td><td>: {kelas?.tingkat.fase ?? "-"}</td></tr>
          <tr><td className="pr-2">Tahun Ajaran</td><td>: {periode.tahunAjaran.tahun}</td><td className="pr-2">Semester</td><td>: {periode.nama}</td></tr>
        </tbody>
      </table>

      {/* Nilai */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-1 text-left">No</th>
            <th className="border border-black px-2 py-1 text-left">Mata Pelajaran</th>
            <th className="border border-black px-2 py-1">KKM</th>
            {merdeka ? (
              <>
                <th className="border border-black px-2 py-1">Nilai</th>
                <th className="border border-black px-2 py-1 text-left">Capaian Kompetensi</th>
              </>
            ) : (
              <>
                <th className="border border-black px-2 py-1">Pengetahuan</th>
                <th className="border border-black px-2 py-1">Keterampilan</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {nilai.length === 0 && (
            <tr><td colSpan={merdeka ? 5 : 5} className="border border-black px-2 py-4 text-center text-gray-400">Belum ada nilai untuk periode ini.</td></tr>
          )}
          {nilai.map((n, i) => (
            <tr key={n.id}>
              <td className="border border-black px-2 py-1">{i + 1}</td>
              <td className="border border-black px-2 py-1">{n.mapel.namaMapel}</td>
              <td className="border border-black px-2 py-1 text-center">{n.kkm}</td>
              {merdeka ? (
                <>
                  <td className="border border-black px-2 py-1 text-center">{n.nilaiAkhir ?? "-"}</td>
                  <td className="border border-black px-2 py-1">{n.deskripsiCapaian ?? "-"}</td>
                </>
              ) : (
                <>
                  <td className="border border-black px-2 py-1 text-center">{n.nilaiPengetahuan ?? "-"}</td>
                  <td className="border border-black px-2 py-1 text-center">{n.nilaiKeterampilan ?? "-"}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tanda tangan */}
      <div className="mt-10 flex justify-between text-center text-sm">
        <div>
          <div>Orang Tua/Wali</div>
          <div className="mt-16">(______________________)</div>
        </div>
        <div>
          <div>Wali Kelas</div>
          <div className="mt-16">(______________________)</div>
        </div>
        <div>
          <div>Kepala Sekolah</div>
          <div className="mt-16">{siswa.sekolah.kepalaSekolah ? `(${siswa.sekolah.kepalaSekolah})` : "(______________________)"}</div>
        </div>
      </div>
    </div>
  );
}
