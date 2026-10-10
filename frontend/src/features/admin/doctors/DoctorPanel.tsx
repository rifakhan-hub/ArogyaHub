import { useState } from "react";
import { toast } from "sonner";
import { verifyDoctor } from "@/api/admin";
import type { ApiError } from "@/api/client";
import { openFile } from "@/api/files";
import type { Doctor, DoctorDocument } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { DetailList, PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { DOCUMENT_LABELS } from "@/features/doctor/DocumentsSection";
import { refreshData, useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { checkReason } from "@/lib/validators";

export function DoctorPanel({ doctor, onClose }: { doctor: Doctor | null; onClose: () => void }) {
  const documents = useApi<DoctorDocument[]>(doctor ? `/admin/doctors/${doctor.id}/documents` : null).data;
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function close() {
    setRejecting(false);
    setReason("");
    setError("");
    onClose();
  }

  async function decide(action: "approve" | "reject") {
    if (!doctor) return;
    if (action === "reject") {
      const problem = checkReason(reason);
      if (problem) return setError(problem);
    }
    setSaving(true);
    try {
      await verifyDoctor(doctor.id, action, action === "reject" ? reason.trim() : undefined);
      toast.success(action === "approve" ? `Approved ${doctor.name}` : `Rejected ${doctor.name}`);
      refreshData();
      close();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel open={doctor !== null} onClose={close} label={doctor ? `Review ${doctor.name}` : "Review doctor"}>
      {doctor && (
        <>
          <PanelHeader>
            <div className="flex items-center gap-4">
              <Avatar name={doctor.name} size="lg" />
              <div className="flex flex-col gap-1">
                <h2 className="text-h3 font-semibold">{doctor.name}</h2>
                <VerificationBadge status={doctor.verification_status} />
              </div>
            </div>
          </PanelHeader>

          <PanelBody>
            <section className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-subtle">Professional details</h3>
              <DetailList
                items={[
                  ["Speciality", doctor.specialization],
                  ["Qualifications", doctor.qualifications],
                  ["Licence number", doctor.license_number],
                  ["Medical council", doctor.council],
                  ["Experience", `${doctor.experience_years} years`],
                  ["Consultation fee", formatINR(doctor.consultation_fee)],
                ]}
              />
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-subtle">Contact</h3>
              <DetailList
                items={[
                  ["Email", doctor.email],
                  ["Phone", doctor.phone ?? "—"],
                  ["City", doctor.city ?? "—"],
                  ["Submitted", formatDate(doctor.submitted_at)],
                ]}
              />
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-subtle">Documents</h3>
              {documents && documents.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block text-small font-semibold">{DOCUMENT_LABELS[d.doc_type]}</span>
                        <span className="block truncate text-caption text-muted">{d.file_name}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFile(`/admin/doctors/${doctor.id}/documents/${d.id}/file`)}
                      >
                        Open
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-muted">No documents uploaded yet.</p>
              )}
            </section>
            {doctor.bio && (
              <section className="flex flex-col gap-2">
                <h3 className="text-small font-semibold text-subtle">About</h3>
                <p className="text-body">{doctor.bio}</p>
              </section>
            )}
            {doctor.rejection_reason && (
              <p className="rounded-md bg-danger-soft p-3 text-small">Rejected: {doctor.rejection_reason}</p>
            )}
            {rejecting && (
              <Field label="Reason for rejecting" id="reason" hint="The doctor sees this reason." error={error}>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            )}
          </PanelBody>

          {doctor.verification_status === "pending" && (
            <PanelFooter>
              {rejecting ? (
                <>
                  <Button variant="outline" onClick={() => setRejecting(false)}>
                    Back
                  </Button>
                  <Button variant="danger" loading={saving} onClick={() => decide("reject")}>
                    Confirm rejection
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="danger-outline" onClick={() => setRejecting(true)}>
                    Reject
                  </Button>
                  <Button loading={saving} onClick={() => decide("approve")}>
                    Approve
                  </Button>
                </>
              )}
            </PanelFooter>
          )}
        </>
      )}
    </SidePanel>
  );
}
