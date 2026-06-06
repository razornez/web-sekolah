import { describe, it, expect, vi } from "vitest";

// Mock dependency berat agar hanya logika RBAC murni yang diuji
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
  isStaff: (role: string) => !["siswa", "ortu"].includes(role),
}));

import { canAccess, canManageGuru, MODULE_KEYS } from "./permissions";

describe("canAccess — matrix RBAC", () => {
  it("admin/operator/kepsek akses SEMUA modul", () => {
    for (const role of ["admin", "operator", "kepsek"]) {
      for (const key of MODULE_KEYS) {
        expect(canAccess(role, key)).toBe(true);
      }
    }
  });

  it("bendahara HANYA spp", () => {
    expect(canAccess("bendahara", "spp")).toBe(true);
    expect(canAccess("bendahara", "siswa")).toBe(false);
    expect(canAccess("bendahara", "bk")).toBe(false);
    expect(canAccess("bendahara", "pengaturan")).toBe(false);
  });

  it("perpustakaan HANYA perpustakaan", () => {
    expect(canAccess("perpustakaan", "perpustakaan")).toBe(true);
    expect(canAccess("perpustakaan", "spp")).toBe(false);
    expect(canAccess("perpustakaan", "siswa")).toBe(false);
  });

  it("bk: siswa + bk, tapi bukan nilai/spp/mapel", () => {
    expect(canAccess("bk", "bk")).toBe(true);
    expect(canAccess("bk", "siswa")).toBe(true);
    expect(canAccess("bk", "nilai")).toBe(false);
    expect(canAccess("bk", "spp")).toBe(false);
  });

  it("guru: punya akses guru (read direktori) + mapel/nilai, bukan spp/audit/pengaturan", () => {
    expect(canAccess("guru", "guru")).toBe(true);
    expect(canAccess("guru", "nilai")).toBe(true);
    expect(canAccess("guru", "spp")).toBe(false);
    expect(canAccess("guru", "audit")).toBe(false);
    expect(canAccess("guru", "pengaturan")).toBe(false);
  });

  it("walikelas: kelulusan ya, guru/mapel tidak", () => {
    expect(canAccess("walikelas", "kelulusan")).toBe(true);
    expect(canAccess("walikelas", "guru")).toBe(false);
    expect(canAccess("walikelas", "mapel")).toBe(false);
  });

  it("role tak terdaftar = tidak akses apa pun", () => {
    expect(canAccess("hacker", "siswa")).toBe(false);
    expect(canAccess("siswa", "siswa")).toBe(false); // end-user, bukan staf
  });
});

describe("canManageGuru — kelola data master guru", () => {
  it("hanya admin/operator/kepsek/kurikulum", () => {
    expect(canManageGuru("admin")).toBe(true);
    expect(canManageGuru("operator")).toBe(true);
    expect(canManageGuru("kepsek")).toBe(true);
    expect(canManageGuru("kurikulum")).toBe(true);
  });
  it("guru biasa TIDAK boleh kelola (hanya lihat)", () => {
    expect(canManageGuru("guru")).toBe(false);
    expect(canManageGuru("walikelas")).toBe(false);
    expect(canManageGuru("bk")).toBe(false);
  });
});
