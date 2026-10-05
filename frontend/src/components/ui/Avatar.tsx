import { cn } from "@/lib/cn";

const colours = [
  "bg-neem-100 text-neem-800 dark:bg-neem-900 dark:text-neem-200",
  "bg-neel-100 text-neel-800 dark:bg-neel-900 dark:text-neel-200",
  "bg-haldi-100 text-haldi-900 dark:bg-haldi-900 dark:text-haldi-200",
  "bg-sindoor-100 text-sindoor-800 dark:bg-sindoor-900 dark:text-sindoor-200",
  "bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-100",
];

const sizes = {
  sm: "size-7 text-caption",
  md: "size-9 text-small",
  lg: "size-14 text-h4",
};

function initials(name: string) {
  const words = name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function colourFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return colours[hash % colours.length];
}

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        sizes[size],
        colourFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
