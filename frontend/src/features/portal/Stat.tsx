import { Card } from "@/components/ui/Card";

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <span className="text-small text-muted">{label}</span>
      <span className="text-h2 font-semibold">{value}</span>
    </Card>
  );
}
