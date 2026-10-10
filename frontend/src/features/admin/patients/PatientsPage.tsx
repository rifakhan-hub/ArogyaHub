import { useState } from "react";
import { toast } from "sonner";
import { setPatientBlocked } from "@/api/admin";
import type { ApiError } from "@/api/client";
import type { Paginated, Patient, User } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SearchBox, Select, Textarea } from "@/components/ui/Input";
import { DetailList, PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { refreshData, useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { formatDate, formatDateTime } from "@/lib/dates";
import { checkReason } from "@/lib/validators";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All patients" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

const COLUMNS: Column<User>[] = [
  {
    header: "Patient",
    cell: (p) => (
      <span className="flex items-center gap-3">
        <Avatar name={p.name} size="sm" />
        <span>
          <span className="block font-semibold">{p.name}</span>
          <span className="block text-small text-muted">{p.email}</span>
        </span>
      </span>
    ),
  },
  { header: "Phone", cell: (p) => p.phone ?? "—" },
  { header: "City", cell: (p) => p.city ?? "—" },
  { header: "Joined", cell: (p) => formatDate(p.created_at) },
  { header: "Status", cell: (p) => <UserStatusBadge active={p.is_active} /> },
];

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const q = useDebounced(query, 300);

  const { data, loading, error, reload } = useApi<Paginated<User>>("/admin/patients", {
    q,
    status,
    page,
    page_size: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <title>Patients · AarogyaHub Admin</title>
      <PageHeader title="Patients" description="Find a patient account and block or unblock it." />

      <div className="flex flex-wrap gap-3">
        <SearchBox
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search name, email or phone"
        />
        <Select
          aria-label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          className="w-48"
        />
      </div>

      <Card className="overflow-hidden">
        <Table
          caption="Patients"
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

      <PatientPanel patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PatientPanel({ patient, onClose }: { patient: User | null; onClose: () => void }) {
  const details = useApi<Patient>(patient ? `/admin/patients/${patient.id}` : null).data;
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function close() {
    setReason("");
    setError("");
    onClose();
  }

  async function toggleBlock() {
    if (!patient) return;
    const blocking = patient.is_active;
    if (blocking) {
      const problem = checkReason(reason);
      if (problem) return setError(problem);
    }
    setSaving(true);
    try {
      await setPatientBlocked(patient.id, blocking, blocking ? reason.trim() : undefined);
      toast.success(blocking ? `Blocked ${patient.name}` : `Unblocked ${patient.name}`);
      refreshData();
      close();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel open={patient !== null} onClose={close} label={patient ? `Patient ${patient.name}` : "Patient"}>
      {patient && (
        <>
          <PanelHeader>
            <div className="flex items-center gap-4">
              <Avatar name={patient.name} size="lg" />
              <div className="flex flex-col gap-1">
                <h2 className="text-h3 font-semibold">{patient.name}</h2>
                <UserStatusBadge active={patient.is_active} />
              </div>
            </div>
          </PanelHeader>
          <PanelBody>
            <DetailList
              items={[
                ["Email", patient.email],
                ["Phone", patient.phone ?? "—"],
                ["City", patient.city ?? "—"],
                ["Joined", formatDate(patient.created_at)],
                ["Last login", patient.last_login_at ? formatDateTime(patient.last_login_at) : "Never"],
              ]}
            />
            {details && (
              <section className="flex flex-col gap-2">
                <h3 className="text-small font-semibold text-subtle">Health details</h3>
                <DetailList
                  items={[
                    ["Date of birth", details.date_of_birth ? formatDate(details.date_of_birth) : "—"],
                    ["Gender", details.gender ?? "—"],
                    ["Blood group", details.blood_group ?? "—"],
                    ["Allergies", details.allergies ?? "None recorded"],
                  ]}
                />
              </section>
            )}
            {!patient.is_active && patient.blocked_reason && (
              <p className="rounded-md bg-danger-soft p-3 text-small">Blocked: {patient.blocked_reason}</p>
            )}
            {patient.is_active && (
              <Field label="Reason for blocking" id="block-reason" error={error}>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            )}
          </PanelBody>
          <PanelFooter>
            <Button variant={patient.is_active ? "danger" : "primary"} loading={saving} onClick={toggleBlock}>
              {patient.is_active ? "Block patient" : "Unblock patient"}
            </Button>
          </PanelFooter>
        </>
      )}
    </SidePanel>
  );
}
