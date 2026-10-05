import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router";
import type { Analytics, AuditLog, DoctorList, Paginated } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { formatDay, hoursSince, partOfDay, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { auditSubject, auditVerb, ENTITY_ICONS, isSensitive } from "../audit/auditText";
import { ConsultationsChart, SignupsChart, SpecialityBars } from "./Charts";
import { StatCard } from "./StatCard";

export default function OverviewPage() {
  const { user } = useAuth();
  const { data, error, reload } = useApi<Analytics>("/admin/analytics");
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title={`Good ${partOfDay()}, ${firstName}`}
        description={`Here's how AarogyaHub is doing today, ${formatDay(new Date())}.`}
      />

      {error && (
        <Card>
          <ErrorMessage error={error} onRetry={reload} />
        </Card>
      )}
      {!data && !error && <Spinner />}

      {data && (
        <>
          <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Consultations today"
              value={data.kpis.consultations_today}
              previous={data.kpis.consultations_today_prev}
              compareLabel="vs same day last week"
              to="/admin/appointments?range=today"
              footnote={data.kpis.live_now > 0 && <Badge tone="live">{data.kpis.live_now} live now</Badge>}
            />
            <StatCard
              label="Pending verifications"
              value={data.kpis.pending_verifications}
              to="/admin/verifications"
              highlight={data.kpis.pending_verifications > 0}
              footnote={
                data.kpis.pending_verifications > 0 ? (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Clock className="size-4" aria-hidden />
                    Oldest waiting {data.kpis.oldest_pending_hours}h
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <CheckCircle2 className="size-4 text-success" aria-hidden />
                    Queue is clear
                  </span>
                )
              }
            />
            <StatCard
              label="Active doctors"
              value={data.kpis.active_doctors}
              previous={data.kpis.active_doctors_prev}
              compareLabel="vs last week"
              to="/admin/users?role=doctor"
            />
            <StatCard
              label="New users, 7 days"
              value={data.kpis.new_users_7d}
              previous={data.kpis.new_users_7d_prev}
              compareLabel="vs last week"
              to="/admin/users"
            />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Consultations" description="Last 30 days, by outcome" />
              <div className="p-5">
                <ConsultationsChart data={data.consultations_per_day} />
              </div>
            </Card>
            <WaitingDoctors />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader title="New sign-ups" description="Per week, last 12 weeks" />
              <div className="p-5">
                <SignupsChart data={data.new_users_per_week} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Busiest specialities" description="Completed consultations, 30 days" />
              <div className="p-5">
                <SpecialityBars data={data.top_specializations} />
              </div>
            </Card>
            <RecentActivity />
          </div>
        </>
      )}
    </div>
  );
}

function WaitingDoctors() {
  const { data, error, reload } = useApi<DoctorList>("/admin/doctors", { status: "pending", page_size: 5 });

  return (
    <Card className="flex flex-col">
      <CardHeader title="Needs attention" description="Doctors waiting for verification, oldest first" />
      <div className="flex-1 px-2 py-3">
        {error ? (
          <ErrorMessage error={error} onRetry={reload} />
        ) : !data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No doctors are waiting. New submissions will appear here." />
        ) : (
          <ul>
            {data.items.map((doctor) => (
              <li key={doctor.id}>
                <Link
                  to={`/admin/verifications?open=${doctor.id}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={doctor.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-small font-semibold text-text">{doctor.name}</span>
                    <span className="truncate text-caption text-subtle">
                      {doctor.specialization}, {doctor.council} · {timeAgo(doctor.submitted_at)}
                    </span>
                  </span>
                  {hoursSince(doctor.submitted_at) > 24 && <Badge tone="warning">Over 24h</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!!data?.items.length && (
        <div className="border-t border-border px-5 py-3">
          <Link to="/admin/verifications" className={buttonClass("link")}>
            Open queue ({data.counts.pending})
            <ArrowRight aria-hidden />
          </Link>
        </div>
      )}
    </Card>
  );
}

function RecentActivity() {
  const { data, error, reload } = useApi<Paginated<AuditLog>>("/admin/audit-logs", { page_size: 6 });

  return (
    <Card className="flex flex-col lg:col-span-2 xl:col-span-1">
      <CardHeader title="Recent activity" />
      <div className="flex-1 px-5 py-3">
        {error ? (
          <ErrorMessage error={error} onRetry={reload} />
        ) : !data ? (
          <Spinner />
        ) : (
          <ol className="flex flex-col">
            {data.items.map((log) => {
              const Icon = ENTITY_ICONS[log.entity_type];
              const subject = auditSubject(log);
              return (
                <li key={log.id} className="flex gap-3 py-2">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      isSensitive(log.action) ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 text-small">
                    <p className="text-text">
                      <span className="font-semibold">{log.actor?.name ?? "System"}</span>{" "}
                      <span className="text-muted">{auditVerb(log.action).toLowerCase()}</span>
                      {subject && ` ${subject}`}
                    </p>
                    <p className="text-caption text-subtle">{timeAgo(log.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <div className="border-t border-border px-5 py-3">
        <Link to="/admin/audit" className={buttonClass("link")}>
          Open audit log
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
