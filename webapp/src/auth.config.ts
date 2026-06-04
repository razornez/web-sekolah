import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
        token.sekolahId = user.sekolahId;
        token.sekolahSlug = user.sekolahSlug;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.sekolahId = token.sekolahId;
        session.user.sekolahSlug = token.sekolahSlug;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
