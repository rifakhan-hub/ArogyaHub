import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface text-body text-text placeholder:text-subtle transition-colors hover:border-stone-400 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30 disabled:bg-surface-muted aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-10 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "px-3 py-2 leading-6", className)} {...props} />;
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, "h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-subtle hover:bg-surface-muted hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

type SelectProps = Omit<React.ComponentProps<"select">, "onChange"> & {
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export function Select({ options, onChange, className, ...props }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(fieldClass, "h-10 appearance-none pl-3 pr-9")}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
        aria-hidden
      />
    </div>
  );
}
