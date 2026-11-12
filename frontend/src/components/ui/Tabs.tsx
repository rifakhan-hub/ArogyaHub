import { cn } from "@/lib/cn";

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function Tabs({ tabs, value, onChange, label }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="border-border flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "text-small hover:text-text -mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-medium transition-colors",
            tab.value === value ? "border-primary text-text" : "text-muted border-transparent",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="bg-surface-muted text-caption text-muted tabular rounded-full px-1.5 font-semibold">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
