import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  // slug sekolah opsional (untuk multi-tenant; bisa diisi via subdomain nanti)
  sekolah: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// String kosong dari form -> null.
const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;
const optStr = z.preprocess(emptyToNull, z.string().trim().nullable());

export const siswaSchema = z.object({
  namaLengkap: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  nisn: optStr,
  nis: optStr,
  nik: optStr,
  jenisKelamin: z.preprocess(emptyToNull, z.enum(["L", "P"]).nullable()),
  tempatLahir: optStr,
  tanggalLahir: optStr, // string "YYYY-MM-DD" dari input date
  agama: optStr,
  alamat: optStr,
  noHp: optStr,
  status: z
    .enum(["aktif", "lulus", "pindah", "keluar", "alumni"])
    .default("aktif"),
});

export type SiswaInput = z.infer<typeof siswaSchema>;

export const guruSchema = z.object({
  namaGuru: z.string().trim().min(1, "Nama guru wajib diisi"),
  nip: optStr,
  npk: optStr,
  nuptk: optStr,
  nik: optStr,
  jenisKelamin: z.preprocess(emptyToNull, z.enum(["L", "P"])),
  tempatLahir: optStr,
  tanggalLahir: optStr,
  alamat: optStr,
  email: optStr,
  noTelp: optStr,
  pangkat: optStr,
  golongan: optStr,
  jenisJabatan: optStr,
  statusGuru: optStr,
});

export type GuruInput = z.infer<typeof guruSchema>;

export const rombelSchema = z.object({
  nama: z.string().trim().min(1, "Nama rombel wajib diisi"),
  kodeKelas: optStr,
  tahunAjaranId: z.coerce.number().int().positive("Pilih tahun ajaran"),
  tingkatId: z.coerce.number().int().positive("Pilih tingkat"),
  waliGuruId: z.preprocess(
    emptyToNull,
    z.coerce.number().int().positive().nullable(),
  ),
});

export type RombelInput = z.infer<typeof rombelSchema>;

export const mapelSchema = z.object({
  namaMapel: z.string().trim().min(1, "Nama mapel wajib diisi"),
  kodeMapel: z.string().trim().min(1, "Kode mapel wajib diisi"),
  kelompok: z.enum(["A", "B", "C", "lintasminat", "muatanlokal"]),
  fase: z.preprocess(emptyToNull, z.enum(["A", "B", "C", "D", "E", "F"]).nullable()),
  kkm: z.coerce.number().int().min(0).max(100).default(0),
  noUrut: z.preprocess(emptyToNull, z.coerce.number().int().nullable()),
  guruId: z.preprocess(
    emptyToNull,
    z.coerce.number().int().positive().nullable(),
  ),
});
export type MapelInput = z.infer<typeof mapelSchema>;

export const jenisPembayaranSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  nominal: z.coerce.number().int().min(0).default(0),
  keterangan: optStr,
});

export const tagihanSchema = z.object({
  siswaId: z.coerce.number().int().positive(),
  jenisId: z.coerce.number().int().positive("Pilih jenis pembayaran"),
  bulan: z.coerce.number().int().min(1).max(12),
  tahun: z.coerce.number().int().min(2000).max(2100),
  nominal: z.coerce.number().int().min(0).default(0),
});

export const akunSchema = z.object({
  username: z.string().trim().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const kategoriKasusSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  poin: z.coerce.number().int().min(0).default(0),
});

export const kasusSchema = z.object({
  siswaId: z.coerce.number().int().positive(),
  kategoriId: z.preprocess(
    emptyToNull,
    z.coerce.number().int().positive().nullable(),
  ),
  namaKasus: optStr,
  poin: z.coerce.number().int().min(0).default(0),
  tanggal: optStr,
  keterangan: optStr,
});
