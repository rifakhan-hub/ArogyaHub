import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

/** "21-40 of 150" with previous / next buttons. */
export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  if (total === 0) return null;
  const pages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-small text-muted tabular"
    >
      <p aria-live="polite">
        {formatNumber(from)}-{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">
          Page {page} of {pages}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft aria-hidden />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
