import { CheckCircle2, Inbox } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { Doctor, DoctorList } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { hoursSince, timeAgo } from "@/lib/dates";
import { ReviewPanel } from "./ReviewPanel";

const PAGE_SIZE = 20;

/** The doctor verification queue: pick a doctor, check their documents, approve or reject. */
export default function VerificationsPage() {
  const [searchParams] = useSearchParams();
  // links from other pages can open a doctor directly: /admin/verifications?open=<id>&status=all
  const [status, setStatus] = useState(searchParams.get("status") ?? "pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("open"));

  const { data, loading, error, reload } = useApi<DoctorList>("/admin/doctors", {
    status: status === "all" ? undefined : status,
    q: useDebounced(search),
    page,
    page_size: PAGE_SIZE,
  });
  const counts = data?.counts;
  const rows = data?.items;

  // after a decision on the Pending tab, move on to the next doctor in the list
  function openNextDoctor() {
    const index = rows?.findIndex((d) => d.id === openId) ?? -1;
    const next = status === "pending" && index >= 0 ? rows?.[index + 1] : undefined;
    setOpenId(next?.id ?? null);
  }

  const columns: Column<Doctor>[] = [
    {
      header: "Doctor",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} className="max-sm:hidden" />
          <div className="min-w-0 max-w-44 sm:max-w-xs">
            <button type="button" onClick={() => setOpenId(d.id)} className="block truncate text-left font-semibold text-text hover:underline">
              {d.name}
            </button>
            <span className="block truncate text-caption text-subtle">
              {d.specialization}
              <span className="sm:hidden"> · {d.council}, {timeAgo(d.submitted_at)}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Council",
      className: "hidden sm:table-cell",
      cell: (d) => (
        <span title={d.council_name} className="font-medium text-text">
          {d.council}
        </span>
      ),
    },
    {
      header: "Registration no.",
      className: "hidden md:table-cell",
      cell: (d) => <span className="font-mono text-caption text-muted">{d.license_number}</span>,
    },
    {
      header: "Experience",
      className: "hidden xl:table-cell",
      cell: (d) => <span className="text-muted">{d.experience_years} yrs</span>,
    },
    {
      header: "Submitted",
      className: "hidden sm:table-cell",
      cell: (d) => (
        <span className="flex items-center gap-2">
          <span className="text-muted">{timeAgo(d.submitted_at)}</span>
          {d.verification_status === "pending" && hoursSince(d.submitted_at) > 24 && <Badge tone="warning">Over 24h</Badge>}
        </span>
      ),
    },
    { header: "Status", cell: (d) => <VerificationBadge status={d.verification_status} /> },
  ];

  const total = counts ? counts.pending + counts.verified + counts.rejected + counts.suspended : undefined;
  const tabs = [
    { value: "pending", label: "Pending", count: counts?.pending },
    { value: "verified", label: "Verified", count: counts?.verified },
    { value: "rejected", label: "Rejected", count: counts?.rejected },
    { value: "suspended", label: "Suspended", count: counts?.suspended },
    { value: "all", label: "All", count: total },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Doctor verifications"
        description="Check each registration number on the medical council register before approving."
        extra={!!counts?.pending && <Badge tone="warning">{counts.pending} pending</Badge>}
      />

      <Tabs
        label="Verification status"
        tabs={tabs}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <SearchBox
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search name or registration no."
      />

      <Card>
        <Table
          caption="Doctor verifications"
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(d) => setOpenId(d.id)}
          activeId={openId}
          empty={
            status === "pending" && !search ? (
              <EmptyState icon={CheckCircle2} title="No doctors are waiting for review." />
            ) : (
              <EmptyState icon={Inbox} title="No doctors in this list." />
            )
          }
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
      </Card>

      {/* `key` gives each doctor a fresh panel, so nothing is left over from the previous one */}
      {openId && <ReviewPanel key={openId} doctorId={openId} onClose={() => setOpenId(null)} onDecided={openNextDoctor} />}
    </div>
  );
}
