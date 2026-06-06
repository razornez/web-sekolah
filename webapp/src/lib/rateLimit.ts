/**
 * Rate limiter in-memory sederhana untuk login (anti brute-force).
 *
 * Catatan produksi: ini per-instance (reset jika server restart / multi-instance).
 * Untuk deployment multi-instance gunakan store bersama (Redis/Upstash).
 * Untuk SIS skala sekolah single-instance, in-memory sudah memadai.
 */

type Entry = { count: number; first: number; blockedUntil?: number };

const attempts = new Map<string, Entry>();

const MAX_ATTEMPTS = 5; // gagal beruntun sebelum diblokir
const WINDOW_MS = 15 * 60 * 1000; // jendela hitung 15 menit
const BLOCK_MS = 15 * 60 * 1000; // durasi blokir 15 menit

/** true jika key sedang diblokir karena terlalu banyak percobaan gagal. */
export function isRateLimited(key: string): boolean {
  const e = attempts.get(key);
  if (!e?.blockedUntil) return false;
  if (Date.now() < e.blockedUntil) return true;
  // blokir kedaluwarsa → reset
  attempts.delete(key);
  return false;
}

/** Catat satu percobaan login gagal; blokir bila melebihi ambang. */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return;
  }
  e.count += 1;
  if (e.count >= MAX_ATTEMPTS) e.blockedUntil = now + BLOCK_MS;
}

/** Reset hitungan setelah login berhasil. */
export function clearAttempts(key: string): void {
  attempts.delete(key);
}
