import { notFound } from "next/navigation";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { SKTugasClient } from "../../_revamp/SKTugasClient";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export default async function SKTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const sekolahId = await requireModule("guru");
  const { id } = await params;
  const [g, sekolah] = await Promise.all([
    prisma.guru.findFirst({ where: { id: Number(id), sekolahId, deletedAt: null }, include: { pendidikan: { orderBy: { tahunLulus: "desc" }, take: 1 }, mapelDiampu: { select: { namaMapel: true } }, rombelWali: { select: { nama: true } } } }),
    prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { nama: true, alamat: true, kepalaSekolah: true, nipKepala: true, npsnDinas: true, telepon: true } }),
  ]);
  if (!g) notFound();
  const now = new Date();
  const ta = `${now.getFullYear()}/${now.getFullYear() + 1}`;
  const noSK = `${String(g.id).padStart(3, "0")}/${(sekolah?.nama ?? "SEK").split(/\s+/).slice(-2).map((w) => w[0]).join("")}/${ROMAN[now.getMonth() + 1]}/${now.getFullYear()}`;
  const ped = g.pendidikan[0];

  return (
    <SKTugasClient
      data={{
        nama: g.namaGuru, nip: g.nip ?? "—", nuptk: g.nuptk ?? "—", pangkat: g.pangkat ?? "—", golongan: g.golongan ?? "—",
        ttl: `${g.tempatLahir ?? "—"}${g.tanggalLahir ? `, ${g.tanggalLahir.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}` : ""}`,
        pendidikan: ped ? `${ped.jenjang}${ped.jurusan ? ` ${ped.jurusan}` : ""} · ${ped.namaSekolah ?? ""} (${ped.tahunLulus ?? "—"})` : "—",
        mapel: g.mapelDiampu.map((m) => m.namaMapel).join(", ") || "—", wali: g.rombelWali[0]?.nama ?? null, kelasMapel: g.mapelDiampu.map((m) => m.namaMapel).join(", ") || "—",
        sekolah: sekolah?.nama ?? "Sekolah", alamatSekolah: sekolah?.alamat ?? "—", npsn: sekolah?.npsnDinas ?? "—", telepon: sekolah?.telepon ?? "—",
        kepala: sekolah?.kepalaSekolah ?? "—", nipKepala: sekolah?.nipKepala ?? "—",
        noSK, ta, tanggalTerbit: now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
        kota: (sekolah?.alamat ?? "Bandung").split(",").slice(-1)[0].trim() || "Bandung",
      }}
    />
  );
}
