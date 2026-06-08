"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { saveTemplate, sendTestTemplate } from "../actions";

interface Variable { name: string; description: string; example: string; }

interface TemplateData {
  key: string;
  name: string;
  description: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: Variable[];
  isEnabled: boolean;
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export function TemplateEditor({ template }: { template: TemplateData }) {
  const t = useTranslations("pengaturan");
  const [saveState, saveAction, savePending] = useActionState(saveTemplate, null);
  const [testState, testAction, testPending] = useActionState(sendTestTemplate, null);
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);
  const [previewMode, setPreviewMode] = useState(false);

  function renderPreview(html: string): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = template.variables.find((v) => v.name === key);
      return v?.example ?? `[${key}]`;
    });
  }

  function copyVar(name: string) {
    navigator.clipboard.writeText(`{{${name}}}`);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        {saveState && (
          <div className={`rounded-lg px-4 py-3 text-sm ${saveState.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {saveState.message}
          </div>
        )}
        {testState && (
          <div className={`rounded-lg px-4 py-3 text-sm ${testState.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {testState.message}
          </div>
        )}

        <form action={saveAction} className="space-y-4">
          <input type="hidden" name="key" value={template.key} />

          <div>
            <label className={labelCls}>{t("emailEditorSubject")}</label>
            <input name="subject" defaultValue={template.subject} className={inputCls} required />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls.replace("mb-1", "mb-0")}>{t("emailEditorBodyHtml")}</label>
              <button type="button" onClick={() => setPreviewMode((v) => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                {previewMode ? t("emailEditorBackToEditor") : t("emailEditorPreview")}
              </button>
            </div>
            {previewMode ? (
              <div className="min-h-48 rounded-lg border border-gray-200 bg-white p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderPreview(bodyHtml) }} />
            ) : (
              <textarea name="bodyHtml" value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={14}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" spellCheck={false} />
            )}
          </div>

          <div>
            <label className={labelCls}>{t("emailEditorBodyText")} <span className="font-normal text-gray-400">{t("emailEditorOptional")}</span></label>
            <textarea name="bodyText" defaultValue={template.bodyText ?? ""} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isEnabled" value="1" defaultChecked={template.isEnabled} className="h-4 w-4 rounded accent-indigo-600" />
            <span>{t("emailEditorActiveLabel")}</span>
          </label>

          <button type="submit" disabled={savePending} className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {savePending ? t("emailEditorSaving") : t("emailEditorSaveBtn")}
          </button>
        </form>

        <form action={testAction}>
          <input type="hidden" name="key" value={template.key} />
          <button type="submit" disabled={testPending} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            {testPending ? t("emailEditorTesting") : t("emailEditorTestBtn")}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("emailEditorVarsTitle")}</h3>
          <p className="text-xs text-gray-500 mb-3">{t("emailEditorVarsHint")}</p>
          <div className="space-y-2">
            {template.variables.map((v) => (
              <button key={v.name} type="button" onClick={() => copyVar(v.name)}
                className="w-full rounded-lg border border-dashed border-gray-200 p-2.5 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                <code className="text-xs font-semibold text-indigo-600">{`{{${v.name}}}`}</code>
                <p className="mt-0.5 text-xs text-gray-500">{v.description}</p>
                <p className="text-xs text-gray-400 italic">{t("emailEditorExample")} {v.example}</p>
              </button>
            ))}
          </div>
        </div>
        {template.description && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("emailEditorDescTitle")}</h3>
            <p className="text-sm text-gray-700">{template.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
