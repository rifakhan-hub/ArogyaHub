import { CalendarX } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { STATUS_BORDER } from "@/features/portal/status";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { byStart, isUpcoming, type PatientAppointment } from "./data";
import { usePatientData } from "./PatientLayout";

export default function PatientAppointmentsPage() {
  const { appointments, cancel } = usePatientData();
  const upcoming = appointments.filter(isUpcoming).sort(byStart);
  const past = appointments.filter((a) => !isUpcoming(a)).sort((a, b) => byStart(b, a));

  function handleCancel(appointment: PatientAppointment) {
    cancel(appointment.id);
    toast.success(`Cancelled your consultation with ${appointment.doctor}`);
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
              <Button variant="danger-outline" size="sm" onClick={() => handleCancel(a)}>
                Cancel
              </Button>
            </AppointmentRow>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">Past and cancelled</h2>
        {past.map((a) => (
          <AppointmentRow key={a.id} appointment={a} />
        ))}
      </section>
    </>
  );
}

function AppointmentRow({ appointment, children }: { appointment: PatientAppointment; children?: React.ReactNode }) {
  return (
    <Card
      className={cn("flex flex-wrap items-center justify-between gap-4 border-l-4 p-4", STATUS_BORDER[appointment.status])}
    >
      <div className="flex items-center gap-3">
        <Avatar name={appointment.doctor} />
        <div>
          <p className="font-semibold">{appointment.doctor}</p>
          <p className="text-small text-muted">
            {appointment.speciality} · {formatDateTime(appointment.start)} · {formatINR(appointment.fee)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AppointmentBadge status={appointment.status} />
        {children}
      </div>
    </Card>
  );
}
