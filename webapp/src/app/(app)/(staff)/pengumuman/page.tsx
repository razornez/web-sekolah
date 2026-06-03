import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { createPengumuman, deletePengumuman } from "./actions";

const inCls = "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900";
const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function PengumumanPage() {
  const sekolahId = await requireModule("pengumuman");
  const rows = await prisma.pengumuman.findMany({
    where: { sekolahId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Pengumuman</h1>

      <form action={createPengumuman} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500">Judul</label>
            <input name="judul" required className={`${inCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Target</label>
            <select name="target" defaultValue="semua" className={inCls}>
              <option value="semua">Semua</option>
              <option value="staf">Staf</option>
              <option value="siswa">Siswa</option>
              <option value="ortu">Orang Tua</option>
            </select>
          </div>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            <input type="checkbox" name="pinned" /> Pin
          </label>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Isi</label>
          <textarea name="isi" required rows={3} className={`${inCls} w-full`} />
        </div>
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Terbitkan</button>
      </form>

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-gray-400">Belum ada pengumuman.</p>}
        {rows.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {p.pinned && <span className="mr-1 text-amber-600">📌</span>}
                  {p.judul}
                </div>
                <div className="text-xs text-gray-400">{fmt(p.createdAt)} · target: {p.target}</div>
              </div>
              <ConfirmDelete action={deletePengumuman} id={p.id} message={`Hapus pengumuman "${p.judul}"?`} />
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{p.isi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
