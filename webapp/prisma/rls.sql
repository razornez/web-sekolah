-- =============================================================================
-- Row-Level Security (RLS) — Isolasi data multi-tenant per `sekolah_id`
-- =============================================================================
-- TEMPLATE. Diterapkan SETELAH `prisma migrate`/`db push`, dan difinalkan saat
-- integrasi Auth (cara meng-set tenant context bergantung mekanisme auth):
--   * Supabase Auth  : pakai `auth.jwt() ->> 'sekolah_id'` di policy.
--   * Auth.js custom  : set per-koneksi via `SET app.current_sekolah = '<id>'`
--                       lalu policy membaca `current_setting('app.current_sekolah')`.
--
-- Di bawah ini pola dengan GUC `app.current_sekolah` (portable, non-Supabase).
-- Jalankan untuk SETIAP tabel ber-kolom sekolah_id. Tabel anak (tanpa sekolah_id)
-- terlindungi via FK cascade + policy parent, atau tambahkan sekolah_id bila perlu.
-- =============================================================================

-- Helper: ambil tenant aktif dari session (NULL jika belum di-set / superadmin).
CREATE OR REPLACE FUNCTION current_sekolah_id() RETURNS int
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_sekolah', true), '')::int
$$;

-- Pola policy untuk satu tabel tenant (ganti <tabel>):
--
--   ALTER TABLE <tabel> ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE <tabel> FORCE ROW LEVEL SECURITY;
--   CREATE POLICY tenant_isolation ON <tabel>
--     USING (sekolah_id = current_sekolah_id())
--     WITH CHECK (sekolah_id = current_sekolah_id());
--
-- Superadmin (current_sekolah_id() IS NULL) di-handle di layer aplikasi
-- (pakai koneksi service-role yang BYPASSRLS), bukan di policy ini.

-- Contoh penerapan pada tabel-tabel inti:
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','tahun_ajaran','tingkat','rombel','siswa','guru','mapel',
    'nilai_rapor','projek_p5','kasus_siswa','kategori_kasus','tagihan_spp',
    'jenis_pembayaran','buku_perpustakaan','pinjaman_buku','sarpras',
    'kategori_sarpras','pendaftaran_ppdb','jalur_ppdb','kelulusan',
    'calon_osis','vote_pemilihan','kehadiran_siswa','kehadiran_guru',
    'surat','tamu','buku_tamu','alumni','setting','tema'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (sekolah_id = current_sekolah_id())
        WITH CHECK (sekolah_id = current_sekolah_id());
    $f$, t);
  END LOOP;
END $$;
