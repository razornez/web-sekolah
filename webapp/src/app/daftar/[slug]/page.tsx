import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitPendaftaran } from "./actions";

const inCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";

export default async function DaftarPpdbPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { ok, error } = await searchParams;

  const sekolah = await prisma.sekolah.findUnique({
    where: { slug },
    select: { id: true, nama: true },
  });
  if (!sekolah) notFound();

  const jalur = await prisma.jalurPpdb.findMany({
    where: { sekolahId: sekolah.id },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true },
  });

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Pendaftaran Siswa Baru</h1>
        <p className="mb-4 text-sm text-gray-500">{sekolah.nama}</p>

        {ok ? (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            ✓ Pendaftaran berhasil dikirim. Silakan tunggu informasi seleksi dari sekolah.
            <div className="mt-2"><a href={`/daftar/${slug}`} className="underline">Daftar lagi</a></div>
          </div>
        ) : (
          <form action={submitPendaftaran} className="space-y-3">
            <input type="hidden" name="slug" value={slug} />
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Gagal mengirim. Periksa isian.</p>}
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
              <input name="namaLengkap" required className={inCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Jenis Kelamin *</label>
                <select name="jenisKelamin" required defaultValue="" className={inCls}>
                  <option value="">- pilih -</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">NISN</label>
                <input name="nisn" className={inCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
                <input name="tempatLahir" className={inCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <input type="date" name="tanggalLahir" className={inCls} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Asal Sekolah</label>
              <input name="asalSekolah" className={inCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">No. HP</label>
                <input name="noHp" className={inCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Jalur</label>
                <select name="jalurId" defaultValue="" className={inCls}>
                  <option value="">- umum -</option>
                  {jalur.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Kirim Pendaftaran
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
