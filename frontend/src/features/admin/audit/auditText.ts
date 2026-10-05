import { BookOpenText, CalendarClock, FileText, KeyRound, type LucideIcon, ShieldCheck, UserRound } from "lucide-react";
import type { AuditLog } from "@/api/types";

const VERBS: Record<string, string> = {
  "doctor.approve": "Approved doctor",
  "doctor.reject": "Rejected doctor",
  "doctor.suspend": "Suspended doctor",
  "doctor.document_view": "Viewed doctor document",
  "user.block": "Blocked user",
  "user.unblock": "Unblocked user",
  "appointment.override": "Overrode appointment",
  "kb.create": "Created article",
  "kb.update": "Edited article",
  "kb.publish": "Published article",
  "kb.unpublish": "Unpublished article",
  "kb.delete": "Deleted article",
  "report.view": "Viewed report",
  "video.token_issued": "Issued video token",
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
};

export function auditVerb(action: string) {
  return VERBS[action] ?? action;
}

export const ENTITY_ICONS: Record<AuditLog["entity_type"], LucideIcon> = {
  doctor: ShieldCheck,
  user: UserRound,
  appointment: CalendarClock,
  kb_article: BookOpenText,
  report: FileText,
  auth: KeyRound,
};

export const ENTITY_LABELS: Record<AuditLog["entity_type"], string> = {
  doctor: "Doctor",
  user: "User",
  appointment: "Appointment",
  kb_article: "KB article",
  report: "Report",
  auth: "Auth",
};

export const ACTION_GROUPS = [
  { value: "doctor", label: "Doctor verification" },
  { value: "user", label: "User blocking" },
  { value: "appointment", label: "Appointment override" },
  { value: "kb", label: "Knowledge base" },
  { value: "report", label: "Report access" },
  { value: "video", label: "Video tokens" },
  { value: "auth", label: "Sign-ins" },
];

export function isSensitive(action: string) {
  return ["auth.login_failed", "user.block", "doctor.suspend", "doctor.reject", "kb.delete"].includes(action);
}

export function auditSubject(log: AuditLog): string | null {
  const m = log.metadata;
  const text = (key: string) => (typeof m[key] === "string" ? (m[key] as string) : null);
  if (log.entity_type === "appointment" && text("patient") && text("doctor")) return `${text("patient")} with ${text("doctor")}`;
  return text("doctor") ?? text("user") ?? text("title") ?? text("patient") ?? text("email");
}
