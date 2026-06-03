/**
 * ETL: migrasi data dari MySQL lama (`smartschool`) → Postgres baru (Prisma).
 *
 * Semua data lama dipetakan ke SATU sekolah (tenant) karena sistem lama
 * single-school. Password MD5 dipertahankan apa adanya + flag passwordLegacyMd5,
 * lalu otomatis di-upgrade ke bcrypt saat user login pertama (lihat src/auth.ts).
 *
 * Prasyarat: MySQL XAMPP jalan & DB `smartschool` ada; Postgres lokal jalan.
 * Jalankan : npm run etl
 * Idempoten: aman dijalankan ulang (semua tulis pakai upsert by natural key).
 */
import mysql from "mysql2/promise";
import {
  PrismaClient,
  Role,
  Jenjang,
  Kurikulum,
  JenisKelamin,
  KelompokMapel,
  JenisPeriode,
} from "@prisma/client";

const prisma = new PrismaClient();

const SEKOLAH_SLUG = process.env.ETL_SEKOLAH_SLUG ?? "smartschool";
const TAHUN_AJARAN = process.env.ETL_TAHUN_AJARAN ?? "2024/2025";

// ---- helper map ----------------------------------------------------------
const ROLE_MAP: Record<string, Role> = {
  admin: Role.admin,
  operator: Role.operator,
  kepsek: Role.kepsek,
  humas: Role.humas,
  kurikulum: Role.kurikulum,
  kesiswaan: Role.kesiswaan,
  guru: Role.guru,
  walikelas: Role.walikelas,
  bk: Role.bk,
  bendahara: Role.bendahara,
  resepsionis: Role.resepsionis,
  perpustakaan: Role.perpustakaan,
  sarpras: Role.sarpras,
};
const mapRole = (r?: string | null, fallback: Role = Role.operator): Role =>
  ROLE_MAP[(r ?? "").toLowerCase().trim()] ?? fallback;

const mapJk = (v?: string | null): JenisKelamin | null => {
  const s = (v ?? "").toUpperCase().trim();
  if (s === "L" || s.startsWith("LAKI")) return JenisKelamin.L;
  if (s === "P" || s.startsWith("PEREMPUAN")) return JenisKelamin.P;
  return null;
};

const mapKelompok = (v?: string | null): KelompokMapel => {
  const s = (v ?? "").toUpperCase().trim();
  if (s === "A") return KelompokMapel.A;
  if (s === "B") return KelompokMapel.B;
  if (s === "C") return KelompokMapel.C;
  if (s.includes("LINTAS")) return KelompokMapel.lintasminat;
  if (s.includes("LOKAL")) return KelompokMapel.muatanlokal;
  return KelompokMapel.A;
};

const ROMAN: Record<string, number> = {
  VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
};
const tingkatUrutan = (nama: string, idx: number): number => {
  const s = (nama ?? "").toUpperCase().trim();
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return n;
  if (ROMAN[s]) return ROMAN[s];
  return 90 + idx; // fallback agar tetap unik
};

const parseDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};
const clean = (v: unknown): string | null => {
  const s = (v == null ? "" : String(v)).trim();
  return s === "" ? null : s;
};
const toInt = (v: unknown): number | null => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? null : n;
};

// password lama (md5). Jika kosong → akun tanpa password yang diketahui (legacy=false).
const legacyPwd = (md5?: string | null) => {
  const h = (md5 ?? "").trim();
  return h
    ? { passwordHash: h, passwordLegacyMd5: true }
    : { passwordHash: "!disabled!", passwordLegacyMd5: false };
};

const stats: Record<string, number> = {};
const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n);

