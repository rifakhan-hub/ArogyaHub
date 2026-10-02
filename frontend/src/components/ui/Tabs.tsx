import { cn } from "@/lib/cn";

interface Tab {
  value: string;
  label: string;
  /** Optional number shown in a small pill. */
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  /** Read by screen readers, e.g. "Verification status". */
  label: string;
}

/** A row of underlined tabs. The page decides what to show for the selected one. */
export function Tabs({ tabs, value, onChange, label }: TabsProps) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-small font-medium transition-colors hover:text-text",
            tab.value === value ? "border-primary text-text" : "border-transparent text-muted",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-surface-muted px-1.5 text-caption font-semibold text-muted tabular">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
