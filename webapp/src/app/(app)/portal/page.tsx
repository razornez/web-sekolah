import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("portal");

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
        <h1 className="text-2xl font-semibold text-gray-900">{t("ortuTitle")}</h1>
        <p className="text-gray-600">{t("welcome", { name: user.name ?? "" })}</p>
        <Card title={t("anakWali")}>
          {anak.length === 0 ? (
            <p className="text-sm text-gray-400">{t("anakEmpty")}</p>
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
        include: { rombel: { include: { tingkat: true, tahunAjaran: true }, select: undefined } },
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
        <h1 className="text-2xl font-semibold text-gray-900">{t("siswaTitle")}</h1>
        <p className="text-gray-500">{t("siswaNotFound")}</p>
      </div>
    );
  }

  const kelas = siswa.anggotaRombel[0]?.rombel;
  const rekapHadir = siswa.kehadiran.reduce<Record<string, number>>((acc, k) => {
    acc[k.status] = (acc[k.status] ?? 0) + 1;
    return acc;
  }, {});

  // Wali kelas dari rombel aktif
  const waliKelas = kelas?.waliGuruId
    ? await prisma.guru.findFirst({ where: { id: kelas.waliGuruId }, select: { namaGuru: true } })
    : null;

  // Summary stats
  const totalHadir = siswa.kehadiran.length;
  const hadirCount = rekapHadir["hadir"] ?? 0;
  const pctHadir = totalHadir > 0 ? Math.round((hadirCount / totalHadir) * 100) : null;
  const nilaiList = siswa.nilaiRapor.map((n) => n.nilaiAkhir ?? n.nilaiPengetahuan).filter((v): v is number => v !== null);
  const rataRata = nilaiList.length > 0 ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length) : null;
  const sppBelum = siswa.tagihanSpp.filter((s) => s.status !== "lunas").length;

  return (
    <div className="space-y-5">
      {/* Hero card siswa */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
              {siswa.namaLengkap.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{siswa.namaLengkap}</h1>
              <p className="text-sm text-gray-500">
                {siswa.nisn ? `NISN: ${siswa.nisn}` : ""}
                {kelas ? ` · ${kelas.nama} ${kelas.tahunAjaran.tahun}` : ""}
                {waliKelas ? ` · ${t("wali")}: ${waliKelas.namaGuru}` : ""}
              </p>
            </div>
          </div>
          <a href={`/cetak/rapor/${siswa.id}`} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            🖨 {t("cetakRapor")}
          </a>
        </div>
        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          <div className="text-center">
            <div className={`text-2xl font-black ${rataRata !== null ? (rataRata >= 75 ? "text-emerald-600" : rataRata >= 60 ? "text-amber-600" : "text-red-600") : "text-gray-300"}`}>
              {rataRata !== null ? rataRata : "—"}
            </div>
            <div className="text-xs text-gray-500">{t("rataRataNilai")}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-black ${pctHadir !== null ? (pctHadir >= 85 ? "text-emerald-600" : pctHadir >= 75 ? "text-amber-600" : "text-red-600") : "text-gray-300"}`}>
              {pctHadir !== null ? `${pctHadir}%` : "—"}
            </div>
            <div className="text-xs text-gray-500">{t("kehadiranPct")}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-black ${sppBelum > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {sppBelum > 0 ? sppBelum : "✓"}
            </div>
            <div className="text-xs text-gray-500">{sppBelum > 0 ? t("sppBelum") : t("sppLunas")}</div>
          </div>
        </div>
      </div>

      {user.sekolahId != null && <PengumumanFeed sekolahId={user.sekolahId} audience="siswa" />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t("nilaiTerbaru")}>
          {siswa.nilaiRapor.length === 0 ? (
            <p className="text-sm text-gray-400">{t("nilaiEmpty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1 font-medium">{t("colMapel")}</th>
                  <th className="py-1 font-medium">{t("colPeriode")}</th>
                  <th className="py-1 font-medium">{t("colNilai")}</th>
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

        <Card title={t("tagihanSpp")}>
          {siswa.tagihanSpp.length === 0 ? (
            <p className="text-sm text-gray-400">{t("tagihanEmpty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1 font-medium">{t("colJenis")}</th>
                  <th className="py-1 font-medium">{t("colPeriode")}</th>
                  <th className="py-1 font-medium">{t("colNominal")}</th>
                  <th className="py-1 font-medium">{t("colStatus")}</th>
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

        <Card title={t("rekapKehadiran")}>
          {siswa.kehadiran.length === 0 ? (
            <p className="text-sm text-gray-400">{t("presensiEmpty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2 text-sm">
              {(["hadir", "izin", "sakit", "alpa", "terlambat"] as const).map((s) => (
                <span key={s} className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                  <b>{rekapHadir[s] ?? 0}</b> {t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as "statusHadir")}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
