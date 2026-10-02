// Turns raw audit entries ("doctor.approve", metadata) into readable text and icons.
// Used by the audit log page, the overview's "Recent activity" and the CSV export.
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

/** "doctor.approve" -> "Approved doctor". Unknown actions are shown as they are. */
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

/** Filter options: each group matches every action that starts with it, e.g. "doctor." */
export const ACTION_GROUPS = [
  { value: "doctor", label: "Doctor verification" },
  { value: "user", label: "User blocking" },
  { value: "appointment", label: "Appointment override" },
  { value: "kb", label: "Knowledge base" },
  { value: "report", label: "Report access" },
  { value: "video", label: "Video tokens" },
  { value: "auth", label: "Sign-ins" },
];

/** Actions shown in red: failed sign-ins, blocks, rejections, suspensions, deletions. */
export function isSensitive(action: string) {
  return ["auth.login_failed", "user.block", "doctor.suspend", "doctor.reject", "kb.delete"].includes(action);
}

/** Who or what the entry is about, taken from its metadata: a doctor's name, an article title, ... */
export function auditSubject(log: AuditLog): string | null {
  const m = log.metadata;
  const text = (key: string) => (typeof m[key] === "string" ? (m[key] as string) : null);
  if (log.entity_type === "appointment" && text("patient") && text("doctor")) return `${text("patient")} with ${text("doctor")}`;
  return text("doctor") ?? text("user") ?? text("title") ?? text("patient") ?? text("email");
}
