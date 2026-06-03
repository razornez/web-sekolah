import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { PrintButton } from "@/components/PrintButton";

const BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

export default async function CetakKwitansiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const id = Number((await params).id);

  const bayar = await prisma.pembayaranSpp.findUnique({
    where: { id },
    include: {
      kwitansi: true,
      tagihan: {
        include: {
          jenis: { select: { nama: true } },
          siswa: {
            select: { namaLengkap: true, nisn: true, userId: true, sekolahId: true, sekolah: { select: { nama: true, alamat: true } } },
          },
        },
      },
    },
  });
  if (!bayar) notFound();

  const t = bayar.tagihan;
  const isOwner = t.siswa.userId === user.id;
  const isStaffSame = isStaff(user.role) && user.sekolahId === t.sekolahId;
  if (!isOwner && !isStaffSame) notFound();

  return (
    <div className="mx-auto max-w-xl p-8 text-sm">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <div className="border-b-2 border-black pb-2 text-center">
        <div className="text-lg font-bold uppercase">{t.siswa.sekolah.nama}</div>
        {t.siswa.sekolah.alamat && <div className="text-xs">{t.siswa.sekolah.alamat}</div>}
      </div>

      <h1 className="my-4 text-center text-base font-semibold uppercase">Kwitansi Pembayaran</h1>

      <table className="mb-4 w-full text-sm">
        <tbody>
          <tr><td className="w-40 py-1">No. Kwitansi</td><td className="py-1">: {bayar.kwitansi?.nomor ?? "-"}</td></tr>
          <tr><td className="py-1">Tanggal</td><td className="py-1">: {fmt(bayar.tanggalBayar)}</td></tr>
          <tr><td className="py-1">Telah diterima dari</td><td className="py-1">: {t.siswa.namaLengkap} {t.siswa.nisn ? `(NISN ${t.siswa.nisn})` : ""}</td></tr>
          <tr><td className="py-1">Untuk pembayaran</td><td className="py-1">: {t.jenis.nama} — {BULAN[t.bulan]} {t.tahun}</td></tr>
          <tr><td className="py-1">Jumlah</td><td className="py-1 font-semibold">: {rupiah(bayar.jumlah)}</td></tr>
        </tbody>
      </table>

      <div className="mt-2 inline-block rounded border border-black px-4 py-2 text-base font-bold">
        {rupiah(bayar.jumlah)}
      </div>

      <div className="mt-10 flex justify-end text-center text-sm">
        <div>
          <div>Petugas/Bendahara</div>
          <div className="mt-16">({bayar.petugas ?? "______________________"})</div>
        </div>
      </div>
    </div>
  );
}
