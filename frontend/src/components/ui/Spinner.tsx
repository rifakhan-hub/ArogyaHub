import { Loader2 } from "lucide-react";

export function Spinner({ fullScreen }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      className={
        fullScreen
          ? "flex min-h-dvh items-center justify-center gap-2 bg-bg text-small text-muted"
          : "flex items-center justify-center gap-2 px-6 py-12 text-small text-muted"
      }
    >
      <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
      Loading…
    </div>
  );
}
