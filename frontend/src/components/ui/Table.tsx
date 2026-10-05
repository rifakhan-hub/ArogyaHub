import { SearchX } from "lucide-react";
import { Fragment } from "react";
import type { ApiError } from "@/api/client";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  loading: boolean;
  error?: ApiError;
  onRetry?: () => void;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  activeId?: string | null;
  renderExpanded?: (row: T) => React.ReactNode;
}

export function Table<T extends { id: string }>({
  caption,
  columns,
  rows,
  loading,
  error,
  onRetry,
  empty,
  onRowClick,
  activeId,
  renderExpanded,
}: TableProps<T>) {
  function renderBody() {
    if (error) return <FullRow columns={columns.length}><ErrorMessage error={error} onRetry={onRetry} /></FullRow>;
    if (!rows) return <FullRow columns={columns.length}><Spinner /></FullRow>;
    if (rows.length === 0) {
      return (
        <FullRow columns={columns.length}>
          {empty ?? <EmptyState icon={SearchX} title="No results match these filters." body="Try a different search or clear the filters." />}
        </FullRow>
      );
    }
    return rows.map((row) => {
      const expanded = renderExpanded?.(row);
      return (
        <Fragment key={row.id}>
          <tr
            onClick={(e) => {
              if (onRowClick && !(e.target as HTMLElement).closest("button, a")) onRowClick(row);
            }}
            className={cn(
              "border-b border-border last:border-0",
              onRowClick && "cursor-pointer hover:bg-surface-muted/60",
              activeId === row.id && "bg-primary-soft hover:bg-primary-soft",
            )}
          >
            {columns.map((col) => (
              <td key={col.header} className={cn("px-3 py-3 align-middle text-small sm:px-4", col.className)}>
                {col.cell(row)}
              </td>
            ))}
          </tr>
          {expanded && (
            <tr className="border-b border-border bg-surface-muted/60">
              <td colSpan={columns.length} className="px-4 pb-4 pt-0">
                {expanded}
              </td>
            </tr>
          )}
        </Fragment>
      );
    });
  }

  return (
    <div className="overflow-x-auto rounded-t-lg">
      <table className="w-full border-collapse text-left tabular sm:min-w-[640px]" aria-busy={loading}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted/50">
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className={cn("h-10 whitespace-nowrap px-3 text-caption font-medium text-subtle sm:px-4", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(loading && rows && "opacity-60 transition-opacity")}>{renderBody()}</tbody>
      </table>
    </div>
  );
}

function FullRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={columns}>{children}</td>
    </tr>
  );
}
