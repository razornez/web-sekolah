import { getEmailConfigDecrypted } from "./actions";
import { ConfigForm } from "./ConfigForm";

export default async function EmailConfigPage() {
  const config = await getEmailConfigDecrypted();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Konfigurasi Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atur provider SMTP atau Resend untuk pengiriman email platform. Kredensial disimpan terenkripsi.
        </p>
      </div>

      {!process.env.EMAIL_ENCRYPTION_KEY && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <b>Perhatian:</b> <code>EMAIL_ENCRYPTION_KEY</code> belum diset di <code>.env</code>. Enkripsi belum aktif — jangan simpan kredensial nyata sebelum key ini tersedia.
        </div>
      )}

      <ConfigForm initial={config} />
    </div>
  );
}
