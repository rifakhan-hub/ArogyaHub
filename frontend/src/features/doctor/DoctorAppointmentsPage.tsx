import { CalendarX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cancelAppointment, endConsultation, markNoShow, startConsultation } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { byStart, canStart, isUpcoming } from "@/features/portal/appointments";
import { STATUS_BORDER } from "@/features/portal/status";
import { refreshData, useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { ReportForm } from "./ReportForm";

async function attempt(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    toast.success(success);
    refreshData();
  } catch (err) {
    toast.error((err as ApiError).message);
  }
}

export default function DoctorAppointmentsPage() {
  const { data, error, reload } = useApi<Appointment[]>("/appointments/me");
  const [writing, setWriting] = useState<Appointment | null>(null);

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!data) return <Spinner />;

  const now = new Date();
  const upcoming = data.filter((a) => isUpcoming(a, now)).sort(byStart);
  const past = data.filter((a) => !isUpcoming(a, now)).sort((a, b) => byStart(b, a));

  function actions(a: Appointment) {
    const started = new Date(a.start_time) <= now;
    return (
      <>
        {canStart(a, now) && (
          <Button size="sm" onClick={() => attempt(() => startConsultation(a.id), `Started with ${a.patient_name}`)}>
            Start consultation
          </Button>
        )}
        {a.status === "in_progress" && (
          <>
            <Button variant="outline" size="sm" onClick={() => setWriting(a)}>
              Write report
            </Button>
            <Button size="sm" onClick={() => attempt(() => endConsultation(a.id), `Ended with ${a.patient_name}`)}>
              End consultation
            </Button>
          </>
        )}
        {a.status === "scheduled" && started && (
          <Button variant="outline" size="sm" onClick={() => attempt(() => markNoShow(a.id), `${a.patient_name}: no-show`)}>
            No-show
          </Button>
        )}
        {a.status === "scheduled" && !started && (
          <Button
            variant="danger-outline"
            size="sm"
            onClick={() => attempt(() => cancelAppointment(a.id), `Cancelled ${a.patient_name}'s consultation`)}
          >
            Cancel
          </Button>
        )}
      </>
    );
  }

  return (
    <>
      <title>Appointments · Doctor portal</title>
      <PageHeader
        title="Appointments"
        description="Start a consultation from 10 minutes before its time, then write the report."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarX} title="No upcoming consultations" />
          </Card>
        ) : (
          upcoming.map((a) => (
            <AppointmentRow key={a.id} appointment={a}>
              {actions(a)}
            </AppointmentRow>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Finished</h2>
        {past.length === 0 && <p className="text-small text-muted">Nothing here yet.</p>}
        {past.map((a) => (
          <AppointmentRow key={a.id} appointment={a}>
            {a.status === "completed" && (
              <Button variant="outline" size="sm" onClick={() => setWriting(a)}>
                Report
              </Button>
            )}
            {a.status === "scheduled" && actions(a)}
          </AppointmentRow>
        ))}
      </section>

      <ReportForm appointment={writing} onClose={() => setWriting(null)} />
    </>
  );
}

function AppointmentRow({ appointment, children }: { appointment: Appointment; children?: React.ReactNode }) {
  return (
    <Card
      className={cn("flex flex-wrap items-center justify-between gap-4 border-l-4 p-4", STATUS_BORDER[appointment.status])}
    >
      <div className="flex items-center gap-3">
        <Avatar name={appointment.patient_name} />
        <div>
          <p className="font-semibold">{appointment.patient_name}</p>
          <p className="text-small text-muted">
            {formatDateTime(appointment.start_time)} · {appointment.reason ?? "No reason given"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AppointmentBadge status={appointment.status} />
        {children}
      </div>
    </Card>
  );
}
