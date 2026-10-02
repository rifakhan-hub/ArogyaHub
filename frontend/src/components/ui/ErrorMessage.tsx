import { CloudOff, RotateCw } from "lucide-react";
import type { ApiError } from "@/api/client";
import { Button } from "./Button";

/** Says what went wrong and offers a retry. The request ID helps support find the problem. */
export function ErrorMessage({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <CloudOff className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="max-w-md">
        <p className="text-body font-semibold text-text">We couldn't load this</p>
        <p className="mt-1 text-small text-muted">{error.message}</p>
        {error.requestId && <p className="mt-2 font-mono text-caption text-subtle">Request ID {error.requestId}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
