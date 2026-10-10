import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <title>{`${title} · AarogyaHub Admin`}</title>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={Inbox} title="Nothing here yet" body="This part of the console hasn't been built yet." />
      </Card>
    </div>
  );
}
