import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { PageGuide } from "@/components/PageGuide";

const PER = 25;
const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-green-100 text-green-700",
  lulus: "bg-blue-100 text-blue-700",
  pindah: "bg-amber-100 text-amber-700",
  keluar: "bg-red-100 text-red-700",
  alumni: "bg-purple-100 text-purple-700",
};

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; gender?: string; agama?: string; rombelId?: string; tahunMasuk?: string; page?: string }>;
}) {
  const sekolahId = await requireModule("siswa");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const gender = sp.gender ?? "";
  const agama = sp.agama ?? "";
  const rombelId = Number(sp.rombelId) || 0;
  const tahunMasuk = Number(sp.tahunMasuk) || 0;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.SiswaWhereInput = {
    sekolahId, deletedAt: null,
    ...(q ? { OR: [{ namaLengkap: { contains: q, mode: "insensitive" } }, { nisn: { contains: q } }, { nis: { contains: q } }] } : {}),
    ...(status ? { status: status as Prisma.EnumStatusSiswaFilter["equals"] } : {}),
    ...(gender === "L" || gender === "P" ? { jenisKelamin: gender as "L" | "P" } : {}),
    ...(agama ? { agama: { contains: agama, mode: "insensitive" } } : {}),
    ...(tahunMasuk ? { tahunMasuk } : {}),
    ...(rombelId ? { anggotaRombel: { some: { rombelId } } } : {}),
  };

  const [total, rows, rombelOpts, agamaOpts, tahunOpts, arsipCount] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({ where, orderBy: { namaLengkap: "asc" }, skip: (page - 1) * PER, take: PER, include: { anggotaRombel: { include: { rombel: { select: { nama: true } } }, take: 1, orderBy: { id: "desc" } } } }),
    prisma.rombel.findMany({ where: { sekolahId }, orderBy: [{ tahunAjaran: { tahun: "desc" } }, { tingkat: { urutan: "asc" } }, { nama: "asc" }], include: { tahunAjaran: { select: { tahun: true, aktif: true } }, tingkat: { select: { nama: true } } }, take: 100 }),
    prisma.siswa.findMany({ where: { sekolahId, deletedAt: null, agama: { not: null } }, distinct: ["agama"], select: { agama: true }, orderBy: { agama: "asc" } }),
    prisma.siswa.findMany({ where: { sekolahId, deletedAt: null, tahunMasuk: { not: null } }, distinct: ["tahunMasuk"], select: { tahunMasuk: true }, orderBy: { tahunMasuk: "desc" } }),
    prisma.siswa.count({ where: { sekolahId, deletedAt: { not: null } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER));
  const bld = (ov: Record<string, string | number>) => {
    const p = new URLSearchParams({ q, status, gender, agama, rombelId: String(rombelId || ""), tahunMasuk: String(tahunMasuk || ""), page: "1", ...Object.fromEntries(Object.entries(ov).map(([k, v]) => [k, String(v)])) });
    return `/siswa?${p.toString()}`;
  };

  // Group rombel by tingkat → nested optgroup
  const rombelByTingkat = rombelOpts.reduce<Record<string, typeof rombelOpts>>((acc, r) => {
    const key = `${r.tingkat.nama} — TA ${r.tahunAjaran.tahun}${r.tahunAjaran.aktif ? " ✓" : ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <PageGuide
        icon="👥"
        title="Data Siswa"
        description="Kelola seluruh data siswa aktif. Gunakan filter untuk mempersempit pencarian berdasarkan kelas, status, jenis kelamin, agama, atau tahun masuk."
        tips={[
          "Filter Kelas: tampilkan hanya siswa di kelas tertentu.",
          "Filter Status: pisahkan siswa aktif, lulus, pindah, atau alumni.",
          "Klik nama siswa untuk melihat/edit detail lengkap termasuk biodata, nilai, dan akun login.",
          "Tombol Hapus akan membuka halaman konfirmasi — data tidak langsung dihapus permanen.",
          "Siswa yang diarsipkan tersimpan di halaman Arsip dan bisa dipulihkan.",
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Siswa</h1>
          <p className="text-sm text-gray-500">
            {total.toLocaleString("id-ID")} siswa aktif
            {arsipCount > 0 && <Link href="/siswa/arsip" className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200">🗑 {arsipCount} arsip</Link>}
          </p>
        </div>
        <Link href="/siswa/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">+ Tambah Siswa</Link>
      </div>

      {/* Filter */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <form className="flex gap-2">
          <input type="hidden" name="status" value={status} /><input type="hidden" name="gender" value={gender} /><input type="hidden" name="agama" value={agama} /><input type="hidden" name="rombelId" value={rombelId || ""} /><input type="hidden" name="tahunMasuk" value={tahunMasuk || ""} />
          <input name="q" defaultValue={q} placeholder="Cari nama, NISN, NIS…" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cari</button>
          {(q||status||gender||agama||rombelId||tahunMasuk) && <Link href="/siswa" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Reset</Link>}
        </form>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-gray-500">Status:</span>
            {["","aktif","lulus","pindah","keluar","alumni"].map((s) => <Link key={s} href={bld({ status: s })} className={`rounded-full border px-2.5 py-0.5 text-xs ${status===s?"border-gray-900 bg-gray-900 text-white":"border-gray-200 hover:bg-gray-50"}`}>{s===""?"Semua":s.charAt(0).toUpperCase()+s.slice(1)}</Link>)}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">JK:</span>
            {["","L","P"].map((g) => <Link key={g} href={bld({ gender: g })} className={`rounded-full border px-2.5 py-0.5 text-xs ${gender===g?"border-gray-900 bg-gray-900 text-white":"border-gray-200 hover:bg-gray-50"}`}>{g===""?"Semua":g==="L"?"♂ L":"♀ P"}</Link>)}
          </div>
        </div>

        <form className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="q" value={q} /><input type="hidden" name="status" value={status} /><input type="hidden" name="gender" value={gender} />
          <div>
            <label className="block text-xs text-gray-500">Kelas/Rombel</label>
            <select name="rombelId" defaultValue={rombelId||""} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm min-w-[200px]">
              <option value="">— Semua Kelas —</option>
              {Object.entries(rombelByTingkat).map(([group, rombels]) => (
                <optgroup key={group} label={group}>
                  {rombels.map((r) => (
                    <option key={r.id} value={r.id}>{r.nama}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Agama</label>
            <select name="agama" defaultValue={agama} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">Semua agama</option>
              {agamaOpts.filter((a)=>a.agama).map((a) => <option key={a.agama} value={a.agama!}>{a.agama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Tahun Masuk</label>
            <select name="tahunMasuk" defaultValue={tahunMasuk||""} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">Semua tahun</option>
              {tahunOpts.filter((t)=>t.tahunMasuk).map((t) => <option key={t.tahunMasuk} value={t.tahunMasuk!}>{t.tahunMasuk}</option>)}
            </select>
          </div>
          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">Filter</button>
        </form>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">NISN / NIS</th>
              <th className="px-4 py-2 font-medium">JK</th>
              <th className="px-4 py-2 font-medium">Kelas</th>
              <th className="px-4 py-2 font-medium">Agama</th>
              <th className="px-4 py-2 font-medium">Masuk</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada siswa.</td></tr>}
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900"><Link href={`/siswa/${s.id}`} className="hover:underline">{s.namaLengkap}</Link></td>
                <td className="px-4 py-2"><div className="text-xs text-gray-600">{s.nisn ?? "—"}</div><div className="text-xs text-gray-400">{s.nis ?? ""}</div></td>
                <td className="px-4 py-2">{s.jenisKelamin==="L"?<span className="text-blue-600">♂</span>:s.jenisKelamin==="P"?<span className="text-pink-600">♀</span>:<span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2 text-gray-600">{s.anggotaRombel[0]?.rombel.nama ?? "—"}</td>
                <td className="px-4 py-2 text-gray-600">{s.agama ?? "—"}</td>
                <td className="px-4 py-2 text-gray-600">{s.tahunMasuk ?? "—"}</td>
                <td className="px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_BADGE[s.status]??STATUS_BADGE.aktif}`}>{s.status}</span></td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/siswa/${s.id}`} className="text-gray-600 hover:underline">Profil</Link>
                    <Link href={`/siswa/${s.id}/delete`} className="text-red-600 hover:underline">Hapus</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            {page>1&&<Link href={bld({page:String(page-1)})} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">← Sebelumnya</Link>}
            {page<totalPages&&<Link href={bld({page:String(page+1)})} className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100">Selanjutnya →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
