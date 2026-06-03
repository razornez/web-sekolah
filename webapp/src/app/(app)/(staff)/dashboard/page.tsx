import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Statistik tenant (jika superadmin tanpa sekolah, tampilkan 0).
  const sekolahId = user.sekolahId ?? -1;
  const [siswa, guru, rombel] = await Promise.all([
    prisma.siswa.count({ where: { sekolahId } }),
    prisma.guru.count({ where: { sekolahId } }),
    prisma.rombel.count({ where: { sekolahId } }),
  ]);

  const stats = [
    { label: "Siswa", value: siswa, href: "/siswa" },
    { label: "Guru", value: guru, href: null },
    { label: "Rombel", value: rombel, href: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang, {user.name}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const card = (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="text-3xl font-semibold text-gray-900">
                {s.value.toLocaleString("id-ID")}
              </div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block hover:opacity-80">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
