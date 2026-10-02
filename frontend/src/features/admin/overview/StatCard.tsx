import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Link } from "react-router";
import { formatNumber, percentChange } from "@/lib/format";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  /** Last period's value; shows the change as "+28%". */
  previous?: number;
  compareLabel?: string;
  /** Extra line under the number. */
  footnote?: React.ReactNode;
  /** The page to open when the card is clicked. */
  to: string;
  /** Yellow background, for things that need attention. */
  highlight?: boolean;
}

/** A big number with its trend, on the overview page (design doc 3.4). */
export function StatCard({ label, value, previous, compareLabel, footnote, to, highlight }: StatCardProps) {
  const change = previous === undefined ? null : percentChange(value, previous);
  const TrendIcon = !change ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col rounded-lg border p-4 transition-colors hover:border-border-strong sm:p-5",
        highlight ? "border-haldi-300 bg-accent-soft dark:border-haldi-700" : "border-border bg-surface",
      )}
    >
      <p className="text-small font-medium text-muted">{label}</p>
      <p className="mt-2 text-h1 text-text tabular max-sm:text-h3">{formatNumber(value)}</p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-small">
        {change !== null && (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold tabular",
                change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-muted",
              )}
            >
              <TrendIcon className="size-4" aria-hidden />
              {change > 0 && "+"}
              {change}%
            </span>
            <span className="text-subtle">{compareLabel}</span>
          </>
        )}
        {footnote}
      </div>
    </Link>
  );
}
