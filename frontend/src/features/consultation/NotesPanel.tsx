import { FileText } from "lucide-react";
import { useState } from "react";
import { openFile } from "@/api/files";
import type { Appointment, ConsultationReport, SharedReport } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { PanelBody, PanelFooter, PanelHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { ReportEditor } from "@/features/doctor/ReportForm";
import { PrintLink, ReportView } from "@/features/portal/ConsultationReportModal";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/dates";

export function DoctorNotes({ appointment }: { appointment: Appointment }) {
  const [tab, setTab] = useState("notes");
  const shared = useApi<SharedReport[]>("/reports/shared-with-me");
  const reports = (shared.data ?? []).filter((r) => r.patient_id === appointment.patient_id);
  const started = appointment.status !== "scheduled";

  return (
    <>
      <div className="px-4 pt-2">
        <Tabs
          label="Consultation tools"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "notes", label: "Notes and prescription" },
            { value: "reports", label: "Shared reports", count: reports.length },
          ]}
        />
      </div>
      {tab === "reports" ? (
        <PanelBody>
          <p className="text-small text-muted">
            Reason for the visit: {appointment.reason ?? "Not given"}
          </p>
          {reports.length === 0 ? (
            <p className="text-small text-muted">
              {appointment.patient_name} hasn't shared any reports with you.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="text-small flex min-w-0 items-center gap-2">
                    <FileText className="text-subtle size-4 shrink-0" aria-hidden />
                    <span className="truncate font-semibold">{r.title}</span>
                    <span className="text-muted">{formatDate(r.shared_at)}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openFile(`/reports/${r.id}/file`)}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      ) : started ? (
        <ReportEditor appointment={appointment} />
      ) : (
        <PanelBody>
          <p className="text-small text-muted">You can write notes once the consultation starts.</p>
        </PanelBody>
      )}
    </>
  );
}

export function PatientNotes({ appointment }: { appointment: Appointment }) {
  const finished = appointment.status === "completed";
  const { data: report, error } = useApi<ConsultationReport>(
    finished ? `/appointments/${appointment.id}/consultation/report` : null,
  );

  return (
    <>
      <PanelHeader>
        <h2 className="text-h4 font-semibold">Notes and prescription</h2>
        <p className="text-small text-muted">From {appointment.doctor_name}</p>
      </PanelHeader>
      <PanelBody>
        {!finished ? (
          <p className="text-small text-muted">
            Your doctor writes the notes and prescription during the call. You'll see them here when
            the consultation ends.
          </p>
        ) : error ? (
          <p className="text-small text-muted">The doctor hasn't written the report yet.</p>
        ) : !report ? (
          <Spinner />
        ) : (
          <ReportView report={report} />
        )}
      </PanelBody>
      {report && (
        <PanelFooter>
          <PrintLink appointmentId={appointment.id} />
        </PanelFooter>
      )}
    </>
  );
}
