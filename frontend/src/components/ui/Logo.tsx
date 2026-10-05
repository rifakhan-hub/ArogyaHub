import { cn } from "@/lib/cn";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-neem-600" />
      <rect x="5.5" y="12.5" width="5" height="7" rx="1.5" className="fill-neem-100" />
      <rect x="12" y="12.5" width="8.5" height="7" rx="1.5" className="fill-haldi-400" />
      <rect x="22" y="12.5" width="4.5" height="7" rx="1.5" className="fill-neem-100" />
    </svg>
  );
}

export function Logo({ onDark = true, subtitle = "Admin console" }: { onDark?: boolean; subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("text-body-lg font-bold", onDark ? "text-nav-text" : "text-text")}>AarogyaHub</span>
        <span className={cn("mt-0.5 text-caption font-medium", onDark ? "text-nav-muted" : "text-subtle")}>
          {subtitle}
        </span>
      </span>
    </span>
  );
}
