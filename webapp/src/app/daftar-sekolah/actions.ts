"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { provisionDemoSekolah } from "@/lib/provisionSekolah";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export type RegState = { ok: boolean; error?: string };

/**
 * Self-service signup: buat tenant DEMO (24 jam) + akun admin, lalu auto-login.
 * Tanpa aktivasi manual. (Verifikasi email menyusul saat SMTP tersedia.)
 */
export async function daftarSekolah(_prev: RegState, formData: FormData): Promise<RegState> {
  const namaSekolah = str(formData.get("namaSekolah"));
  const namaPic = str(formData.get("namaPic"));
  const username = str(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const email = str(formData.get("email"));

  if (!namaSekolah || !namaPic || !username) return { ok: false, error: "required" };
  if (username.length < 3) return { ok: false, error: "username" };
  if (password.length < 6) return { ok: false, error: "password" };

  try {
    const { slug } = await provisionDemoSekolah({
      namaSekolah,
      jenjangLabel: str(formData.get("jenjang")) ?? "SMA",
      namaPic,
      username,
      password,
      email,
      telepon: str(formData.get("telepon")),
    });

    // Auto-login ke tenant baru (signIn akan redirect ke /dashboard — error redirect
    // sengaja dibiarkan propagate, JANGAN di-catch).
    await signIn("credentials", {
      username: username.toLowerCase(),
      password,
      sekolah: slug,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (e) {
    // Redirect dari signIn() harus diteruskan, bukan ditangkap sebagai error.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("daftarSekolah error:", e);
    return { ok: false, error: "server" };
  }
}

/** (Opsional) catat lead untuk paket Yayasan/Custom yang tidak self-provision. */
export async function kirimLeadYayasan(formData: FormData) {
  const namaSekolah = str(formData.get("namaSekolah"));
  const namaPic = str(formData.get("namaPic"));
  if (!namaSekolah || !namaPic) return;
  await prisma.pendaftaranSekolah.create({
    data: {
      namaSekolah, namaPic,
      jenjang: str(formData.get("jenjang")),
      email: str(formData.get("email")),
      telepon: str(formData.get("telepon")),
      paket: "Yayasan",
      catatan: str(formData.get("catatan")),
    },
  }).catch(() => {});
}
