import { CalendarX } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentStatus } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { type DoctorAppointment, STATUS_BORDER } from "./data";
import { useDoctorData } from "./DoctorLayout";

export default function DoctorAppointmentsPage() {
  const { appointments, setStatus } = useDoctorData();
  const upcoming = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.start.localeCompare(b.start));
  const past = appointments
    .filter((a) => a.status !== "scheduled")
    .sort((a, b) => b.start.localeCompare(a.start));

  function update(appointment: DoctorAppointment, status: AppointmentStatus, message: string) {
    setStatus(appointment.id, status);
    toast.success(`${appointment.patient}: ${message}`);
  }

  return (
    <>
      <title>Appointments · Doctor portal</title>
      <PageHeader title="Appointments" description="Mark each consultation when it ends." />

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarX} title="No upcoming consultations" />
          </Card>
        ) : (
          upcoming.map((a) => (
            <AppointmentRow key={a.id} appointment={a}>
              <Button variant="outline" size="sm" onClick={() => update(a, "no_show", "marked as no-show")}>
                No-show
              </Button>
              <Button size="sm" onClick={() => update(a, "completed", "marked as done")}>
                Mark done
              </Button>
            </AppointmentRow>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Finished</h2>
        {past.map((a) => (
          <AppointmentRow key={a.id} appointment={a} />
        ))}
      </section>
    </>
  );
}

function AppointmentRow({ appointment, children }: { appointment: DoctorAppointment; children?: React.ReactNode }) {
  return (
    <Card
      className={cn("flex flex-wrap items-center justify-between gap-4 border-l-4 p-4", STATUS_BORDER[appointment.status])}
    >
      <div className="flex items-center gap-3">
        <Avatar name={appointment.patient} />
        <div>
          <p className="font-semibold">{appointment.patient}</p>
          <p className="text-small text-muted">
            {formatDateTime(appointment.start)} · {appointment.reason}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AppointmentBadge status={appointment.status} />
        {children}
      </div>
    </Card>
  );
}
