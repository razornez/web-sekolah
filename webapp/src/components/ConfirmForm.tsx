"use client";

/**
 * Form dengan konfirmasi sebelum submit (window.confirm).
 * Dipakai saat Server Component butuh konfirmasi di form action.
 */
export function ConfirmForm({
  action,
  message,
  children,
  className,
}: {
  action: (fd: FormData) => Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </form>
  );
}
