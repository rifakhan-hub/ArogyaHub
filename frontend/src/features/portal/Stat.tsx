import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
}

export function Stat({ label, value, icon: Icon }: StatProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {Icon && (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-small text-muted">{label}</span>
        <span className="text-h2 font-semibold">{value}</span>
      </div>
    </Card>
  );
}
