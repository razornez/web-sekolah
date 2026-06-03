"use server";

import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSekolahId } from "@/lib/session";
import { akunSchema } from "@/lib/validations";

export type AccountState = { ok: boolean; message?: string };

async function createAccount(
  kind: "guru" | "siswa",
  fd: FormData,
): Promise<AccountState> {
  const sekolahId = await getSekolahId();
  const ownerId = Number(fd.get("ownerId"));
  const parsed = akunSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }
  if (!ownerId) return { ok: false, message: "Data tidak valid." };

  let nama: string;
  if (kind === "guru") {
    const g = await prisma.guru.findFirst({
      where: { id: ownerId, sekolahId },
      select: { userId: true, namaGuru: true },
    });
    if (!g) return { ok: false, message: "Data tidak ditemukan." };
    if (g.userId) return { ok: false, message: "Akun sudah ada." };
    nama = g.namaGuru;
  } else {
    const s = await prisma.siswa.findFirst({
      where: { id: ownerId, sekolahId },
      select: { userId: true, namaLengkap: true },
    });
    if (!s) return { ok: false, message: "Data tidak ditemukan." };
    if (s.userId) return { ok: false, message: "Akun sudah ada." };
    nama = s.namaLengkap;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          sekolahId,
          username: parsed.data.username,
          passwordHash,
          namaLengkap: nama,
          role: kind === "guru" ? Role.guru : Role.siswa,
        },
      });
      if (kind === "guru")
        await tx.guru.update({ where: { id: ownerId }, data: { userId: user.id } });
      else await tx.siswa.update({ where: { id: ownerId }, data: { userId: user.id } });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Username sudah dipakai." };
    }
    throw e;
  }

  revalidatePath(`/${kind}/${ownerId}`);
  return { ok: true, message: "Akun berhasil dibuat." };
}

export async function createAccountGuru(_prev: AccountState, fd: FormData) {
  return createAccount("guru", fd);
}
export async function createAccountSiswa(_prev: AccountState, fd: FormData) {
  return createAccount("siswa", fd);
}

export async function resetPassword(fd: FormData) {
  const sekolahId = await getSekolahId();
  const userId = String(fd.get("userId") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!userId || password.length < 6) return;
  const u = await prisma.user.findFirst({ where: { id: userId, sekolahId }, select: { id: true } });
  if (!u) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordLegacyMd5: false },
  });
}

export async function toggleAktif(fd: FormData) {
  const sekolahId = await getSekolahId();
  const userId = String(fd.get("userId") ?? "");
  const kind = String(fd.get("kind") ?? "");
  const ownerId = Number(fd.get("ownerId"));
  if (!userId) return;
  const u = await prisma.user.findFirst({ where: { id: userId, sekolahId }, select: { isActive: true } });
  if (!u) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: !u.isActive } });
  if (kind && ownerId) revalidatePath(`/${kind}/${ownerId}`);
}
