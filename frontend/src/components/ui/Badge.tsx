import type { AppointmentStatus, KbStatus, Role, VerificationStatus } from "@/api/types";
import { cn } from "@/lib/cn";

const tones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-sindoor-700 dark:text-sindoor-300",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-muted text-muted",
  live: "bg-primary text-on-primary",
  admin: "bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900",
};

type Tone = keyof typeof tones;

/** A small rounded label. It always has a dot and text, so it never relies on colour alone (design doc 2.3). */
export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-caption font-medium",
        tones[tone],
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current", tone === "live" && "animate-live-pulse")} />
      {children}
    </span>
  );
}

/* ---------- labels, shared by badges, filters and tables ---------- */

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const APPOINTMENT_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "Live now",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const ROLE_LABELS: Record<Role | "visitor", string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Admin",
  visitor: "Visitor",
};

export const CATEGORY_LABELS = { faq: "FAQ", howto: "How-to", health: "Health" };

/* ---------- one badge per kind of status ---------- */

const verificationTones: Record<VerificationStatus, Tone> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
  suspended: "neutral",
};

const appointmentTones: Record<AppointmentStatus, Tone> = {
  scheduled: "info",
  in_progress: "live",
  completed: "success",
  cancelled: "danger",
  no_show: "warning",
};

const roleTones: Record<Role, Tone> = { patient: "success", doctor: "info", admin: "admin" };

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge tone={verificationTones[status]}>{VERIFICATION_LABELS[status]}</Badge>;
}

export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={appointmentTones[status]}>{APPOINTMENT_LABELS[status]}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTones[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function UserStatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "danger"}>{active ? "Active" : "Blocked"}</Badge>;
}

export function ArticleStatusBadge({ status }: { status: KbStatus }) {
  return (
    <Badge tone={status === "published" ? "success" : "neutral"}>{status === "published" ? "Published" : "Draft"}</Badge>
  );
}
