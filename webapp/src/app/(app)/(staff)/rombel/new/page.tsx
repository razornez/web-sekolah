import { getSekolahId } from "@/lib/session";
import RombelForm from "../_components/RombelForm";
import { loadRombelOptions } from "../options";

export default async function NewRombelPage() {
  const sekolahId = await getSekolahId();
  const opts = await loadRombelOptions(sekolahId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Tambah Rombel</h1>
      <RombelForm {...opts} />
    </div>
  );
}
