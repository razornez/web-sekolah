"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import type { Jenjang, Kurikulum } from "@prisma/client";

const JENJANG: Jenjang[] = ["PAUD", "TK", "SD", "MI", "SMP", "MTS", "SMA", "MA", "SMK"];
const str = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); return s === "" ? null : s; };

export type SekolahFormState = { ok: boolean; message?: string };

export async function saveIdentitasSekolah(
  _prev: SekolahFormState,
  formData: FormData,
): Promise<SekolahFormState> {
  const sekolahId = await requireModule("pengaturan");
  const nama = str(formData.get("nama"));
  if (!nama) return { ok: false, message: "Nama sekolah wajib diisi." };

  const jenjangRaw = String(formData.get("jenjang") ?? "");
  const kurikulumRaw = String(formData.get("kurikulumDefault") ?? "");

  await prisma.sekolah.update({
    where: { id: sekolahId },
    data: {
      nama,
      npsn: str(formData.get("npsn")),
      jenjang: JENJANG.includes(jenjangRaw as Jenjang) ? (jenjangRaw as Jenjang) : undefined,
      kurikulumDefault: (kurikulumRaw === "MERDEKA" || kurikulumRaw === "K13") ? (kurikulumRaw as Kurikulum) : undefined,
      alamat: str(formData.get("alamat")),
      telepon: str(formData.get("telepon")),
      email: str(formData.get("email")),
      website: str(formData.get("website")),
      kepalaSekolah: str(formData.get("kepalaSekolah")),
      nipKepala: str(formData.get("nipKepala")),
      visi: str(formData.get("visi")),
      misi: str(formData.get("misi")),
    },
  });
  await auditLog({ aksi: "update", entitas: "sekolah", entitasId: sekolahId, detail: `Update identitas sekolah: ${nama}` });
  revalidatePath("/pengaturan/sekolah");
  return { ok: true };
}
