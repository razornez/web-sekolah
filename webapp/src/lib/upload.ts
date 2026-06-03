import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Simpan gambar ke public/uploads (dev / self-hosted Node).
 *
 * CATATAN PRODUKSI (Vercel): filesystem serverless bersifat read-only/ephemeral,
 * jadi untuk produksi ganti implementasi ini ke object storage
 * (Supabase Storage / Vercel Blob / S3). Cukup ubah fungsi ini sebagai satu titik.
 */
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX = 2 * 1024 * 1024; // 2 MB

export async function saveImage(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) throw new Error("File kosong.");
  if (!ALLOWED.includes(file.type)) throw new Error("Format harus JPG, PNG, atau WebP.");
  if (file.size > MAX) throw new Error("Ukuran maksimal 2 MB.");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);

  return `/uploads/${safeFolder}/${name}`;
}
