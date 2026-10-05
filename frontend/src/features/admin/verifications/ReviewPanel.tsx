import { Info, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { verifyDoctor } from "@/api/admin";
import type { Doctor, VerifyAction } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { DetailList, PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { formatDate, timeAgo } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { checkReason } from "@/lib/validators";
import { DocumentViewer } from "./DocumentViewer";

const REASON_MESSAGE = "Give a reason of at least 10 characters. It is sent to the doctor.";

interface ReviewPanelProps {
  doctorId: string;
  onClose: () => void;
  onDecided: () => void;
}

export function ReviewPanel({ doctorId, onClose, onDecided }: ReviewPanelProps) {
  const { data: doctor, error, reload } = useApi<Doctor>(`/admin/doctors/${doctorId}`);

  return (
    <SidePanel open onClose={onClose} label={doctor ? `Review ${doctor.name}` : "Doctor verification"}>
      {error ? (
        <div className="flex flex-1 items-center">
          <ErrorMessage error={error} onRetry={reload} />
        </div>
      ) : !doctor ? (
        <Spinner />
      ) : (
        <DoctorReview doctor={doctor} onDecided={onDecided} />
      )}
    </SidePanel>
  );
}

function DoctorReview({ doctor: d, onDecided }: { doctor: Doctor; onDecided: () => void }) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [busyAction, setBusyAction] = useState<VerifyAction | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);

  async function decide(action: VerifyAction, why?: string) {
    setBusyAction(action);
    try {
      await verifyDoctor(d.id, action, why);
      const messages = {
        approve: d.verification_status === "suspended" ? `Reinstated. ${d.name} is listed again.` : `Approved. ${d.name} can now set availability.`,
        reject: `Rejected. ${d.name} has been told why.`,
        suspend: `Suspended. ${d.name} is hidden from search.`,
      };
      toast.success(messages[action]);
      setSuspendOpen(false);
      onDecided();
      refreshData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  function reject() {
    const problem = checkReason(reason, REASON_MESSAGE);
    setReasonError(problem);
    if (problem) {
      document.getElementById("reject-reason")?.focus();
      return;
    }
    decide("reject", reason.trim());
  }

  const status = d.verification_status;
  const details: [string, React.ReactNode][] = [
    ["Specialization", d.specialization],
    ["Qualifications", d.qualifications.join(", ")],
    ["Experience", `${d.experience_years} yrs`],
    ["Languages", d.languages.join(", ")],
    ["Consultation fee", formatINR(d.consultation_fee)],
    ["City", d.city],
    [
      "Contact",
      <span key="contact" className="flex flex-col">
        <a href={`mailto:${d.email}`} className="text-primary hover:underline">
          {d.email}
        </a>
        {d.phone && <span className="tabular">{d.phone}</span>}
      </span>,
    ],
    [
      "Registration",
      <span key="reg" className="flex flex-col">
        <span className="font-mono text-caption">{d.license_number}</span>
        <span className="text-muted">{d.council_name}</span>
      </span>,
    ],
  ];

  return (
    <>
      <PanelHeader>
        <div className="flex items-start gap-4">
          <Avatar name={d.name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-h3 text-text">{d.name}</h2>
            <p className="mt-0.5 text-small text-muted">
              {d.specialization}, {d.council} · Submitted {timeAgo(d.submitted_at)}
            </p>
            <div className="mt-2">
              <VerificationBadge status={status} />
            </div>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        {status === "pending" && (
          <div className="flex gap-3 rounded-md border border-neel-200 bg-info-soft p-4 text-small dark:border-neel-800">
            <Info className="mt-0.5 size-5 shrink-0 text-info" strokeWidth={1.75} aria-hidden />
            <div>
              <p className="font-semibold text-text">Check the council register</p>
              <p className="mt-0.5 text-muted">
                Search {d.license_number} on the {d.council_name} register and confirm the name matches before approving.
              </p>
            </div>
          </div>
        )}

        {(status === "rejected" || status === "suspended") && d.rejection_reason && (
          <div className="rounded-md border border-sindoor-200 bg-danger-soft p-4 text-small dark:border-sindoor-800">
            <p className="font-semibold text-text">{status === "rejected" ? "Rejection sent to the doctor" : "Suspension reason"}</p>
            <p className="mt-0.5 text-muted">{d.rejection_reason}</p>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-body font-semibold">Documents</h3>
          <DocumentViewer doctorId={d.id} documents={d.documents} />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-body font-semibold">Details</h3>
          <DetailList items={details} />
          {d.bio && <p className="max-w-[65ch] text-small text-muted">{d.bio}</p>}
          {d.verified_by && d.verified_at && (
            <p className="text-caption text-subtle">
              Approved by {d.verified_by.name} on {formatDate(d.verified_at)}
            </p>
          )}
        </section>

        {status === "pending" && (
          <section className="flex flex-col gap-3">
            <h3 className="text-body font-semibold">Decision</h3>
            <Field
              label="Reason (needed to reject)"
              id="reject-reason"
              hint="Sent to the doctor. Say what's wrong and what to upload."
              error={reason.trim().length >= 10 ? undefined : reasonError}
            >
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: The registration number doesn't match the council register."
              />
            </Field>
          </section>
        )}
      </PanelBody>

      {status !== "rejected" && (
        <PanelFooter>
          {status === "pending" && (
            <>
              <Button variant="danger-outline" onClick={reject} loading={busyAction === "reject"} disabled={!!busyAction}>
                Reject
              </Button>
              <Button onClick={() => decide("approve")} loading={busyAction === "approve"} disabled={!!busyAction}>
                Approve
              </Button>
            </>
          )}
          {status === "verified" && (
            <Button variant="danger-ghost" onClick={() => setSuspendOpen(true)}>
              <ShieldOff aria-hidden />
              Suspend doctor
            </Button>
          )}
          {status === "suspended" && (
            <Button onClick={() => decide("approve")} loading={busyAction === "approve"}>
              Reinstate
            </Button>
          )}
        </PanelFooter>
      )}

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title={`Suspend ${d.name}?`}
        body="They'll be hidden from search and can't take new consultations. Existing bookings stay until you cancel them."
        confirmLabel="Suspend doctor"
        reasonLabel="Reason for suspension"
        reasonHint="Sent to the doctor. Say what's wrong and what to upload."
        onConfirm={(why) => decide("suspend", why)}
      />
    </>
  );
}
