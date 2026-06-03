import Link from "next/link";
import { requireModule } from "@/lib/permissions";
import PengumumanForm from "../_components/PengumumanForm";

export default async function NewPengumumanPage() {
  await requireModule("pengumuman");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Buat Pengumuman Baru</h1>
        <Link href="/pengumuman" className="text-sm text-gray-500 hover:text-gray-900">← Kembali</Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <PengumumanForm />
      </div>
    </div>
  );
}
