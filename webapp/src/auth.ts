import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rateLimit";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
        sekolah: {},
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password, sekolah } = parsed.data;

        // Anti brute-force: blokir setelah 5 gagal beruntun (15 menit).
        const rlKey = `${(sekolah ?? "_").toLowerCase()}:${username.toLowerCase()}`;
        if (isRateLimited(rlKey)) return null;

        const user = await prisma.user.findFirst({
          where: {
            username,
            isActive: true,
            ...(sekolah ? { sekolah: { slug: sekolah } } : {}),
          },
          include: { sekolah: { select: { slug: true } } },
        });
        if (!user) { recordFailedAttempt(rlKey); return null; }

        // Verifikasi password. User warisan masih MD5 → cek md5, lalu upgrade ke bcrypt.
        let ok: boolean;
        if (user.passwordLegacyMd5) {
          ok = md5(password) === user.passwordHash;
          if (ok) {
            const newHash = await bcrypt.hash(password, 10);
            await prisma.user
              .update({
                where: { id: user.id },
                data: { passwordHash: newHash, passwordLegacyMd5: false },
              })
              .catch(() => {});
          }
        } else {
          ok = await bcrypt.compare(password, user.passwordHash);
        }
        if (!ok) { recordFailedAttempt(rlKey); return null; }

        // Login sukses → reset hitungan rate-limit.
        clearAttempts(rlKey);

        // Catat login terakhir (best-effort).
        await prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id,
          name: user.namaLengkap,
          email: user.email ?? undefined,
          role: user.role,
          sekolahId: user.sekolahId ?? null,
          sekolahSlug: user.sekolah?.slug ?? null,
        };
      },
    }),
  ],
});
