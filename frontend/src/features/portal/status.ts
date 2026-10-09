import type { AppointmentStatus } from "@/api/types";

export const STATUS_BORDER: Record<AppointmentStatus, string> = {
  scheduled: "border-l-primary",
  in_progress: "border-l-primary",
  completed: "border-l-success",
  cancelled: "border-l-danger",
  no_show: "border-l-warning",
};
