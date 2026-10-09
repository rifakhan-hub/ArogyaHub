import { CalendarPlus, CalendarX } from "lucide-react";
import { Link } from "react-router";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeDay, formatTime } from "@/lib/dates";
import { firstName, formatINR } from "@/lib/format";
import { Stat } from "@/features/portal/Stat";
import { byStart, isUpcoming } from "./data";
import { usePatientData } from "./PatientLayout";

export default function PatientHomePage() {
  const { user } = useAuth();
  const { appointments } = usePatientData();

  const upcoming = appointments.filter(isUpcoming).sort(byStart);
  const completed = appointments.filter((a) => a.status === "completed");
  const doctorsSeen = new Set(completed.map((a) => a.doctor)).size;
  const next = upcoming[0];

  return (
    <>
      <title>Home · Patient portal</title>
      <PageHeader
        title={`Welcome, ${firstName(user?.name ?? "")}`}
        description="Your consultations at a glance."
        actions={
          <Link to="/patient/doctors" className={buttonClass("primary", "md")}>
            <CalendarPlus aria-hidden />
            Book a consultation
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming consultations" value={upcoming.length} />
        <Stat label="Completed consultations" value={completed.length} />
        <Stat label="Doctors seen" value={doctorsSeen} />
      </div>

      <Card className="p-6">
        <h2 className="text-h4 font-semibold">Next consultation</h2>
        {next ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-body-lg font-semibold">{next.doctor}</p>
              <p className="text-small text-muted">
                {next.speciality} · {formatRelativeDay(next.start)} at {formatTime(next.start)} · {formatINR(next.fee)}
              </p>
            </div>
            <Link to="/patient/appointments" className={buttonClass("outline", "md")}>
              View my appointments
            </Link>
          </div>
        ) : (
          <EmptyState
            icon={CalendarX}
            title="No upcoming consultations"
            body="Find a doctor and pick a time that suits you."
            action={
              <Link to="/patient/doctors" className={buttonClass("primary", "md")}>
                Find a doctor
              </Link>
            }
          />
        )}
      </Card>
    </>
  );
}
