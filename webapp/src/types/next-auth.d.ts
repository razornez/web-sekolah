import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    sekolahId: number | null;
    sekolahSlug: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      sekolahId: number | null;
      sekolahSlug: string | null;
    } & DefaultSession["user"];
  }
}

// JWT interface dideklarasikan di @auth/core/jwt (next-auth/jwt hanya re-export),
// jadi augmentasi harus menargetkan modul asal agar declaration merging berlaku.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    sekolahId: number | null;
    sekolahSlug: string | null;
  }
}
