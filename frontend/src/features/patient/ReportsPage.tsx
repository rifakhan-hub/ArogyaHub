import { FileText, ImageIcon, type LucideIcon, ScanLine, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";
import { type PatientReport, REPORT_TYPE_LABELS, type ReportType, reportTypeOf } from "./data";
import { usePatientData } from "./PatientLayout";

const MAX_SIZE = 500 * 1024 * 1024;

const ICONS: Record<ReportType, LucideIcon> = { pdf: FileText, image: ImageIcon, dicom: ScanLine };

const FILTERS: { value: ReportType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Images" },
  { value: "dicom", label: "Scans" },
];

export default function ReportsPage() {
  const { reports, addReport, removeReport, toggleShare } = usePatientData();
  const [filter, setFilter] = useState<ReportType | "">("");

  const shown = filter ? reports.filter((r) => r.type === filter) : reports;

  function handleFiles(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      const type = reportTypeOf(file);
      if (!type) {
        toast.error(`${file.name}: upload a PDF, an image or a DICOM scan`);
      } else if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is larger than 500 MB`);
      } else {
        addReport({ name: file.name, type, size: file.size });
        toast.success(`Uploaded ${file.name}`);
      }
    }
  }

  function handleShare(report: PatientReport) {
    toggleShare(report.id);
    toast.success(report.shared ? `${report.name} is private again` : `${report.name} is shared with your doctors`);
  }

  return (
    <>
      <title>Reports · Patient portal</title>
      <PageHeader
        title="Reports"
        description="Your reports and scans in one place. Share them so your doctor can see them before the call."
        actions={
          <label className={cn(buttonClass("primary", "md"), "cursor-pointer")}>
            <Upload aria-hidden />
            Upload report
            <input
              type="file"
              multiple
              accept=".pdf,.dcm,.zip,image/*"
              className="sr-only"
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
          {shown.map((report) => {
            const Icon = ICONS[report.type];
            return (
              <li key={report.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{report.name}</p>
                      <p className="text-small text-muted">
                        {REPORT_TYPE_LABELS[report.type]} · {formatBytes(report.size)} · Uploaded{" "}
                        {formatDate(report.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={report.shared ? "success" : "neutral"}>
                      {report.shared ? "Shared with doctors" : "Private"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleShare(report)}>
                      {report.shared ? "Stop sharing" : "Share"}
                    </Button>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      aria-label={`Delete ${report.name}`}
                      onClick={() => {
                        removeReport(report.id);
                        toast.success(`Deleted ${report.name}`);
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
