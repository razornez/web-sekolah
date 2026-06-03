import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PengumumanFeed } from "@/components/PengumumanFeed";
import { BarList, Donut } from "@/components/charts";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const sekolahId = user.sekolahId ?? -1;

  const [
    siswa, guru, rombel, tagihanBelum, pelanggaran, ujian,
    genderG, statusG, rombelTop, sppG, hadirG,
  ] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId } }),
    prisma.guru.count({ where: { sekolahId } }),
    prisma.rombel.count({ where: { sekolahId } }),
    prisma.tagihanSpp.count({ where: { sekolahId, status: "belum" } }),
    prisma.kasusSiswa.count({ where: { sekolahId } }),
    prisma.ujian.count({ where: { sekolahId } }),
    prisma.siswa.groupBy({ by: ["jenisKelamin"], where: { sekolahId }, _count: true }),
    prisma.siswa.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
    prisma.rombel.findMany({
      where: { sekolahId },
      orderBy: { nama: "asc" },
      take: 10,
      select: { nama: true, _count: { select: { anggota: true } } },
    }),
    prisma.tagihanSpp.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
    prisma.kehadiranSiswa.groupBy({ by: ["status"], where: { sekolahId }, _count: true }),
  ]);

  const gCount = (rows: { _count: number }[], field: string, value: string | null) =>
    rows.find((r) => (r as Record<string, unknown>)[field] === value)?._count ?? 0;

  const stats = [
    { label: "Siswa", value: siswa, href: "/siswa" },
    { label: "Guru", value: guru, href: "/guru" },
    { label: "Rombel", value: rombel, href: "/rombel" },
    { label: "SPP Belum Lunas", value: tagihanBelum, href: "/spp" },
    { label: "Pelanggaran", value: pelanggaran, href: "/bk" },
    { label: "Ujian", value: ujian, href: "/ujian" },
  ];

  const gender = [
    { label: "Laki-laki", value: gCount(genderG, "jenisKelamin", "L"), color: "#3b82f6" },
    { label: "Perempuan", value: gCount(genderG, "jenisKelamin", "P"), color: "#ec4899" },
    { label: "Belum diisi", value: gCount(genderG, "jenisKelamin", null), color: "#9ca3af" },
  ];

  const statusSiswa = (["aktif", "lulus", "pindah", "keluar", "alumni"] as const).map((s) => ({
    label: s, value: gCount(statusG, "status", s),
  }));

  const spp = (["lunas", "belum", "cicil"] as const).map((s) => ({
    label: s, value: gCount(sppG, "status", s),
  }));

  const hadir = (["hadir", "izin", "sakit", "alpa", "terlambat"] as const).map((s) => ({
    label: s, value: gCount(hadirG, "status", s),
  }));

  const rombelData = rombelTop.map((r) => ({ label: r.nama, value: r._count.anggota }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang, {user.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-gray-200 bg-white p-4 hover:opacity-80">
            <div className="text-2xl font-semibold text-gray-900">{s.value.toLocaleString("id-ID")}</div>
            <div className="mt-1 text-xs text-gray-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Donut title="Distribusi Jenis Kelamin" data={gender} />
        <BarList title="Siswa per Status" data={statusSiswa} barClass="bg-indigo-600" />
        <BarList title="Status Tagihan SPP" data={spp} barClass="bg-emerald-600" />
        <BarList title="Rekap Kehadiran" data={hadir} barClass="bg-amber-500" />
        <div className="lg:col-span-2">
          <BarList title="Jumlah Siswa per Rombel" data={rombelData} barClass="bg-gray-900" />
        </div>
      </div>

      {user.sekolahId != null && <PengumumanFeed sekolahId={user.sekolahId} audience="staf" />}
    </div>
  );
}
