"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmModal } from "./ConfirmModal";
import { ErrorModal } from "./ErrorModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeleteAction = (formData: FormData) => Promise<any>;

export function ConfirmDelete({
  action,
  id,
  message,
  label,
}: {
  action: DeleteAction;
  id: number;
  message: string;
  label?: string;
}) {
  const t = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function wrappedAction(
    _prev: { error?: string },
    formData: FormData,
  ): Promise<{ error?: string }> {
    const result = await action(formData);
    if (result && typeof result === "object" && "ok" in result && !result.ok) {
      return { error: (result as { ok: false; error: string }).error };
    }
    return {};
  }

  const [state, formAction, pending] = useActionState(wrappedAction, {});

  useEffect(() => {
    if (state.error) {
      setErrorMsg(state.error);
      setShowError(true);
    }
  }, [state]);

  function handleConfirm() {
    setShowConfirm(false);
    // Gunakan requestSubmit() bukan panggil formAction langsung —
    // Server Actions harus di-invoke lewat form submit agar Next.js
    // bisa menangani encoding & response dengan benar (E3 fix).
    formRef.current?.requestSubmit();
  }

  return (
    <>
      {/* Form tersembunyi — Server Action dipanggil lewat submit normal */}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>

      <button
        type="button"
        disabled={pending}
        onClick={() => setShowConfirm(true)}
        className="cursor-pointer text-red-600 hover:underline text-sm disabled:opacity-40"
      >
        {label ?? t("delete")}
      </button>

      <ConfirmModal
        open={showConfirm}
        title={t("deleteConfirmTitle")}
        message={message}
        confirmLabel={t("deleteConfirmYes")}
        cancelLabel={t("cancel")}
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />

      <ErrorModal
        open={showError}
        title={t("components.deleteFailedTitle")}
        message={errorMsg}
        onClose={() => setShowError(false)}
      />
    </>
  );
}
