import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { softDeleteSiswa, hardDeleteSiswa } from "../../actions";

export default async function DeleteSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("siswa");
  const user = await getCurrentUser();
  const { id } = await params;
  const siswaId = Number(id);

  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, sekolahId, deletedAt: null }, select: { id: true, namaLengkap: true, nisn: true, nis: true } });
  if (!siswa) notFound();

  // Hitung data yang terkait
  const [nilaiRapor, kehadiran, sppTagihan, kasusBK, pengumpulanTugas, hasilUjian, pinjamanBuku, anggotaRombel, anggotaEkstra] = await Promise.all([
    prisma.nilaiRapor.count({ where: { siswaId } }),
    prisma.kehadiranSiswa.count({ where: { siswaId } }),
    prisma.tagihanSpp.count({ where: { siswaId } }),
    prisma.kasusSiswa.count({ where: { siswaId } }),
    prisma.pengumpulanTugas.count({ where: { siswaId } }),
    prisma.hasilUjian.count({ where: { siswaId } }),
    prisma.pinjamanBuku.count({ where: { siswaId } }),
    prisma.anggotaRombel.count({ where: { siswaId } }),
    prisma.anggotaEkstra.count({ where: { siswaId } }),
  ]);

  const isAdmin = ["admin", "operator", "kepsek"].includes(user.role);
  const relasi = [
    { label: "Nilai Rapor", count: nilaiRapor, icon: "📊" },
    { label: "Data Kehadiran", count: kehadiran, icon: "📅" },
    { label: "Tagihan SPP", count: sppTagihan, icon: "💰" },
    { label: "Catatan BK", count: kasusBK, icon: "📝" },
    { label: "Pengumpulan Tugas", count: pengumpulanTugas, icon: "📤" },
    { label: "Hasil Ujian", count: hasilUjian, icon: "📋" },
    { label: "Pinjaman Buku", count: pinjamanBuku, icon: "📚" },
    { label: "Keanggotaan Rombel", count: anggotaRombel, icon: "🏫" },
    { label: "Ekstrakurikuler", count: anggotaEkstra, icon: "⚽" },
  ];
  const totalRelasi = relasi.reduce((s, r) => s + r.count, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href={`/siswa/${siswa.id}`} className="text-sm text-gray-500 hover:text-gray-900">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Hapus Data Siswa</h1>
      </div>

      {/* Identitas */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-lg font-semibold text-gray-900">{siswa.namaLengkap}</div>
        <div className="text-sm text-gray-500">NISN: {siswa.nisn ?? "—"} · NIS: {siswa.nis ?? "—"}</div>
      </div>

      {/* Relasi */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span className="font-semibold text-amber-900">
            {totalRelasi > 0 ? `Siswa ini memiliki ${totalRelasi} data terkait` : "Tidak ada data terkait"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {relasi.map((r) => (
            <div key={r.label} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${r.count > 0 ? "bg-amber-100 text-amber-800" : "bg-white text-gray-400"}`}>
              <span>{r.icon}</span>
              <span>{r.label}: <b>{r.count}</b></span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-amber-800">
          <b>Arsipkan (direkomendasikan):</b> data siswa disembunyikan dari daftar utama tetapi semua data relasi terjaga. Bisa dipulihkan kapan saja.
        </p>
      </div>

      {/* SOFT DELETE — direkomendasikan */}
      <form action={softDeleteSiswa} className="rounded-lg border border-gray-200 bg-white p-4">
        <input type="hidden" name="id" value={siswa.id} />
        <h2 className="mb-1 text-base font-semibold text-gray-900">Arsipkan Siswa</h2>
        <p className="mb-3 text-sm text-gray-500">
          Siswa tidak akan muncul di daftar utama. Semua nilai, kehadiran, SPP, dan data lain <b>tetap tersimpan</b>. Dapat dipulihkan dari <Link href="/siswa/arsip" className="text-blue-600 underline">halaman arsip</Link>.
        </p>
        <button type="submit" className="rounded-md bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700">
          🗑 Arsipkan Siswa
        </button>
      </form>

      {/* HARD DELETE — hanya admin */}
      {isAdmin && (
        <form action={hardDeleteSiswa} className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <input type="hidden" name="id" value={siswa.id} />
          <h2 className="mb-1 text-base font-semibold text-red-900">⛔ Hapus Permanen (Admin)</h2>
          <p className="mb-3 text-sm text-red-700">
            Semua data siswa dan {totalRelasi} data terkait (nilai, kehadiran, SPP, dll) akan <b>dihapus selamanya</b> dan <b>tidak dapat dipulihkan</b>.
          </p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-red-800">Ketik <code className="rounded bg-red-200 px-1">HAPUS</code> untuk konfirmasi:</label>
            <input name="confirm" required placeholder="HAPUS" className="mt-1 w-full rounded-md border border-red-400 bg-white px-3 py-2 text-sm outline-none focus:border-red-700" />
          </div>
          <button type="submit" className="rounded-md bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800">
            💀 Hapus Permanen
          </button>
        </form>
      )}

      <Link href={`/siswa/${siswa.id}`} className="block text-center text-sm text-gray-500 hover:text-gray-900">
        Batal — kembali ke data siswa
      </Link>
    </div>
  );
}
