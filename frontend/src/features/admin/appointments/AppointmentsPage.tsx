import { CalendarX2, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { Appointment, Paginated } from "@/api/types";
import { APPOINTMENT_LABELS, AppointmentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { daysFromToday, formatRelativeDay, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { AppointmentPanel, shortId } from "./AppointmentPanel";

const PAGE_SIZE = 20;

function dateRange(range: string) {
  if (range === "today") return { from: daysFromToday(0), to: daysFromToday(0) };
  if (range === "upcoming") return { from: daysFromToday(0), to: daysFromToday(7) };
  if (range === "past7") return { from: daysFromToday(-7), to: daysFromToday(0) };
  if (range === "past30") return { from: daysFromToday(-30), to: daysFromToday(0) };
  return {};
}

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState(searchParams.get("range") ?? "");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi<Paginated<Appointment>>("/admin/appointments", {
    q: useDebounced(search),
    status,
    ...dateRange(range),
    page,
    page_size: PAGE_SIZE,
  });

  function changeFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: Column<Appointment>[] = [
    {
      header: "When (IST)",
      cell: (a) => (
        <div className="flex flex-col">
          <button type="button" onClick={() => setOpenId(a.id)} className="text-left font-semibold text-text hover:underline">
            {formatRelativeDay(a.start_time)}, {formatTime(a.start_time)}
          </button>
          <span className="font-mono text-caption text-subtle">{shortId(a.id)}</span>
        </div>
      ),
    },
    { header: "Patient", cell: (a) => <span className="text-text">{a.patient.name}</span> },
    {
      header: "Doctor",
      className: "hidden md:table-cell",
      cell: (a) => (
        <div className="flex flex-col">
          <span className="text-text">{a.doctor.name}</span>
          <span className="text-caption text-subtle">{a.doctor.specialization}</span>
        </div>
      ),
    },
    { header: "Length", className: "hidden lg:table-cell", cell: (a) => <span className="text-muted">{a.slot_duration_min} min</span> },
    { header: "Fee", className: "hidden sm:table-cell", cell: (a) => formatINR(a.fee_snapshot) },
    { header: "Status", cell: (a) => <AppointmentBadge status={a.status} /> },
  ];

  const filtered = search || status || range;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Appointments" description="All consultations. Times shown in India Standard Time." />

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={changeFilter(setSearch)} placeholder="Search patient, doctor or appointment ID" />
        <Select
          aria-label="Date"
          value={range}
          onChange={changeFilter(setRange)}
          options={[
            { value: "", label: "All dates" },
            { value: "today", label: "Today" },
            { value: "upcoming", label: "Next 7 days" },
            { value: "past7", label: "Past 7 days" },
            { value: "past30", label: "Past 30 days" },
          ]}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={changeFilter(setStatus)}
          options={[{ value: "", label: "Any status" }, ...Object.entries(APPOINTMENT_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatus("");
              setRange("");
              setPage(1);
            }}
          >
            <X aria-hidden />
            Clear filters
          </Button>
        )}
      </div>

      <Card>
        <Table
          caption="Appointments"
          columns={columns}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(a) => setOpenId(a.id)}
          activeId={openId}
          empty={<EmptyState icon={CalendarX2} title="No consultations match these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
      </Card>

      {openId && <AppointmentPanel key={openId} appointmentId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
