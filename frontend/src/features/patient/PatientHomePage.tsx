import { CalendarCheck, CalendarPlus, ClipboardCheck, FileText, Upload } from "lucide-react";
import { Link } from "react-router";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/features/portal/Stat";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatRelativeDay, formatTime } from "@/lib/dates";
import { firstName, formatINR } from "@/lib/format";
import { byStart, isUpcoming } from "./data";
import { usePatientData } from "./PatientLayout";

export default function PatientHomePage() {
  const { user } = useAuth();
  const { appointments, reports } = usePatientData();

  const upcoming = appointments.filter(isUpcoming).sort(byStart);
  const completed = appointments.filter((a) => a.status === "completed");
  const next = upcoming[0];
  const recentReports = [...reports].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 3);

  return (
    <>
      <title>Home · Patient portal</title>
      <PageHeader
        title={`Welcome, ${firstName(user?.name ?? "")}`}
        description="Your consultations and reports at a glance."
        actions={
          <Link to="/patient/doctors" className={buttonClass("primary", "md")}>
            <CalendarPlus aria-hidden />
            Book a consultation
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CalendarCheck} label="Upcoming consultations" value={upcoming.length} />
        <Stat icon={ClipboardCheck} label="Completed consultations" value={completed.length} />
        <Stat icon={FileText} label="Reports" value={reports.length} />
      </div>

      {next ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary p-6 text-on-primary shadow-2">
          <div>
            <h2 className="text-small opacity-80">Next consultation</h2>
            <p className="mt-1 text-h3 font-semibold">{next.doctor}</p>
            <p className="mt-1 text-small opacity-90">
              {next.speciality} · {formatINR(next.fee)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-h3 font-semibold tabular-nums">{formatTime(next.start)}</p>
            <p className="text-small opacity-80">{formatRelativeDay(next.start)}</p>
          </div>
        </div>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-h4 font-semibold">Next consultation</h2>
            <p className="text-small text-muted">You have nothing booked. Find a doctor and pick a time.</p>
          </div>
          <Link to="/patient/doctors" className={buttonClass("primary", "md")}>
            Find a doctor
          </Link>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h4 font-semibold">Recent reports</h2>
          <Link to="/patient/reports" className="text-small font-semibold text-primary hover:underline">
            All reports
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-small text-muted">No reports yet.</p>
            <Link to="/patient/reports" className={buttonClass("outline", "sm")}>
              <Upload aria-hidden />
              Upload
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recentReports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate text-small font-medium">{r.name}</span>
                </span>
                <span className="text-small text-muted">{formatDate(r.uploadedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
