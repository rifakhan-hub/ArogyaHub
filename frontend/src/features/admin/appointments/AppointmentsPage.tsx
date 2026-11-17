import { CalendarCheck, CalendarClock, CalendarX, Video } from "lucide-react";
import { useState } from "react";
import type {
  Appointment,
  AppointmentDetail,
  AppointmentSummary,
  Consultation,
  Paginated,
} from "@/api/types";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input, SearchBox, Select } from "@/components/ui/Input";
import { DetailList, PanelBody, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { type Column, Table } from "@/components/ui/Table";
import { ReportView } from "@/features/portal/ConsultationReportModal";
import { Stat } from "@/features/portal/Stat";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { formatDateTime, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "Live now" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const COLUMNS: Column<Appointment>[] = [
  { header: "When", cell: (a) => formatDateTime(a.start_time) },
  {
    header: "Patient",
    cell: (a) => <span className="font-semibold">{a.patient_name}</span>,
  },
  {
    header: "Doctor",
    cell: (a) => (
      <span>
        <span className="block">{a.doctor_name}</span>
        <span className="text-small text-muted block">{a.specialization}</span>
      </span>
    ),
  },
  { header: "Fee", cell: (a) => formatINR(a.fee) },
  { header: "Status", cell: (a) => <AppointmentBadge status={a.status} /> },
];

export default function AppointmentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [day, setDay] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const q = useDebounced(query, 300);

  const summary = useApi<AppointmentSummary>("/admin/appointments/summary").data;
  const { data, loading, error, reload } = useApi<Paginated<Appointment>>("/admin/appointments", {
    q,
    status,
    date: day,
    page,
    page_size: PAGE_SIZE,
  });

  function filter(set: (value: string) => void) {
    return (value: string) => {
      set(value);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Appointments · AarogyaHub Admin</title>
      <PageHeader
        title="Appointments"
        description="Every booking and consultation. Open one to see the consultation and the doctor's notes."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarClock} label="All appointments" value={summary?.total ?? "—"} />
        <Stat
          icon={Video}
          label="Upcoming or live"
          value={summary ? summary.scheduled + summary.in_progress : "—"}
        />
        <Stat
          icon={CalendarCheck}
          label="Completed consultations"
          value={summary?.completed ?? "—"}
        />
        <Stat
          icon={CalendarX}
          label="Cancelled or no-show"
          value={summary ? summary.cancelled + summary.no_show : "—"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox
          value={query}
          onChange={filter(setQuery)}
          placeholder="Search patient or doctor"
        />
        <Select
          aria-label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={filter(setStatus)}
          className="w-48"
        />
        <div className="w-44">
          <Input
            type="date"
            aria-label="Day"
            value={day}
            onChange={(e) => filter(setDay)(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table
          caption="Appointments"
          columns={COLUMNS}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={setSelected}
          activeId={selected?.id}
        />
      </Card>

      {data && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
      )}

      <AppointmentPanel appointment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AppointmentPanel({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const { data, error } = useApi<AppointmentDetail>(
    appointment ? `/admin/appointments/${appointment.id}` : null,
  );

  return (
    <SidePanel
      open={appointment !== null}
      onClose={onClose}
      label={appointment ? `Appointment with ${appointment.doctor_name}` : "Appointment"}
    >
      {appointment && (
        <>
          <PanelHeader>
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-h3 font-semibold">
                {appointment.patient_name} with {appointment.doctor_name}
              </h2>
              <p className="text-small text-muted">{formatDateTime(appointment.start_time)}</p>
              <AppointmentBadge status={appointment.status} />
            </div>
          </PanelHeader>
          <PanelBody>
            <DetailList
              items={[
                ["Patient", appointment.patient_name],
                ["Doctor", `${appointment.doctor_name} · ${appointment.specialization}`],
                [
                  "Time",
                  `${formatDateTime(appointment.start_time)}–${formatTime(appointment.end_time)}`,
                ],
                ["Fee", formatINR(appointment.fee)],
                ["Reason", appointment.reason ?? "Not given"],
                ["Booked", formatDateTime(appointment.created_at)],
                ...(appointment.cancel_reason
                  ? ([["Cancel reason", appointment.cancel_reason]] as [string, string][])
                  : []),
              ]}
            />

            {error ? (
              <ErrorMessage error={error} />
            ) : !data ? (
              <Spinner />
            ) : (
              <>
                <section className="flex flex-col gap-2">
                  <h3 className="text-small text-subtle font-semibold">Consultation</h3>
                  <ConsultationTimes consultation={data.consultation} />
                </section>
                <section className="flex flex-col gap-4">
                  <h3 className="text-small text-subtle font-semibold">Notes and prescription</h3>
                  {data.report ? (
                    <ReportView report={data.report} />
                  ) : (
                    <p className="text-small text-muted">
                      The doctor hasn't written notes for this one.
                    </p>
                  )}
                </section>
              </>
            )}
          </PanelBody>
        </>
      )}
    </SidePanel>
  );
}

function ConsultationTimes({ consultation }: { consultation: Consultation | null }) {
  if (!consultation) {
    return <p className="text-small text-muted">The consultation hasn't started.</p>;
  }
  const minutes = consultation.ended_at
    ? Math.round(
        (new Date(consultation.ended_at).getTime() - new Date(consultation.started_at).getTime()) /
          60_000,
      )
    : null;

  return (
    <DetailList
      items={[
        ["Started", formatDateTime(consultation.started_at)],
        ["Ended", consultation.ended_at ? formatDateTime(consultation.ended_at) : "Still live"],
        ["Length", minutes === null ? "—" : `${minutes} min`],
      ]}
    />
  );
}
