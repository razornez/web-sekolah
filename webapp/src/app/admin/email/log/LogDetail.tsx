"use client";

import { useState } from "react";

interface LogEntry {
  id: number;
  subject: string;
  bodyHtml: string | null;
  errorMsg: string | null;
  status: string;
}

export function LogDetail({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
      >
        Detail
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 mx-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Detail Email #{log.id}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{log.subject}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              {log.status === "failed" && log.errorMsg && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <b>Error:</b> {log.errorMsg}
                </div>
              )}
              {log.bodyHtml ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview Body</p>
                  <div
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: log.bodyHtml }}
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Body tidak tersimpan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
