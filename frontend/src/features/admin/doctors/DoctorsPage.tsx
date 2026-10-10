import { useState } from "react";
import type { Doctor, Paginated } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SearchBox } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { formatDate } from "@/lib/dates";
import { DoctorPanel } from "./DoctorPanel";

const PAGE_SIZE = 20;

const TABS = [
  { value: "pending", label: "Waiting for review" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

const COLUMNS: Column<Doctor>[] = [
  {
    header: "Doctor",
    cell: (d) => (
      <span className="flex items-center gap-3">
        <Avatar name={d.name} size="sm" />
        <span>
          <span className="block font-semibold">{d.name}</span>
          <span className="block text-small text-muted">{d.email}</span>
        </span>
      </span>
    ),
  },
  { header: "Speciality", cell: (d) => d.specialization },
  {
    header: "Licence",
    cell: (d) => (
      <span>
        <span className="block font-mono text-small">{d.license_number}</span>
        <span className="block text-small text-muted">{d.council}</span>
      </span>
    ),
  },
  { header: "Submitted", cell: (d) => formatDate(d.submitted_at) },
  { header: "Status", cell: (d) => <VerificationBadge status={d.verification_status} /> },
];

export default function DoctorsPage() {
  const [status, setStatus] = useState("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const q = useDebounced(query, 300);

  const { data, loading, error, reload } = useApi<Paginated<Doctor>>("/admin/doctors", {
    status,
    q,
    page,
    page_size: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <title>Doctors · AarogyaHub Admin</title>
      <PageHeader title="Doctors" description="Check each doctor's licence, then approve or reject their profile." />

      <Tabs
        label="Doctor status"
        tabs={TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <SearchBox
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Search name, email, speciality or licence"
      />

      <Card className="overflow-hidden">
        <Table
          caption="Doctors"
          columns={COLUMNS}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={setSelected}
          activeId={selected?.id}
        />
      </Card>

      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}

      <DoctorPanel doctor={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
