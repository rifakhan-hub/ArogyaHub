import { Ban, LockOpen, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { setUserBlocked } from "@/api/admin";
import type { UserDetail } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, UserStatusBadge, VerificationBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { DetailList, PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime, timeAgo } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

/** Side panel with one account: details, consultation activity, and block / unblock. */
export function UserPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: user, error, reload } = useApi<UserDetail>(`/admin/users/${userId}`);

  return (
    <SidePanel open onClose={onClose} label={user ? user.name : "User"}>
      {error ? (
        <div className="flex flex-1 items-center">
          <ErrorMessage error={error} onRetry={reload} />
        </div>
      ) : !user ? (
        <Spinner />
      ) : (
        <UserDetails user={user} />
      )}
    </SidePanel>
  );
}

function UserDetails({ user: u }: { user: UserDetail }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const blocking = u.is_active; // an active user can be blocked, a blocked one unblocked

  async function toggleBlocked(reason: string) {
    try {
      await setUserBlocked(u.id, blocking, reason || undefined);
      toast.success(blocking ? `Blocked. ${u.name} can't sign in.` : `Unblocked. ${u.name} can sign in again.`);
      setConfirmOpen(false);
      refreshData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const account: [string, React.ReactNode][] = [
    [
      "Email",
      <span key="email" className="flex flex-col">
        <a href={`mailto:${u.email}`} className="break-all text-primary hover:underline">
          {u.email}
        </a>
        <span className="text-caption text-subtle">{u.is_email_verified ? "Email verified" : "Email not verified"}</span>
      </span>,
    ],
    ["Phone", <span key="phone" className="tabular">{u.phone ?? "—"}</span>],
    ["Joined", formatDate(u.created_at)],
    ["Last login", u.last_login_at ? `${formatDateTime(u.last_login_at)} (${timeAgo(u.last_login_at)})` : "Never"],
    ["City", u.city ?? "—"],
    ["User ID", <span key="id" className="font-mono text-caption">{u.id}</span>],
  ];

  const stats: [string, number][] = [
    ["Total", u.stats.appointments],
    ["Completed", u.stats.completed],
    ["Cancelled", u.stats.cancelled],
    ["No-show", u.stats.no_show],
  ];

  return (
    <>
      <PanelHeader>
        <div className="flex items-start gap-4">
          <Avatar name={u.name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-h3 text-text">{u.name}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <RoleBadge role={u.role} />
              <UserStatusBadge active={u.is_active} />
            </div>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        {!u.is_active && u.blocked_reason && (
          <div className="rounded-md border border-sindoor-200 bg-danger-soft p-4 text-small text-text dark:border-sindoor-800">
            Blocked: {u.blocked_reason}
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-body font-semibold">Account</h3>
          <DetailList items={account} />
        </section>

        {u.doctor_id && u.verification_status && (
          <section className="flex flex-col gap-3">
            <h3 className="text-body font-semibold">Doctor profile</h3>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-4">
              <VerificationBadge status={u.verification_status} />
              <Link to={`/admin/verifications?status=all&open=${u.doctor_id}`} className={buttonClass("outline", "sm")}>
                <ShieldCheck aria-hidden />
                Open verification
              </Link>
            </div>
          </section>
        )}

        {u.role !== "admin" && (
          <section className="flex flex-col gap-3">
            <h3 className="text-body font-semibold">Consultation activity</h3>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label} className="bg-surface p-4">
                  <dt className="text-caption font-medium text-subtle">{label}</dt>
                  <dd className="mt-1 text-h4 text-text tabular">{formatNumber(value)}</dd>
                </div>
              ))}
            </dl>
            {u.stats.last_appointment_at && (
              <p className="text-small text-muted">Last consultation: {formatDateTime(u.stats.last_appointment_at)}</p>
            )}
          </section>
        )}
      </PanelBody>

      <PanelFooter>
        {u.role === "admin" ? (
          <p className="text-small text-subtle sm:mr-auto">Admin accounts can't be blocked from the console.</p>
        ) : blocking ? (
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <Ban aria-hidden />
            Block user
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            <LockOpen aria-hidden />
            Unblock user
          </Button>
        )}
      </PanelFooter>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={blocking ? `Block ${u.name}?` : `Unblock ${u.name}?`}
        body={
          blocking
            ? "They'll be logged out and can't sign in or book until you unblock them. Upcoming consultations are not cancelled automatically."
            : "They'll be able to sign in and book consultations again."
        }
        confirmLabel={blocking ? "Block user" : "Unblock user"}
        danger={blocking}
        reasonLabel={blocking ? "Reason" : undefined}
        reasonHint="Kept in the audit log. Not shown to the user."
        onConfirm={toggleBlocked}
      />
    </>
  );
}
