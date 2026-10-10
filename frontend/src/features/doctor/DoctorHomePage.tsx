import { CalendarCheck, CalendarDays, Clock, Users } from "lucide-react";
import { Link } from "react-router";
import type { Appointment } from "@/api/types";
import { AppointmentBadge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { byStart, isUpcoming } from "@/features/portal/appointments";
import { Stat } from "@/features/portal/Stat";
import { STATUS_BORDER } from "@/features/portal/status";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatRelativeDay, formatTime, todayIST } from "@/lib/dates";
import { firstName } from "@/lib/format";
import { useDoctorData } from "./DoctorLayout";

export default function DoctorHomePage() {
  const { profile } = useDoctorData();
  const { data, error, reload } = useApi<Appointment[]>("/appointments/me");

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!data) return <Spinner />;

  const sorted = [...data].sort(byStart);
  const today = sorted.filter((a) => todayIST(new Date(a.start_time)) === todayIST() && a.status !== "cancelled");
  const upcoming = sorted.filter((a) => isUpcoming(a));
  const next = upcoming[0];

  return (
    <>
      <title>Home · Doctor portal</title>
      <PageHeader
        title={`Welcome, Dr. ${firstName(profile.name)}`}
        description="Here's your day at a glance."
        actions={
          <Link to="/doctor/schedule" className={buttonClass("outline", "md")}>
            <CalendarDays aria-hidden />
            Open schedule
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Patients today" value={today.length} />
        <Stat icon={Clock} label="Still to see today" value={today.filter((a) => isUpcoming(a)).length} />
        <Stat icon={CalendarCheck} label="All upcoming" value={upcoming.length} />
      </div>

      {next && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary p-6 text-on-primary shadow-2">
          <div>
            <p className="text-small opacity-80">Next patient</p>
            <p className="mt-1 text-h3 font-semibold">{next.patient_name}</p>
            <p className="mt-1 text-small opacity-90">{next.reason ?? "No reason given"}</p>
          </div>
          <div className="text-right">
            <p className="text-h3 font-semibold tabular-nums">{formatTime(next.start_time)}</p>
            <p className="text-small opacity-80">{formatRelativeDay(next.start_time)}</p>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h4 font-semibold">Today's schedule</h2>
          <Link to="/doctor/appointments" className="text-small font-semibold text-primary hover:underline">
            All appointments
          </Link>
        </div>
        {today.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No consultations today" />
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {today.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-md border border-l-4 border-border bg-surface px-4 py-3",
                  STATUS_BORDER[a.status],
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 font-mono text-body font-semibold">{formatTime(a.start_time)}</span>
                  <div>
                    <p className="font-semibold">{a.patient_name}</p>
                    <p className="text-small text-muted">{a.reason ?? "No reason given"}</p>
                  </div>
                </div>
                <AppointmentBadge status={a.status} />
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
