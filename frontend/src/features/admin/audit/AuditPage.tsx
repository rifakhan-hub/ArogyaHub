import { ChevronRight, Download, ScrollText, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditListParams, AuditLog, Paginated } from "@/api/types";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { cn } from "@/lib/cn";
import { daysFromToday, formatTimestamp, timeAgo } from "@/lib/dates";
import { ACTION_GROUPS, auditSubject, auditVerb, ENTITY_ICONS, ENTITY_LABELS, isSensitive } from "./auditText";
import { exportAuditCsv } from "./exportCsv";

const PAGE_SIZE = 20;

function dateRange(range: string) {
  if (range === "today") return { from: daysFromToday(0), to: daysFromToday(0) };
  if (range === "past7") return { from: daysFromToday(-7), to: daysFromToday(0) };
  if (range === "past30") return { from: daysFromToday(-30), to: daysFromToday(0) };
  return {};
}

/** The append-only record of every sensitive action, with filters and CSV export. */
export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [range, setRange] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null); // the row showing its details
  const [exporting, setExporting] = useState(false);

  const filters: AuditListParams = {
    q: useDebounced(search),
    action,
    entity_type: (entity || undefined) as AuditLog["entity_type"] | undefined,
    ...dateRange(range),
  };
  const { data, loading, error, reload } = useApi<Paginated<AuditLog>>("/admin/audit-logs", {
    ...filters,
    page,
    page_size: PAGE_SIZE,
  });

  function changeFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function toggle(id: string) {
    setOpenId(openId === id ? null : id);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const count = await exportAuditCsv(filters);
      toast.success(`Exported ${count} entries.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<AuditLog>[] = [
    {
      header: "Time",
      cell: (l) => (
        <button
          type="button"
          onClick={() => toggle(l.id)}
          aria-expanded={openId === l.id}
          aria-label={`${openId === l.id ? "Hide" : "Show"} details: ${formatTimestamp(l.created_at)}`}
          className="flex items-start gap-2 text-left"
        >
          <ChevronRight
            className={cn("mt-0.5 size-4 shrink-0 text-subtle transition-transform", openId === l.id && "rotate-90")}
            aria-hidden
          />
          <span className="flex flex-col">
            <span className="whitespace-nowrap text-text">{formatTimestamp(l.created_at)}</span>
            <span className="text-caption text-subtle">{timeAgo(l.created_at)}</span>
          </span>
        </button>
      ),
    },
    {
      header: "Actor",
      cell: (l) =>
        l.actor ? (
          <span className="flex flex-col items-start gap-1">
            <span className="text-text">{l.actor.name}</span>
            <RoleBadge role={l.actor.role} />
          </span>
        ) : (
          <span className="text-muted">System</span>
        ),
    },
    {
      header: "Action",
      cell: (l) => {
        const Icon = ENTITY_ICONS[l.entity_type];
        const subject = auditSubject(l);
        return (
          <span className="flex items-start gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                isSensitive(l.action) ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-text">
                {auditVerb(l.action)}
                {subject && <span className="text-muted"> · {subject}</span>}
              </span>
              <span className="font-mono text-caption text-subtle">{l.action}</span>
            </span>
          </span>
        );
      },
    },
    {
      header: "Entity",
      className: "hidden lg:table-cell",
      cell: (l) => (
        <span className="flex flex-col">
          <span className="text-muted">{ENTITY_LABELS[l.entity_type]}</span>
          <span className="font-mono text-caption text-subtle" title={l.entity_id}>
            …{l.entity_id.slice(-8)}
          </span>
        </span>
      ),
    },
    { header: "IP address", className: "hidden xl:table-cell", cell: (l) => <span className="font-mono text-caption text-muted">{l.ip}</span> },
    {
      header: "Request ID",
      className: "hidden md:table-cell",
      cell: (l) => <span className="font-mono text-caption text-muted">{l.request_id}</span>,
    },
  ];

  const filtered = search || action || entity || range;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Append-only record of sensitive actions. Times in IST."
        actions={
          <Button variant="outline" onClick={handleExport} loading={exporting} disabled={!data?.total}>
            <Download aria-hidden />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={changeFilter(setSearch)} placeholder="Search actor, entity ID, request ID or IP" />
        <Select
          aria-label="Action"
          value={action}
          onChange={changeFilter(setAction)}
          options={[{ value: "", label: "All actions" }, ...ACTION_GROUPS]}
        />
        <Select
          aria-label="Entity"
          value={entity}
          onChange={changeFilter(setEntity)}
          options={[{ value: "", label: "All entities" }, ...Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <Select
          aria-label="Date"
          value={range}
          onChange={changeFilter(setRange)}
          options={[
            { value: "", label: "All dates" },
            { value: "today", label: "Today" },
            { value: "past7", label: "Past 7 days" },
            { value: "past30", label: "Past 30 days" },
          ]}
        />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setAction("");
              setEntity("");
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
          caption="Audit log"
          columns={columns}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(l) => toggle(l.id)}
          renderExpanded={(l) => (l.id === openId ? <AuditDetails log={l} /> : null)}
          empty={<EmptyState icon={ScrollText} title="No entries match these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
      </Card>
    </div>
  );
}

/** The full record of one entry, shown under its row. */
function AuditDetails({ log }: { log: AuditLog }) {
  const rows = [
    ["Entity", `${log.entity_type} ${log.entity_id}`],
    ["Request ID", log.request_id],
    ["IP address", log.ip],
    ["UTC", log.created_at],
  ];
  return (
    <div className="ml-6 grid gap-4 rounded-md border border-border bg-surface p-4 lg:grid-cols-[1fr_1.4fr]">
      <dl className="flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-caption text-subtle">{label}</dt>
            <dd className="break-all font-mono text-caption text-text">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-1 text-caption text-subtle">Metadata</p>
        <pre className="max-h-64 overflow-auto rounded-md bg-surface-muted p-3 font-mono text-caption leading-5 text-text">
          {JSON.stringify(log.metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
