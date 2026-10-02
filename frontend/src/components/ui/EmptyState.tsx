import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  /** A button or link for the next step. */
  action?: React.ReactNode;
}

/** Shown when a list has nothing in it: a short statement plus the next action (design doc 9.7). */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-subtle">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="max-w-sm">
        <p className="text-body font-semibold text-text">{title}</p>
        {body && <p className="mt-1 text-small text-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}
