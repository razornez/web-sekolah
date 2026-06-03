"use client";

/**
 * Tombol hapus generik. Server action di-pass sebagai prop dari Server Component.
 */
export function ConfirmDelete({
  action,
  id,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!confirm(message)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-red-600 hover:underline">
        Hapus
      </button>
    </form>
  );
}
