import { describe, it, expect } from "vitest";
import { loginSchema } from "./validations";

describe("loginSchema", () => {
  it("valid dengan username + password", () => {
    const r = loginSchema.safeParse({ username: "admin", password: "rahasia" });
    expect(r.success).toBe(true);
  });

  it("sekolah opsional (boleh ada)", () => {
    const r = loginSchema.safeParse({ username: "admin", password: "x", sekolah: "smartschool" });
    expect(r.success).toBe(true);
  });

  it("sekolah opsional (boleh tidak ada)", () => {
    const r = loginSchema.safeParse({ username: "admin", password: "x" });
    expect(r.success).toBe(true);
  });

  it("tolak username kosong", () => {
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
  });

  it("tolak password kosong", () => {
    expect(loginSchema.safeParse({ username: "a", password: "" }).success).toBe(false);
  });

  it("tolak field hilang", () => {
    expect(loginSchema.safeParse({ username: "a" }).success).toBe(false);
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});
