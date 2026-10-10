import { FileText } from "lucide-react";
import { openFile } from "@/api/files";
import type { SharedReport } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { REPORT_TYPE_LABELS } from "@/features/patient/data";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";

export default function SharedReportsPage() {
  const { data, error, reload } = useApi<SharedReport[]>("/reports/shared-with-me");

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!data) return <Spinner />;

  return (
    <>
      <title>Patient reports · Doctor portal</title>
      <PageHeader title="Patient reports" description="Reports and scans your patients have shared with you." />

      {data.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No shared reports yet" body="Patients can share reports from their portal." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.patient_name} />
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-small text-muted">
                      {r.patient_name} · {REPORT_TYPE_LABELS[r.report_type]} · {formatBytes(r.size)} · Shared{" "}
                      {formatDate(r.shared_at)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFile(`/reports/${r.id}/file`)}>
                  Open
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
