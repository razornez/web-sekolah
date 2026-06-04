import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 hari (default next-auth beta bisa sangat pendek)
  },
  pages: { signIn: "/login" },
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

        const user = await prisma.user.findFirst({
          where: {
            username,
            isActive: true,
            ...(sekolah ? { sekolah: { slug: sekolah } } : {}),
          },
          include: { sekolah: { select: { slug: true } } },
        });
        if (!user) return null;

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
        if (!ok) return null;

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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sekolahId = user.sekolahId;
        token.sekolahSlug = user.sekolahSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.sekolahId = token.sekolahId;
        session.user.sekolahSlug = token.sekolahSlug;
      }
      return session;
    },
  },
});
