/** Joins class names and skips empty ones: cn("px-3", isActive && "bg-primary"). */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
