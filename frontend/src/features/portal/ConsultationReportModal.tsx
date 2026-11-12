import { Printer } from "lucide-react";
import { Link } from "react-router";
import type { Appointment, ConsultationReport } from "@/api/types";
import { buttonClass } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime } from "@/lib/dates";
import { prescriptionPath } from "./appointments";
import { MedicineTable } from "./MedicineTable";

export function ConsultationReportModal({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const url = appointment ? `/appointments/${appointment.id}/consultation/report` : null;
  const { data: report, error } = useApi<ConsultationReport>(url);

  return (
    <SidePanel open={appointment !== null} onClose={onClose} label="Consultation report">
      {appointment && (
        <>
          <PanelHeader>
            <h2 className="text-h4 font-semibold">Consultation report</h2>
            <p className="text-small text-muted">
              {appointment.doctor_name} · {formatDateTime(appointment.start_time)}
            </p>
          </PanelHeader>
          <PanelBody>
            {error?.code === "NO_REPORT" || error?.code === "NOT_STARTED" ? (
              <p className="text-body text-muted">The doctor hasn't written the report yet.</p>
            ) : error ? (
              <ErrorMessage error={error} />
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
      )}
    </SidePanel>
  );
}

export function ReportView({ report }: { report: ConsultationReport }) {
  return (
    <>
      <ReportSection title="Symptoms">{report.symptoms ?? "—"}</ReportSection>
      <ReportSection title="Diagnosis">{report.diagnosis}</ReportSection>
      <section className="flex flex-col gap-2">
        <h3 className="text-small text-subtle font-semibold tracking-wide uppercase">Medicines</h3>
        <MedicineTable medicines={report.medicines} />
      </section>
      {report.prescription && (
        <ReportSection title="Other instructions">{report.prescription}</ReportSection>
      )}
      {report.advice && <ReportSection title="Advice">{report.advice}</ReportSection>}
      <ReportSection title="Follow-up">
        {report.follow_up_date ? formatDate(report.follow_up_date) : "No follow-up needed"}
      </ReportSection>
    </>
  );
}

export function PrintLink({ appointmentId }: { appointmentId: string }) {
  return (
    <Link
      to={prescriptionPath("patient", appointmentId)}
      target="_blank"
      className={buttonClass("primary")}
    >
      <Printer aria-hidden /> Print prescription
    </Link>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-small text-subtle font-semibold tracking-wide uppercase">{title}</h3>
      <p className="text-body whitespace-pre-line">{children}</p>
    </section>
  );
}
