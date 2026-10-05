import { Ban, CheckCheck, FileText, UserX } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { overrideAppointment } from "@/api/admin";
import type { Appointment, AppointmentOverride } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentBadge, ROLE_LABELS } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatDateTime, formatTime, timeAgo } from "@/lib/dates";
import { formatINR, plural } from "@/lib/format";

export const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

type Override = AppointmentOverride["status"];

const OVERRIDES: Record<Override, { button: string; icon: typeof Ban; title: string; body: string; done: string }> = {
  completed: {
    button: "Mark completed",
    icon: CheckCheck,
    title: "Mark as completed?",
    body: "Use when the call finished but the status didn't update, for example after a dropped connection.",
    done: "Marked as completed.",
  },
  no_show: {
    button: "Mark no-show",
    icon: UserX,
    title: "Mark as no-show?",
    body: "Records that the patient didn't join. The patient is offered a rebooking.",
    done: "Marked as no-show.",
  },
  cancelled: {
    button: "Cancel appointment",
    icon: Ban,
    title: "Cancel this appointment?",
    body: "The patient and the doctor will be notified. The patient gets a full refund.",
    done: "Cancelled. Both sides have been notified.",
  },
};

export function AppointmentPanel({ appointmentId, onClose }: { appointmentId: string; onClose: () => void }) {
  const { data, error, reload } = useApi<Appointment>(`/admin/appointments/${appointmentId}`);

  return (
    <SidePanel open onClose={onClose} label="Consultation">
      {error ? (
        <div className="flex flex-1 items-center">
          <ErrorMessage error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <Spinner />
      ) : (
        <AppointmentDetails appointment={data} />
      )}
    </SidePanel>
  );
}

function AppointmentDetails({ appointment: a }: { appointment: Appointment }) {
  const [chosen, setChosen] = useState<Override | null>(null);
  const [openedAt] = useState(Date.now);
  const started = Date.parse(a.start_time) <= openedAt;
  const isOpen = a.status === "scheduled" || a.status === "in_progress";

  const allowed: Override[] = [];
  if (a.status === "in_progress" || a.status === "no_show") allowed.push("completed");
  if (isOpen && started) allowed.push("no_show");
  if (isOpen) allowed.push("cancelled");

  async function applyOverride(reason: string) {
    if (!chosen) return;
    try {
      await overrideAppointment(a.id, chosen, reason);
      toast.success(OVERRIDES[chosen].done);
      setChosen(null);
      refreshData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const facts = [
    ["When", `${formatDateTime(a.start_time)} to ${formatTime(a.end_time)}`],
    ["Length", `${a.slot_duration_min} min`],
    ["Fee", formatINR(a.fee_snapshot)],
    ["Reports shared", a.reports_shared ? plural(a.reports_shared, "report") : "None"],
  ];

  const people = [
    { role: "Patient", name: a.patient.name, detail: null, to: `/admin/users?open=${a.patient.id}` },
    { role: "Doctor", name: a.doctor.name, detail: a.doctor.specialization, to: `/admin/verifications?status=all&open=${a.doctor.id}` },
  ];

  return (
    <>
      <PanelHeader>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-h3 text-text">Consultation</h2>
          <AppointmentBadge status={a.status} />
        </div>
        <p className="mt-1 font-mono text-caption text-subtle">{a.id}</p>
      </PanelHeader>

      <PanelBody>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-surface p-4">
              <dt className="text-caption font-medium text-subtle">{label}</dt>
              <dd className="mt-0.5 text-small font-semibold text-text tabular">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <Link
              key={p.role}
              to={p.to}
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <Avatar name={p.name} />
              <span className="min-w-0">
                <span className="block text-caption text-subtle">{p.role}</span>
                <span className="block truncate text-small font-semibold text-text">{p.name}</span>
                {p.detail && <span className="block truncate text-caption text-subtle">{p.detail}</span>}
              </span>
            </Link>
          ))}
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-body font-semibold">
            <FileText className="size-4 text-subtle" aria-hidden />
            Reason for visit
          </h3>
          <p className="rounded-md bg-surface-muted px-4 py-3 text-small text-text">{a.reason}</p>
          {a.cancel_reason && (
            <p className="text-small text-muted">
              Cancelled by {ROLE_LABELS[a.cancelled_by ?? "admin"].toLowerCase()}: {a.cancel_reason}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-body font-semibold">Timeline</h3>
          <ol className="ml-2 border-l border-border">
            {a.history.map((event, i) => (
              <li key={i} className="relative pb-5 pl-6 last:pb-0">
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-surface",
                    i === a.history.length - 1 ? "bg-primary" : "bg-stone-300 dark:bg-stone-600",
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <AppointmentBadge status={event.status} />
                  <span className="text-caption text-subtle tabular">
                    {formatDateTime(event.at)} · {timeAgo(event.at)}
                  </span>
                </div>
                <p className="mt-1 text-small text-text">
                  {event.note && `${event.note} · `}
                  <span className="text-muted">{event.by}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </PanelBody>

      <PanelFooter>
        <div className="flex w-full flex-col gap-3">
          <div>
            <p className="text-small font-semibold text-text">Admin override</p>
            <p className="text-caption text-subtle">
              {allowed.length
                ? "Use only in exceptional cases. Patient and doctor are notified, and the change is logged."
                : "This consultation is closed. No overrides are available."}
            </p>
          </div>
          {allowed.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allowed.map((option) => {
                const Icon = OVERRIDES[option].icon;
                return (
                  <Button
                    key={option}
                    size="sm"
                    variant={option === "cancelled" ? "danger-ghost" : "outline"}
                    onClick={() => setChosen(option)}
                  >
                    <Icon aria-hidden />
                    {OVERRIDES[option].button}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </PanelFooter>

      <ConfirmDialog
        open={chosen !== null}
        onClose={() => setChosen(null)}
        title={chosen ? OVERRIDES[chosen].title : ""}
        body={chosen ? OVERRIDES[chosen].body : ""}
        confirmLabel={chosen ? OVERRIDES[chosen].button : ""}
        danger={chosen === "cancelled"}
        reasonLabel="Reason for override"
        reasonHint="Kept in the audit log and shown on the appointment timeline."
        onConfirm={applyOverride}
      />
    </>
  );
}
