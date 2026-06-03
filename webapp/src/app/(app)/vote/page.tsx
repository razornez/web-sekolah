import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { castVote } from "./actions";

export default async function VotePage() {
  const user = await getCurrentUser();
  if (isStaff(user.role)) redirect("/osis");

  const sekolahId = user.sekolahId ?? -1;
  const siswa =
    user.role === "siswa"
      ? await prisma.siswa.findFirst({ where: { userId: user.id, sekolahId }, select: { id: true } })
      : null;

  if (!siswa) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Pemilihan OSIS</h1>
        <p className="text-gray-500">Hanya siswa yang dapat memberikan suara.</p>
      </div>
    );
  }

  const [calon, suara] = await Promise.all([
    prisma.calonOsis.findMany({ where: { sekolahId }, orderBy: { noUrut: "asc" } }),
    prisma.votePemilihan.findUnique({ where: { sekolahId_siswaId: { sekolahId, siswaId: siswa.id } }, select: { calonId: true } }),
  ]);
  const sudahMemilih = !!suara;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pemilihan OSIS</h1>
        {sudahMemilih
          ? <p className="text-green-700">✓ Anda sudah memberikan suara. Terima kasih.</p>
          : <p className="text-gray-500">Pilih satu kandidat. Suara tidak dapat diubah.</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calon.length === 0 && <p className="text-sm text-gray-400">Belum ada kandidat.</p>}
        {calon.map((c) => {
          const dipilih = suara?.calonId === c.id;
          return (
            <div key={c.id} className={`rounded-lg border p-4 ${dipilih ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div className="text-xs text-gray-400">No. Urut {c.noUrut}</div>
              <div className="font-medium text-gray-900">{c.namaKetua}</div>
              {c.namaWakil && <div className="text-sm text-gray-600">& {c.namaWakil}</div>}
              {c.visi && <p className="mt-2 text-sm text-gray-600">{c.visi}</p>}
              {!sudahMemilih && (
                <form action={castVote} className="mt-3">
                  <input type="hidden" name="calonId" value={c.id} />
                  <button className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
                    Pilih
                  </button>
                </form>
              )}
              {dipilih && <div className="mt-3 text-center text-sm font-medium text-green-700">Pilihan Anda</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