async function main() {
  console.log("ETL mulai…");
  const my = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? "localhost",
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DB ?? "smartschool",
  });
  const q = async <T = any>(sql: string): Promise<T[]> =>
    (await my.query(sql))[0] as T[];

  // 1) SEKOLAH (dari profil) ------------------------------------------------
  const [profil] = await q<any>("SELECT * FROM profil LIMIT 1");
  const sekolah = await prisma.sekolah.upsert({
    where: { slug: SEKOLAH_SLUG },
    update: {},
    create: {
      slug: SEKOLAH_SLUG,
      npsn: clean(profil?.npsn),
      nama: clean(profil?.nama_lembaga) ?? "Sekolah Hasil Migrasi",
      jenjang: (process.env.ETL_JENJANG as Jenjang) ?? Jenjang.SMA,
      kurikulumDefault: Kurikulum.MERDEKA,
      alamat: clean(profil?.alamat_lembaga),
      telepon: clean(profil?.notelp),
      email: clean(profil?.email),
      website: clean(profil?.alamatwebsite),
      kepalaSekolah: clean(profil?.nama_kepsek),
      nipKepala: clean(profil?.nip_kepsek),
      logo: clean(profil?.logo),
    },
  });
  bump("sekolah");
  const sekolahId = sekolah.id;

  // 2) TAHUN AJARAN + PERIODE ----------------------------------------------
  const ta = await prisma.tahunAjaran.upsert({
    where: { sekolahId_tahun: { sekolahId, tahun: TAHUN_AJARAN } },
    update: { aktif: true },
    create: { sekolahId, tahun: TAHUN_AJARAN, aktif: true },
  });
  await prisma.periode.upsert({
    where: { tahunAjaranId_urutan: { tahunAjaranId: ta.id, urutan: 1 } },
    update: {},
    create: { tahunAjaranId: ta.id, nama: "Semester Ganjil", jenis: JenisPeriode.semester, urutan: 1, aktif: true },
  });

  // 3) TINGKAT + ROMBEL (dari kelas) ---------------------------------------
  const kelasRows = await q<any>("SELECT * FROM kelas");
  const tingkatNames = [...new Set(kelasRows.map((k) => String(k.tingkat_kelas ?? "").trim()).filter(Boolean))];
  const tingkatMap = new Map<string, number>();
  for (let i = 0; i < tingkatNames.length; i++) {
    const nama = tingkatNames[i];
    const t = await prisma.tingkat.upsert({
      where: { sekolahId_urutan: { sekolahId, urutan: tingkatUrutan(nama, i) } },
      update: { nama },
      create: { sekolahId, nama, urutan: tingkatUrutan(nama, i) },
    });
    tingkatMap.set(nama, t.id);
    bump("tingkat");
  }
  const rombelByKode = new Map<string, number>(); // kode_kelas → rombelId
  for (const k of kelasRows) {
    const tnama = String(k.tingkat_kelas ?? "").trim();
    const tingkatId = tingkatMap.get(tnama) ?? [...tingkatMap.values()][0];
    if (!tingkatId) continue;
    const r = await prisma.rombel.upsert({
      where: { tahunAjaranId_nama: { tahunAjaranId: ta.id, nama: String(k.nama_kelas) } },
      update: { kodeKelas: clean(k.kode_kelas) },
      create: {
        sekolahId,
        tahunAjaranId: ta.id,
        tingkatId,
        nama: String(k.nama_kelas),
        kodeKelas: clean(k.kode_kelas),
      },
    });
    if (k.kode_kelas) rombelByKode.set(String(k.kode_kelas), r.id);
    bump("rombel");
  }

  // 4) MAPEL (dari rapormapel) ---------------------------------------------
  for (const m of await q<any>("SELECT * FROM rapormapel")) {
    const kode = clean(m.kode_mapel) ?? `MAPEL-${m.id_rapormapel}`;
    await prisma.mapel.upsert({
      where: { sekolahId_kodeMapel: { sekolahId, kodeMapel: kode } },
      update: {},
      create: {
        sekolahId,
        kodeMapel: kode,
        namaMapel: clean(m.nama_mapel) ?? kode,
        kelompok: mapKelompok(m.kelompok_mapel),
        kkm: toInt(m.kkm) ?? 0,
        noUrut: toInt(m.no_urut),
      },
    });
    bump("mapel");
  }

  // 5) STAFF (tbl_users) ----------------------------------------------------
  for (const u of await q<any>("SELECT * FROM tbl_users")) {
    const username = clean(u.username);
    if (!username) continue;
    await prisma.user.upsert({
      where: { sekolahId_username: { sekolahId, username } },
      update: {},
      create: {
        sekolahId,
        username,
        email: clean(u.email),
        namaLengkap: clean(u.nama_user) ?? username,
        role: mapRole(u.role, Role.operator),
        noTelp: clean(u.notelp),
        ...legacyPwd(u.password),
      },
    });
    bump("user_staff");
  }

  // 6) GURU (+ akun) --------------------------------------------------------
  for (const g of await q<any>("SELECT * FROM guru")) {
    const username = clean(g.username) ?? `guru-${g.id_guru}`;
    const user = await prisma.user.upsert({
      where: { sekolahId_username: { sekolahId, username } },
      update: {},
      create: {
        sekolahId,
        username,
        email: clean(g.email),
        namaLengkap: clean(g.nama_guru) ?? username,
        role: mapRole(g.role, Role.guru),
        noTelp: clean(g.notelp),
        foto: clean(g.foto_guru),
        ...legacyPwd(g.password),
      },
    });
    await prisma.guru.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        sekolahId,
        userId: user.id,
        nip: clean(g.nip),
        namaGuru: clean(g.nama_guru) ?? username,
        jenisKelamin: mapJk(g.jeniskelamin) ?? JenisKelamin.L,
        alamat: clean(g.alamat),
        email: clean(g.email),
        noTelp: clean(g.notelp),
        foto: clean(g.foto_guru),
        pangkat: clean(g.pangkat),
        golongan: clean(g.golongan),
      },
    });
    bump("guru");
  }

  // 7) SISWA (pendaftar) + ortu + enrollment -------------------------------
  const pendaftar = await q<any>("SELECT * FROM pendaftar");
  let i = 0;
  for (const p of pendaftar) {
    i++;
    try {
      const username = clean(p.username) ?? clean(p.nis) ?? `siswa-${p.id_pendaftar}`;
      const user = await prisma.user.upsert({
        where: { sekolahId_username: { sekolahId, username } },
        update: {},
        create: {
          sekolahId,
          username,
          email: clean(p.email),
          namaLengkap: clean(p.nama_lengkap) ?? username,
          role: Role.siswa,
          noTelp: clean(p.siswa_nohp),
          ...legacyPwd(p.password),
        },
      });

      const siswa = await prisma.siswa.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          sekolahId,
          userId: user.id,
          nis: clean(p.nis),
          nisn: clean(p.nisn),
          nik: clean(p.nik),
          namaLengkap: clean(p.nama_lengkap) ?? username,
          tempatLahir: clean(p.tempatlahir),
          tanggalLahir: parseDate(p.tanggallahir),
          jenisKelamin: mapJk(p.jeniskelamin),
          agama: clean(p.agama),
          alamat: clean(p.siswa_alamat),
          desaKel: clean(p.siswa_desakel),
          kecamatan: clean(p.siswa_kecamatan),
          kabupaten: clean(p.siswa_kabupaten),
          provinsi: clean(p.siswa_provinsi),
          kodePos: clean(p.siswa_kodepos),
          noHp: clean(p.siswa_nohp),
          asalSekolah: clean(p.asal_sekolah),
        },
      });
      bump("siswa");

      // Orang tua / wali
      for (const [tipe, nama, nik, pekerjaan, alamat, nohp] of [
        ["ayah", p.ayah_nama, p.ayah_nik, p.ayah_pekerjaan, p.ayah_alamat, p.ayah_nohp],
        ["ibu", p.ibu_nama, p.ibu_nik, p.ibu_pekerjaan, p.ibu_alamat, p.ibu_nohp],
        ["wali", p.wali_nama, p.wali_nik, p.wali_pekerjaan, p.wali_alamat, p.wali_nohp],
      ] as const) {
        if (!clean(nama)) continue;
        await prisma.orangTuaWali.upsert({
          where: { siswaId_tipe: { siswaId: siswa.id, tipe } },
          update: {},
          create: {
            siswaId: siswa.id,
            tipe,
            nama: String(nama),
            nik: clean(nik),
            pekerjaan: clean(pekerjaan),
            alamat: clean(alamat),
            noHp: clean(nohp),
          },
        });
        bump("ortu");
      }

      // Enrollment (rombel via kode kelas)
      const rombelId = rombelByKode.get(String(p.siswa_kelas));
      if (rombelId) {
        await prisma.anggotaRombel.upsert({
          where: { rombelId_siswaId: { rombelId, siswaId: siswa.id } },
          update: { nomorAbsen: toInt(p.siswa_nomorabsen) },
          create: { rombelId, siswaId: siswa.id, nomorAbsen: toInt(p.siswa_nomorabsen) },
        });
        bump("enrollment");
      }
    } catch (e) {
      bump("siswa_error");
      if (stats.siswa_error <= 5) console.warn(`  ! siswa #${p.id_pendaftar}:`, (e as Error).message);
    }
    if (i % 200 === 0) console.log(`  …siswa ${i}/${pendaftar.length}`);
  }

  await my.end();
  console.log("\n=== Ringkasan ETL ===");
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`);
  console.log("Selesai ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
