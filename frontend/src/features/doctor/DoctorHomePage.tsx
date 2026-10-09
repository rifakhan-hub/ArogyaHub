import { CalendarCheck } from "lucide-react";
import { Link } from "react-router";
import { AppointmentBadge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { daysFromToday, formatTime, todayIST } from "@/lib/dates";
import { firstName } from "@/lib/format";
import { Stat } from "@/features/portal/Stat";
import { useDoctorData } from "./DoctorLayout";

export default function DoctorHomePage() {
  const { user } = useAuth();
  const { appointments, blocks } = useDoctorData();

  const today = appointments
    .filter((a) => todayIST(new Date(a.start)) === daysFromToday(0))
    .sort((a, b) => a.start.localeCompare(b.start));
  const waiting = today.filter((a) => a.status === "scheduled").length;
  const upcoming = appointments.filter((a) => a.status === "scheduled").length;

  return (
    <>
      <title>Home · Doctor portal</title>
      <PageHeader title={`Welcome, Dr. ${firstName(user?.name ?? "")}`} description="Your consultations for today." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Patients today" value={today.length} />
        <Stat label="Still to see today" value={waiting} />
        <Stat label="All upcoming" value={upcoming} />
      </div>

      {blocks.length === 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-body">Patients can't book you until you add your weekly hours.</p>
          <Link to="/doctor/availability" className={buttonClass("primary", "md")}>
            Set availability
          </Link>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-h4 font-semibold">Today's schedule</h2>
        {today.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No consultations today" />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {today.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-4">
                  <span className="w-14 font-mono text-small font-semibold">{formatTime(a.start)}</span>
                  <div>
                    <p className="font-semibold">{a.patient}</p>
                    <p className="text-small text-muted">{a.reason}</p>
                  </div>
                </div>
                <AppointmentBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
