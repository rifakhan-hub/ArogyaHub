import { useState } from "react";
import { checkReason } from "@/lib/validators";
import { Button } from "./Button";
import { Field } from "./Field";
import { Textarea } from "./Input";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  /** The button text says exactly what happens, e.g. "Block user" (design doc 13). */
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the admin must type a reason of at least 10 characters. */
  reasonLabel?: string;
  reasonHint?: string;
  /** Runs when the admin confirms. The dialog shows a spinner until it finishes. */
  onConfirm: (reason: string) => Promise<void> | void;
}

/** Asks "are you sure?" before an action that can't easily be undone. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = true,
  reasonLabel,
  reasonHint,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setReason("");
    setError(undefined);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = reasonLabel ? checkReason(reason) : undefined;
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      setError(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} label={title}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="pr-8">
          <h2 className="text-h4 text-text">{title}</h2>
          <p className="mt-1.5 text-body text-muted">{body}</p>
        </div>
        {reasonLabel && (
          <Field label={reasonLabel} id="confirm-reason" hint={reasonHint} error={error}>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={danger ? "danger" : "primary"} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
