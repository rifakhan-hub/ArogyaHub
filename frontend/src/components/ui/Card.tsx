import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-surface", className)}>{children}</div>;
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-5 pt-5">
      <h2 className="text-body-lg font-semibold text-text">{title}</h2>
      {description && <p className="text-small text-muted">{description}</p>}
    </div>
  );
}
