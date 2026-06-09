import { notFound } from "next/navigation";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { KartuGuruClient } from "../../_revamp/KartuGuruClient";

const inisial = (n: string) => n.replace(/\b(Drs?|Dra|S\.?Pd|M\.?Pd|S\.?Si|S\.?Ag|S\.?S|S\.?T|S\.?Or|S\.?Hum|M\.?Hum|M\.?Sc|Hj|H)\.?\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "G";

export default async function KartuGuruPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const { id } = await params;
  const [g, sekolah, totalGuru] = await Promise.all([
    prisma.guru.findFirst({ where: { id: Number(id), sekolahId, deletedAt: null }, include: { mapelDiampu: { select: { namaMapel: true }, take: 1 }, rombelWali: { select: { nama: true }, take: 1 } } }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true, alamat: true, kepalaSekolah: true, npsnDinas: true } }),
    prisma.guru.count({ where: { sekolahId, deletedAt: null } }),
  ]);
  if (!g) notFound();
  const role = (g.jenisJabatan && g.jenisJabatan !== "Guru Mapel" ? g.jenisJabatan : g.mapelDiampu[0]?.namaMapel ? `Guru ${g.mapelDiampu[0].namaMapel}` : "Guru").toUpperCase();
  const wali = g.rombelWali[0]?.nama ?? null;

  return (
    <KartuGuruClient
      data={{
        id: g.id, nama: g.namaGuru, inisial: inisial(g.namaGuru), foto: g.foto, role, wali,
        nip: g.nip ?? "—", nuptk: g.nuptk ?? "—", status: `${g.statusGuru ?? "—"}${g.golongan ? ` Gol. ${g.golongan}` : ""}`,
        berlaku: `Juni ${new Date().getFullYear() + 2}`, noTelp: g.noTelp, alamat: g.alamat,
        sekolah: sekolah?.nama ?? "Sekolah", sekolahAlamat: sekolah?.alamat ?? "", kepala: sekolah?.kepalaSekolah ?? "—", npsn: sekolah?.npsnDinas ?? "—",
      }}
      totalGuru={totalGuru}
    />
  );
}
