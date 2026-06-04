import { Prisma } from "@prisma/client";

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Pesan error yang jelas untuk kesalahan relasi Prisma.
 * Mapping field name → pesan Indonesia yang informatif.
 */
const RELATION_MESSAGES: Record<string, string> = {
  // Guru
  "mapel_guru_id_fkey":       "Guru ini masih menjadi pengampu mata pelajaran. Hapus/pindah pengampu mapel terlebih dahulu.",
  "jadwal_guru_guru_id_fkey": "Guru ini masih memiliki jadwal mengajar. Hapus jadwal terlebih dahulu.",
  "rombel_wali_guru_id_fkey": "Guru ini masih menjadi wali kelas. Ganti wali kelas rombel terlebih dahulu.",
  "jurnal_guru_guru_id_fkey": "Guru ini memiliki jurnal mengajar. Hapus jurnal terlebih dahulu.",
  // Mapel
  "nilai_rapor_mapel_id_fkey":    "Mapel ini memiliki data nilai rapor siswa. Hapus nilai terlebih dahulu.",
  "entri_nilai_mapel_id_fkey":    "Mapel ini memiliki data entri nilai. Hapus entri nilai terlebih dahulu.",
  "komponen_nilai_mapel_id_fkey": "Mapel ini memiliki komponen penilaian. Hapus komponen terlebih dahulu.",
  // Rombel
  "anggota_rombel_rombel_id_fkey":  "Rombel ini masih memiliki anggota siswa. Keluarkan semua anggota terlebih dahulu.",
  "nilai_rapor_rombel_id_fkey":     "Rombel ini memiliki data nilai rapor. Hapus nilai terlebih dahulu.",
  "jadwal_rombel_id_fkey":          "Rombel ini memiliki jadwal pelajaran. Hapus jadwal terlebih dahulu.",
  "entri_nilai_rombel_id_fkey":     "Rombel ini memiliki data entri nilai. Hapus entri nilai terlebih dahulu.",
  // Kategori sarpras
  "sarpras_kategori_id_fkey": "Kategori ini masih digunakan oleh beberapa item sarpras. Pindahkan item ke kategori lain terlebih dahulu.",
  // Kategori kasus (BK)
  "kasus_siswa_kategori_id_fkey": "Kategori ini sudah digunakan dalam pencatatan pelanggaran.",
  // Jalur PPDB
  "pendaftaran_ppdb_jalur_id_fkey": "Jalur ini masih digunakan oleh pendaftar. Pindahkan pendaftar ke jalur lain terlebih dahulu.",
  // Periode
  "nilai_rapor_periode_id_fkey": "Periode ini memiliki data nilai rapor. Tidak bisa dihapus.",
  "entri_nilai_periode_id_fkey": "Periode ini memiliki data entri nilai. Tidak bisa dihapus.",
  // Tahun ajaran
  "rombel_tahun_ajaran_id_fkey": "Tahun ajaran ini memiliki rombel. Hapus rombel terlebih dahulu.",
  "periode_tahun_ajaran_id_fkey": "Tahun ajaran ini memiliki periode. Hapus periode terlebih dahulu.",
};

/**
 * Tangkap error Prisma saat delete dan kembalikan pesan yang informatif.
 * Gunakan di server action delete:
 *
 *   try {
 *     await prisma.model.deleteMany(...)
 *     return { ok: true }
 *   } catch (e) {
 *     return catchDeleteError(e, "Nama Model")
 *   }
 */
export function catchDeleteError(e: unknown, entityName = "Data"): DeleteResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003" || e.code === "P2014") {
      const meta = e.meta as { field_name?: string; relation_name?: string } | undefined;
      const field = meta?.field_name ?? meta?.relation_name ?? "";

      // Cari pesan spesifik
      const specificMsg = Object.entries(RELATION_MESSAGES).find(([key]) =>
        field.toLowerCase().includes(key.toLowerCase()),
      )?.[1];

      const msg = specificMsg ??
        `${entityName} tidak bisa dihapus karena masih ada data lain yang bergantung padanya. Hapus data terkait terlebih dahulu.`;

      return { ok: false, error: msg };
    }

    if (e.code === "P2025") {
      return { ok: false, error: `${entityName} tidak ditemukan atau sudah dihapus.` };
    }
  }

  // Re-throw error yang tidak dikenali
  throw e;
}
