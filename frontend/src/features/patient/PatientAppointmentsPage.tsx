import { CalendarX } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { cancelAppointment } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { byStart, isUpcoming } from "@/features/portal/appointments";
import { ConsultationReportModal } from "@/features/portal/ConsultationReportModal";
import { STATUS_BORDER } from "@/features/portal/status";
import { refreshData, useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export default function PatientAppointmentsPage() {
  const { data, error, reload } = useApi<Appointment[]>("/appointments/me");
  const [viewing, setViewing] = useState<Appointment | null>(null);

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!data) return <Spinner />;

  const upcoming = data.filter((a) => isUpcoming(a)).sort(byStart);
  const past = data.filter((a) => !isUpcoming(a)).sort((a, b) => byStart(b, a));

  async function handleCancel(appointment: Appointment) {
    try {
      await cancelAppointment(appointment.id);
      toast.success(`Cancelled your consultation with ${appointment.doctor_name}`);
      refreshData();
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  }

  return (
    <>
      <title>My appointments · Patient portal</title>
      <PageHeader
        title="My appointments"
        actions={
          <Link to="/patient/doctors" className={buttonClass("primary", "md")}>
            Book a consultation
          </Link>
        }
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
              {a.status === "scheduled" && (
                <Button variant="danger-outline" size="sm" onClick={() => handleCancel(a)}>
                  Cancel
                </Button>
              )}
            </AppointmentRow>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Past and cancelled</h2>
        {past.length === 0 && <p className="text-small text-muted">Nothing here yet.</p>}
        {past.map((a) => (
          <AppointmentRow key={a.id} appointment={a}>
            {a.status === "completed" && (
              <Button variant="outline" size="sm" onClick={() => setViewing(a)}>
                View report
              </Button>
            )}
          </AppointmentRow>
        ))}
      </section>

      <ConsultationReportModal appointment={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

function AppointmentRow({ appointment, children }: { appointment: Appointment; children?: React.ReactNode }) {
  return (
    <Card
      className={cn("flex flex-wrap items-center justify-between gap-4 border-l-4 p-4", STATUS_BORDER[appointment.status])}
    >
      <div className="flex items-center gap-3">
        <Avatar name={appointment.doctor_name} />
        <div>
          <p className="font-semibold">{appointment.doctor_name}</p>
          <p className="text-small text-muted">
            {appointment.specialization} · {formatDateTime(appointment.start_time)} · {formatINR(appointment.fee)}
          </p>
          {appointment.cancel_reason && <p className="text-small text-muted">Reason: {appointment.cancel_reason}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AppointmentBadge status={appointment.status} />
        {children}
      </div>
    </Card>
  );
}
