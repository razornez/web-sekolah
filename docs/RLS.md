# Row-Level Security (RLS) — Isolasi Multi-Tenant

## Status saat ini

Isolasi antar-sekolah **sudah ditegakkan di lapisan aplikasi**:
- Setiap query Prisma menyaring `sekolahId` (diambil dari sesi via `getSekolahId()` / `requireStaff()` / `requireModule()`).
- Setiap server action memvalidasi kepemilikan tenant sebelum tulis/hapus.
- Akses back-office dibatasi per-role ([lib/permissions.ts](../webapp/src/lib/permissions.ts)).

RLS di database adalah **lapisan pertahanan tambahan** (defense-in-depth) terhadap akses langsung ke DB di luar aplikasi. Script kebijakannya sudah disiapkan di [webapp/prisma/rls.sql](../webapp/prisma/rls.sql) namun **belum diaktifkan** pada dev — lihat alasan & cara aktivasi di bawah.

> ⚠️ **Jangan jalankan `rls.sql` tanpa menyelesaikan langkah "wiring" di bawah.** Jika RLS di-`FORCE` sementara aplikasi belum men-set `app.current_sekolah` per koneksi, semua query akan mengembalikan 0 baris → aplikasi rusak.

## Cara mengaktifkan (saat siap)

### 1. Role koneksi
Aplikasi konek sebagai role non-superuser tanpa `BYPASSRLS` (mis. `websekolah`). Operasi lintas-sekolah (superadmin/migrasi) memakai koneksi service terpisah yang `BYPASSRLS`.

### 2. Terapkan kebijakan
```bash
psql "$DATABASE_URL" -f webapp/prisma/rls.sql
```
Kebijakan memakai GUC `app.current_sekolah` via fungsi `current_sekolah_id()`.

### 3. Wiring tenant-context ke Prisma (WAJIB)
Set `app.current_sekolah` per request memakai `AsyncLocalStorage` + transaksi. Contoh:

```ts
// lib/tenant.ts
import { AsyncLocalStorage } from "node:async_hooks";
export const tenantStore = new AsyncLocalStorage<number>();

// lib/prisma.ts — extension
export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      const sekolahId = tenantStore.getStore();
      if (sekolahId == null) return query(args);
      // jalankan dalam transaksi yang men-set GUC lebih dulu
      return base.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_sekolah', $1, true)`, String(sekolahId));
        return query(args); // catatan: butuh penyesuaian agar query memakai tx
      });
    },
  },
});
```
Lalu set tenant di awal request (server component/layout atau proxy): `tenantStore.run(sekolahId, () => ...)`.

> Karena setiap query aplikasi **sudah** menyaring `sekolahId`, wiring ini bersifat opsional/hardening dan dapat ditambahkan tanpa mengubah logika modul.

### Alternatif: Supabase Auth
Bila deploy di Supabase dan memakai Supabase Auth, kebijakan bisa membaca `auth.jwt() ->> 'sekolah_id'` alih-alih GUC — lihat komentar di `rls.sql`.

## Rekomendasi
Untuk rilis awal, cukup andalkan penegakan di kode (sudah aktif) + akses DB dibatasi kredensial. Aktifkan RLS saat aplikasi melayani banyak sekolah pada satu DB produksi dan ingin jaminan di level database.
