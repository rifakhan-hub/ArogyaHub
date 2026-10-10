import { FileText, ImageIcon, type LucideIcon, ScanLine, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApiError } from "@/api/client";
import { openFile } from "@/api/files";
import { deleteReport, shareReport, stopSharingReport, uploadReport } from "@/api/reports";
import type { Appointment, Report, ReportType } from "@/api/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";
import { REPORT_TYPE_LABELS } from "./data";

const ICONS: Record<ReportType, LucideIcon> = { pdf: FileText, image: ImageIcon, dicom: ScanLine };

const FILTERS: { value: ReportType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Images" },
  { value: "dicom", label: "Scans" },
];

async function attempt(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    toast.success(success);
    refreshData();
  } catch (err) {
    toast.error((err as ApiError).message);
  }
}

export default function ReportsPage() {
  const reports = useApi<Report[]>("/reports/me");
  const appointments = useApi<Appointment[]>("/appointments/me");
  const [filter, setFilter] = useState<ReportType | "">("");
  const [uploading, setUploading] = useState(false);

  const myDoctors = [...new Map((appointments.data ?? []).map((a) => [a.doctor_id, a.doctor_name])).entries()];

  async function handleFiles(files: FileList | null) {
    setUploading(true);
    for (const file of Array.from(files ?? [])) {
      const title = file.name.replace(/\.[^.]+$/, "");
      await attempt(() => uploadReport(title, file), `Uploaded ${file.name}`);
    }
    setUploading(false);
  }

  if (reports.error) return <ErrorMessage error={reports.error} onRetry={reports.reload} />;
  if (!reports.data) return <Spinner />;

  const shown = filter ? reports.data.filter((r) => r.report_type === filter) : reports.data;

  return (
    <>
      <title>Reports · Patient portal</title>
      <PageHeader
        title="Reports"
        description="Your reports and scans in one place. Share them so your doctor can see them before the call."
        actions={
          <label className={cn(buttonClass("primary", "md"), "cursor-pointer", uploading && "opacity-60")}>
            <Upload aria-hidden />
            {uploading ? "Uploading…" : "Upload report"}
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.dcm,.zip"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reports">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-small font-medium transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-on-primary"
                : "border-border-strong text-muted hover:bg-surface-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No reports here yet" body="Upload a PDF, a photo or a scan." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((report) => (
            <ReportRow key={report.id} report={report} doctors={myDoctors} />
          ))}
        </ul>
      )}
    </>
  );
}

function ReportRow({ report, doctors }: { report: Report; doctors: [string, string][] }) {
  const Icon = ICONS[report.report_type];
  const sharedIds = report.shared_with.map((s) => s.doctor_id);
  const options = doctors.filter(([id]) => !sharedIds.includes(id));

  return (
    <li>
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{report.title}</p>
              <p className="text-small text-muted">
                {REPORT_TYPE_LABELS[report.report_type]} · {formatBytes(report.size)} · Uploaded{" "}
                {formatDate(report.uploaded_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openFile(`/reports/${report.id}/file`)}>
              Open
            </Button>
            <Button
              variant="danger-ghost"
              size="icon-sm"
              aria-label={`Delete ${report.title}`}
              onClick={() => attempt(() => deleteReport(report.id), `Deleted ${report.title}`)}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-small">
          <span className="text-muted">Shared with:</span>
          {report.shared_with.length === 0 && <span className="text-muted">nobody</span>}
          {report.shared_with.map((s) => (
            <span key={s.doctor_id} className="flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-success">
              {s.doctor_name}
              <button
                type="button"
                aria-label={`Stop sharing with ${s.doctor_name}`}
                onClick={() => attempt(() => stopSharingReport(report.id, s.doctor_id), `Stopped sharing with ${s.doctor_name}`)}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
          {options.length > 0 && (
            <Select
              aria-label={`Share ${report.title} with`}
              value=""
              onChange={(doctorId) => {
                if (!doctorId) return;
                const name = doctors.find(([id]) => id === doctorId)?.[1];
                attempt(() => shareReport(report.id, doctorId), `Shared with ${name}`);
              }}
              options={[{ value: "", label: "Share with a doctor…" }, ...options.map(([id, name]) => ({ value: id, label: name }))]}
              className="w-60"
            />
          )}
        </div>
      </Card>
    </li>
  );
}
