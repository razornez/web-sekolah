import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CekKelulusanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nisn?: string }>;
}) {
  const { slug } = await params;
  const nisn = ((await searchParams).nisn ?? "").trim();

  const sekolah = await prisma.sekolah.findUnique({
    where: { slug },
    select: { id: true, nama: true },
  });
  if (!sekolah) notFound();

  const setting = await prisma.settingKelulusan.findFirst({ where: { sekolahId: sekolah.id } });

  let result: { nama: string; status: string; keterangan: string | null } | null = null;
  let notFoundMsg = false;
  if (setting?.aktif && nisn) {
    const siswa = await prisma.siswa.findFirst({
      where: { sekolahId: sekolah.id, nisn },
      select: { namaLengkap: true, kelulusan: { select: { status: true, keterangan: true } } },
    });
    if (siswa?.kelulusan) {
      result = { nama: siswa.namaLengkap, status: siswa.kelulusan.status, keterangan: siswa.kelulusan.keterangan };
    } else {
      notFoundMsg = true;
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Pengumuman Kelulusan</h1>
        <p className="mb-4 text-sm text-gray-500">{sekolah.nama}</p>

        {!setting?.aktif ? (
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
            Pengumuman kelulusan belum dibuka.
          </div>
        ) : (
          <>
            {setting.pengumuman && <p className="mb-3 text-sm text-gray-600">{setting.pengumuman}</p>}
            <form className="flex gap-2">
              <input name="nisn" defaultValue={nisn} placeholder="Masukkan NISN" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Cek</button>
            </form>

            {result && (
              <div className={`mt-4 rounded-md p-4 text-sm ${result.status === "LULUS" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <div className="font-medium">{result.nama}</div>
                <div className="mt-1 text-lg font-semibold">{result.status}</div>
                {result.keterangan && <div className="mt-1">{result.keterangan}</div>}
              </div>
            )}
            {notFoundMsg && <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-500">Data tidak ditemukan atau status belum ditetapkan.</p>}
          </>
        )}
      </div>
    </main>
  );
}
