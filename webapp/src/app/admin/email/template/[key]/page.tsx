import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TemplateEditor } from "./TemplateEditor";

export default async function TemplateEditorPage({ params }: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser();
  if (user.role !== "superadmin") redirect("/dashboard");

  const { key } = await params;
  const template = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!template) notFound();

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
      <div className="flex items-center gap-3">
        <Link href="/admin/email/template" className="text-sm text-gray-500 hover:text-gray-800">← Template</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
        <code className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{template.key}</code>
      </div>

      <TemplateEditor template={data} />
    </div>
  );
}
