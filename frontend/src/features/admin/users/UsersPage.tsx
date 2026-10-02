import { BadgeCheck, CircleDashed, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { Paginated, User } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, UserStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { formatDate, timeAgo } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { UserPanel } from "./UserPanel";

const PAGE_SIZE = 20;

/** Every account on the platform, with search, filters and block / unblock. */
export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(searchParams.get("role") ?? "");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("open"));

  const { data, loading, error, reload } = useApi<Paginated<User>>("/admin/users", {
    q: useDebounced(search),
    role,
    status,
    page,
    page_size: PAGE_SIZE,
  });

  // every filter change goes back to page 1
  function changeFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: Column<User>[] = [
    {
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} className="max-sm:hidden" />
          <div className="min-w-0 max-w-44 sm:max-w-xs">
            <button type="button" onClick={() => setOpenId(u.id)} className="block truncate text-left font-semibold text-text hover:underline">
              {u.name}
            </button>
            <span className="flex items-center gap-1 truncate text-caption text-subtle">
              {u.email}
              {u.is_email_verified ? (
                <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Email verified" />
              ) : (
                <CircleDashed className="size-3.5 shrink-0" aria-label="Email not verified" />
              )}
            </span>
          </div>
        </div>
      ),
    },
    { header: "Phone", className: "hidden lg:table-cell", cell: (u) => <span className="text-muted">{u.phone ?? "—"}</span> },
    { header: "Role", cell: (u) => <RoleBadge role={u.role} /> },
    { header: "Joined", className: "hidden md:table-cell", cell: (u) => <span className="text-muted">{formatDate(u.created_at)}</span> },
    {
      header: "Last login",
      className: "hidden xl:table-cell",
      cell: (u) => <span className="text-muted">{u.last_login_at ? timeAgo(u.last_login_at) : "Never"}</span>,
    },
    { header: "Status", cell: (u) => <UserStatusBadge active={u.is_active} /> },
  ];

  const filtered = search || role || status;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Everyone with an AarogyaHub account."
        extra={
          data && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-small font-semibold text-muted tabular">
              {formatNumber(data.total)}
            </span>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={changeFilter(setSearch)} placeholder="Search name, email, phone or city" />
        <Select
          aria-label="Role"
          value={role}
          onChange={changeFilter(setRole)}
          options={[
            { value: "", label: "All roles" },
            { value: "patient", label: "Patient" },
            { value: "doctor", label: "Doctor" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={changeFilter(setStatus)}
          options={[
            { value: "", label: "Any status" },
            { value: "active", label: "Active" },
            { value: "blocked", label: "Blocked" },
          ]}
        />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setRole("");
              setStatus("");
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
          caption="Users"
          columns={columns}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(u) => setOpenId(u.id)}
          activeId={openId}
          empty={<EmptyState icon={UsersRound} title="No users match these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
      </Card>

      {openId && <UserPanel key={openId} userId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
