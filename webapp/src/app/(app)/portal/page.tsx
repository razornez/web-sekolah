import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { PengumumanFeed } from "@/components/PengumumanFeed";

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (isStaff(user.role)) redirect("/dashboard");
  const sekolahId = user.sekolahId ?? -1;

  if (user.role === "ortu") {
    const anak = await prisma.orangTuaWali.findMany({
      where: { userId: user.id },
      include: {
        siswa: {
          select: {
            namaLengkap: true,
            nisn: true,
            anggotaRombel: {
              include: { rombel: { select: { nama: true } } },
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        },
      },
    });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Portal Orang Tua</h1>
        <p className="text-gray-600">Selamat datang, {user.name}.</p>
        <Card title="Anak / Wali">
          {anak.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data anak tertaut.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {anak.map((a) => (
                <li key={a.id} className="py-2">
                  <span className="font-medium text-gray-900">{a.siswa.namaLengkap}</span>
                  <span className="ml-2 text-gray-500">
                    {a.siswa.anggotaRombel[0]?.rombel.nama ?? "-"} · {a.siswa.nisn ?? "-"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {user.sekolahId != null && <PengumumanFeed sekolahId={user.sekolahId} audience="ortu" />}
      </div>
    );
  }

  // Default: siswa
  const siswa = await prisma.siswa.findFirst({
    where: { userId: user.id, sekolahId },
    include: {
      anggotaRombel: {
        include: { rombel: { include: { tingkat: true, tahunAjaran: true } } },
        orderBy: { id: "desc" },
        take: 1,
      },
      nilaiRapor: {
        include: {
          mapel: { select: { namaMapel: true } },
          periode: { select: { nama: true } },
        },
        orderBy: { id: "desc" },
        take: 30,
      },
      tagihanSpp: {
        include: { jenis: { select: { nama: true } } },
        orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      },
      kehadiran: {
        orderBy: { tanggal: "desc" },
        take: 60,
        select: { tanggal: true, status: true },
      },
    },
  });

  if (!siswa) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Portal Siswa</h1>
        <p className="text-gray-500">Data siswa tidak ditemukan untuk akun ini.</p>
      </div>
    );
  }

  const kelas = siswa.anggotaRombel[0]?.rombel;
  const rekapHadir = siswa.kehadiran.reduce<Record<string, number>>((acc, k) => {
    acc[k.status] = (acc[k.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Portal Siswa</h1>
          <p className="text-gray-600">
            {siswa.namaLengkap}
            {siswa.nisn ? ` · NISN ${siswa.nisn}` : ""}
            {kelas ? ` · ${kelas.nama} (${kelas.tahunAjaran.tahun})` : ""}
          </p>
        </div>
        <a href={`/cetak/rapor/${siswa.id}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Cetak Rapor
        </a>
      </div>

      {user.sekolahId != null && <PengumumanFeed sekolahId={user.sekolahId} audience="siswa" />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Nilai Terbaru">
          {siswa.nilaiRapor.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada nilai.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1 font-medium">Mapel</th>
                  <th className="py-1 font-medium">Periode</th>
                  <th className="py-1 font-medium">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {siswa.nilaiRapor.map((n) => (
                  <tr key={n.id}>
                    <td className="py-1 text-gray-900">{n.mapel.namaMapel}</td>
                    <td className="py-1 text-gray-500">{n.periode.nama}</td>
                    <td className="py-1 text-gray-700">
                      {n.nilaiAkhir ?? n.nilaiPengetahuan ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Tagihan SPP">
          {siswa.tagihanSpp.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada tagihan.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1 font-medium">Jenis</th>
                  <th className="py-1 font-medium">Periode</th>
                  <th className="py-1 font-medium">Nominal</th>
                  <th className="py-1 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {siswa.tagihanSpp.map((t) => (
                  <tr key={t.id}>
                    <td className="py-1 text-gray-900">{t.jenis.nama}</td>
                    <td className="py-1 text-gray-500">{BULAN[t.bulan]} {t.tahun}</td>
                    <td className="py-1 text-gray-700">{rupiah(t.nominal)}</td>
                    <td className="py-1">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${t.status === "lunas" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Rekap Kehadiran">
          {siswa.kehadiran.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data presensi.</p>
          ) : (
            <div className="flex flex-wrap gap-2 text-sm">
              {["hadir", "izin", "sakit", "alpa", "terlambat"].map((s) => (
                <span key={s} className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                  <b>{rekapHadir[s] ?? 0}</b> {s}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
