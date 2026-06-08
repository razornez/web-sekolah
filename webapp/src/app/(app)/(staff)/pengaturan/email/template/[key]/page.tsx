import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { TemplateEditor } from "./TemplateEditor";

export default async function TemplateEditorPage({ params }: { params: Promise<{ key: string }> }) {
  await requireModule("pengaturan");
  const sekolahId = await requireStaff();
  const { key } = await params;

  // Tampilkan override sekolah jika ada, fallback ke platform default
  const template =
    (await prisma.emailTemplate.findFirst({ where: { key, sekolahId } })) ??
    (await prisma.emailTemplate.findFirst({ where: { key, sekolahId: null } }));

  if (!template) notFound();
  const isCustomized = template.sekolahId === sekolahId;

  const data = {
    key: template.key,
    name: template.name,
    description: template.description,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    variables: template.variables as { name: string; description: string; example: string }[],
    isEnabled: template.isEnabled,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/pengaturan/email/template" className="text-sm text-gray-500 hover:text-gray-800">← Template</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
        <code className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{template.key}</code>
        {isCustomized ? (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Kustom sekolah</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Default platform — simpan untuk buat versi sekolah</span>
        )}
      </div>

      <TemplateEditor template={data} />
    </div>
  );
}
