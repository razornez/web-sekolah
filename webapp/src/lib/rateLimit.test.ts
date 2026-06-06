import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "./rateLimit";

describe("rateLimit (anti brute-force)", () => {
  const KEY = "smartschool:admin";

  beforeEach(() => {
    clearAttempts(KEY);
    vi.useRealTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("tidak diblokir saat belum ada percobaan", () => {
    expect(isRateLimited(KEY)).toBe(false);
  });

  it("tidak diblokir di bawah ambang (4 gagal)", () => {
    for (let i = 0; i < 4; i++) recordFailedAttempt(KEY);
    expect(isRateLimited(KEY)).toBe(false);
  });

  it("diblokir setelah 5 gagal beruntun", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY);
    expect(isRateLimited(KEY)).toBe(true);
  });

  it("clearAttempts mereset blokir (login sukses)", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY);
    expect(isRateLimited(KEY)).toBe(true);
    clearAttempts(KEY);
    expect(isRateLimited(KEY)).toBe(false);
  });

  it("blokir kedaluwarsa setelah 15 menit", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY);
    expect(isRateLimited(KEY)).toBe(true);
    // maju 16 menit
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(isRateLimited(KEY)).toBe(false);
  });

  it("key berbeda dihitung terpisah", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt("smartschool:userA");
    expect(isRateLimited("smartschool:userA")).toBe(true);
    expect(isRateLimited("smartschool:userB")).toBe(false);
    clearAttempts("smartschool:userA");
  });
});
