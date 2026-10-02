import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

// Design doc 6.1: primary for the main action, sindoor (danger) only for destructive ones.
const variants = {
  primary: "bg-primary text-on-primary shadow-1 hover:bg-primary-hover",
  secondary: "border border-primary bg-surface text-primary hover:bg-primary-soft",
  outline: "border border-border-strong bg-surface text-text hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-text",
  danger: "bg-danger text-on-danger shadow-1 hover:bg-danger-hover",
  "danger-outline": "border border-danger bg-surface text-danger hover:bg-danger-soft",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
  sm: "h-8 px-3 text-small",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-5 text-body-lg",
  icon: "size-10",
  "icon-sm": "size-8",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

/** The button classes, for links that should look like buttons: <Link className={buttonClass()} />. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    variant === "link" ? "text-small" : sizes[size],
  );
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button while an action runs. */
  loading?: boolean;
};

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass(variant, size), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
