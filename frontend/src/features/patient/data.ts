import type { ReportType } from "@/api/types";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  pdf: "PDF",
  image: "Image",
  dicom: "Scan (DICOM)",
};
