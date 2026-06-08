import Link from "next/link";
import { requireModule } from "@/lib/permissions";

export default async function EmailLandingPage() {
  await requireModule("pengaturan");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email</h1>
        <p className="text-sm text-gray-500">Konfigurasi pengiriman email dan kelola template notifikasi.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/pengaturan/email/config"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all">
          <div className="text-3xl mb-3">⚙️</div>
          <div className="font-semibold text-gray-900 group-hover:text-indigo-700">Konfigurasi SMTP</div>
          <p className="mt-1 text-xs text-gray-500">Atur SMTP atau Resend khusus sekolah ini. Jika kosong, pakai konfigurasi platform.</p>
        </Link>
        <Link href="/pengaturan/email/template"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all">
          <div className="text-3xl mb-3">📝</div>
          <div className="font-semibold text-gray-900 group-hover:text-indigo-700">Template Email</div>
          <p className="mt-1 text-xs text-gray-500">Sesuaikan subject dan isi email notifikasi untuk sekolah ini.</p>
        </Link>
        <Link href="/pengaturan/email/log"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all">
          <div className="text-3xl mb-3">📋</div>
          <div className="font-semibold text-gray-900 group-hover:text-indigo-700">Log Pengiriman</div>
          <p className="mt-1 text-xs text-gray-500">Riwayat semua email yang dikirim atau gagal dikirim ke pengguna sekolah ini.</p>
        </Link>
      </div>
    </div>
  );
}
