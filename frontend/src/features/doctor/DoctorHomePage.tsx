import { CalendarCheck, CalendarDays, Clock, Users } from "lucide-react";
import { Link } from "react-router";
import { AppointmentBadge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/features/portal/Stat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { formatRelativeDay, formatTime, todayIST } from "@/lib/dates";
import { firstName } from "@/lib/format";
import { dateKey } from "./calendar";
import { STATUS_BORDER } from "./data";
import { useDoctorData } from "./DoctorLayout";

export default function DoctorHomePage() {
  const { user } = useAuth();
  const { appointments, blocks } = useDoctorData();

  const sorted = [...appointments].sort((a, b) => a.start.localeCompare(b.start));
  const today = sorted.filter((a) => dateKey(a.start) === todayIST());
  const upcoming = sorted.filter((a) => a.status === "scheduled");
  const next = upcoming[0];

  return (
    <>
      <title>Home · Doctor portal</title>
      <PageHeader
        title={`Welcome, Dr. ${firstName(user?.name ?? "")}`}
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
        <Stat icon={Clock} label="Still to see today" value={today.filter((a) => a.status === "scheduled").length} />
        <Stat icon={CalendarCheck} label="All upcoming" value={upcoming.length} />
      </div>

      {next && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary p-6 text-on-primary shadow-2">
          <div>
            <p className="text-small opacity-80">Next patient</p>
            <p className="mt-1 text-h3 font-semibold">{next.patient}</p>
            <p className="mt-1 text-small opacity-90">{next.reason}</p>
          </div>
          <div className="text-right">
            <p className="text-h3 font-semibold tabular-nums">{formatTime(next.start)}</p>
            <p className="text-small opacity-80">{formatRelativeDay(next.start)}</p>
          </div>
        </div>
      )}

      {blocks.length === 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-body">Patients can't book you until you add your weekly hours.</p>
          <Link to="/doctor/schedule" className={buttonClass("primary", "md")}>
            Set your hours
          </Link>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-h4 font-semibold">Today's schedule</h2>
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
                  <span className="w-14 font-mono text-body font-semibold">{formatTime(a.start)}</span>
                  <div>
                    <p className="font-semibold">{a.patient}</p>
                    <p className="text-small text-muted">{a.reason}</p>
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
