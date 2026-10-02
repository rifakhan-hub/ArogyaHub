import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const positions = {
  // a box in the middle of the screen (dialogs)
  center: "m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-surface p-6",
  // a tall panel on the right (details of a doctor, user, ...)
  right: "my-0 ml-auto mr-0 h-dvh max-h-dvh w-full max-w-xl border-l border-border bg-surface open:animate-slide-in-right",
  // a tall panel on the left (the menu on phones)
  left: "my-0 ml-0 mr-auto h-dvh max-h-dvh w-72 max-w-[85vw] bg-nav open:animate-slide-in-left",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Read out by screen readers when the dialog opens. */
  label: string;
  position?: keyof typeof positions;
  children: React.ReactNode;
}

/**
 * A dialog built on the browser's own <dialog> element: it keeps keyboard focus inside,
 * closes with the Esc key and dims the page behind it.
 */
export function Modal({ open, onClose, label, position = "center", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      className={cn(
        "flex-col overflow-hidden text-text shadow-3 backdrop:bg-stone-900/45 open:flex",
        positions[position],
      )}
    >
      {children}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-surface-muted hover:text-text"
      >
        <X className="size-5" aria-hidden />
      </button>
    </dialog>
  );
}

/** The right-hand side panel used for record details. */
export function SidePanel(props: Omit<ModalProps, "position">) {
  return <Modal {...props} position="right" />;
}

/** Layout pieces for a side panel: a header, a scrolling body and a footer with the actions. */
export function PanelHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border px-6 pb-5 pt-6 pr-16">{children}</div>;
}

export function PanelBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">{children}</div>;
}

export function PanelFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
      {children}
    </div>
  );
}

/** Label / value pairs in a two-column grid. */
export function DetailList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-md border border-border p-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-caption font-medium text-subtle">{label}</dt>
          <dd className="mt-0.5 break-words text-small text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
