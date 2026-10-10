import { useState } from "react";
import { toast } from "sonner";
import { saveConsultationReport } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment, ConsultationReport } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";

const EMPTY = { symptoms: "", diagnosis: "", prescription: "", advice: "", follow_up_date: "" };

export function ReportForm({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const url = appointment ? `/appointments/${appointment.id}/consultation/report` : null;
  const { data: saved, loading } = useApi<ConsultationReport>(url);

  return (
    <Modal open={appointment !== null} onClose={onClose} label="Consultation report">
      {appointment && !loading && (
        <ReportFields
          key={saved?.updated_at ?? appointment.id}
          appointment={appointment}
          saved={saved}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function ReportFields({
  appointment,
  saved,
  onClose,
}: {
  appointment: Appointment;
  saved: ConsultationReport | undefined;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() =>
    saved
      ? {
          symptoms: saved.symptoms ?? "",
          diagnosis: saved.diagnosis,
          prescription: saved.prescription ?? "",
          advice: saved.advice ?? "",
          follow_up_date: saved.follow_up_date ?? "",
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.diagnosis.trim().length < 2) {
      setError("Write the diagnosis");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveConsultationReport(appointment.id, {
        symptoms: form.symptoms.trim() || null,
        diagnosis: form.diagnosis.trim(),
        prescription: form.prescription.trim() || null,
        advice: form.advice.trim() || null,
        follow_up_date: form.follow_up_date || null,
      });
      toast.success(`Saved the report for ${appointment.patient_name}`);
      onClose();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h2 className="text-h4 font-semibold">Consultation report</h2>
        <p className="text-small text-muted">
          {appointment.patient_name}. The patient can read this report.
        </p>
      </div>
      <Field label="Symptoms" id="symptoms" optional>
        <Textarea rows={2} value={form.symptoms} onChange={set("symptoms")} />
      </Field>
      <Field label="Diagnosis" id="diagnosis" error={error}>
        <Textarea rows={2} value={form.diagnosis} onChange={set("diagnosis")} />
      </Field>
      <Field label="Prescription" id="prescription" optional>
        <Textarea rows={3} value={form.prescription} onChange={set("prescription")} />
      </Field>
      <Field label="Advice" id="advice" optional>
        <Textarea rows={2} value={form.advice} onChange={set("advice")} />
      </Field>
      <Field label="Follow-up date" id="follow_up_date" optional>
        <Input type="date" value={form.follow_up_date} onChange={set("follow_up_date")} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" loading={saving}>
          Save report
        </Button>
      </div>
    </form>
  );
}
