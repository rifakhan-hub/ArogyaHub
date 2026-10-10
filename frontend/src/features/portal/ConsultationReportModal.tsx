import type { Appointment, ConsultationReport } from "@/api/types";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { DetailList, Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime } from "@/lib/dates";

export function ConsultationReportModal({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const url = appointment ? `/appointments/${appointment.id}/consultation/report` : null;
  const { data: report, error } = useApi<ConsultationReport>(url);

  return (
    <Modal open={appointment !== null} onClose={onClose} label="Consultation report">
      {appointment && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-h4 font-semibold">Consultation report</h2>
            <p className="text-small text-muted">
              {appointment.doctor_name} with {appointment.patient_name} · {formatDateTime(appointment.start_time)}
            </p>
          </div>
          {error?.code === "NO_REPORT" || error?.code === "NOT_STARTED" ? (
            <p className="text-body text-muted">The doctor hasn't written the report yet.</p>
          ) : error ? (
            <ErrorMessage error={error} />
          ) : !report ? (
            <Spinner />
          ) : (
            <DetailList
              items={[
                ["Symptoms", report.symptoms ?? "—"],
                ["Diagnosis", report.diagnosis],
                ["Prescription", report.prescription ?? "—"],
                ["Advice", report.advice ?? "—"],
                ["Follow-up", report.follow_up_date ? formatDate(report.follow_up_date) : "—"],
              ]}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
