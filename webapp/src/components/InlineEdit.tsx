"use client";

import { useRef, useState, useTransition } from "react";

/**
 * Popover edit inline yang auto-close setelah server action sukses.
 * Menggantikan pola <details> biasa yang tidak bisa menutup diri sendiri.
 *
 * Contoh pemakaian (di server component yang mengoper action):
 *   <InlineEdit
 *     trigger={<span>✏️</span>}
 *     action={updateTugas}
 *   >
 *     {(close) => (
 *       <>
 *         <input name="id" type="hidden" value={tg.id} />
 *         <input name="judul" defaultValue={tg.judul} />
 *       </>
 *     )}
 *   </InlineEdit>
 */
export function InlineEdit({
  trigger,
  action,
  children,
  saveLabel = "Simpan",
}: {
  trigger?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (fd: FormData) => Promise<any>;
  children: ((close: () => void) => React.ReactNode) | React.ReactNode;
  saveLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function close() { setOpen(false); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(fd);
      close(); // tutup setelah sukses
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer list-none rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
        aria-expanded={open}
      >
        {trigger ?? "✏️"}
      </button>

      {open && (
        <>
          {/* Overlay transparan — klik luar menutup */}
          <div className="fixed inset-0 z-10" onClick={close} />

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="absolute right-0 z-20 mt-1 flex w-72 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
          >
            {typeof children === "function" ? children(close) : children}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-md bg-gray-900 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isPending ? "…" : saveLabel}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
