import { Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { saveConsultationReport } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment, ConsultationReport, Medicine } from "@/api/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { PanelBody, PanelFooter, PanelHeader, SidePanel } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { prescriptionPath } from "@/features/portal/appointments";
import { refreshData, useApi } from "@/hooks/useApi";

const FREQUENCIES = ["Once a day", "Twice a day", "Three times a day", "At night", "When needed"];

interface MedicineRow {
  key: number;
  name: string;
  dose: string;
  frequency: string;
  days: string;
  notes: string;
}

let nextKey = 1;

function emptyRow(): MedicineRow {
  return { key: nextKey++, name: "", dose: "", frequency: "", days: "", notes: "" };
}

function toRow(m: Medicine): MedicineRow {
  return {
    ...emptyRow(),
    name: m.name,
    dose: m.dose ?? "",
    frequency: m.frequency,
    days: m.days ? String(m.days) : "",
    notes: m.notes ?? "",
  };
}

function isBlank(row: MedicineRow) {
  return [row.name, row.dose, row.frequency, row.days, row.notes].every((v) => v.trim() === "");
}

function rowError(row: MedicineRow) {
  if (!row.name.trim()) return "Write the medicine name";
  if (!row.frequency.trim()) return "Write how often to take it";
  const days = Number(row.days);
  if (row.days.trim() && (!Number.isInteger(days) || days < 1 || days > 365))
    return "Days must be from 1 to 365";
  return "";
}

export function ReportForm({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  return (
    <SidePanel open={appointment !== null} onClose={onClose} label="Consultation report">
      {appointment && <ReportEditor appointment={appointment} onClose={onClose} />}
    </SidePanel>
  );
}

export function ReportEditor({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose?: () => void;
}) {
  const { data: saved, loading } = useApi<ConsultationReport>(
    `/appointments/${appointment.id}/consultation/report`,
  );

  if (loading && !saved) return <Spinner />;
  return (
    <ReportFields
      key={saved?.updated_at ?? appointment.id}
      appointment={appointment}
      saved={saved}
      onClose={onClose}
    />
  );
}

function ReportFields({
  appointment,
  saved,
  onClose,
}: {
  appointment: Appointment;
  saved: ConsultationReport | undefined;
  onClose?: () => void;
}) {
  const [form, setForm] = useState({
    symptoms: saved?.symptoms ?? "",
    diagnosis: saved?.diagnosis ?? "",
    prescription: saved?.prescription ?? "",
    advice: saved?.advice ?? "",
    follow_up_date: saved?.follow_up_date ?? "",
  });
  const [rows, setRows] = useState<MedicineRow[]>(() =>
    saved?.medicines.length ? saved.medicines.map(toRow) : [emptyRow()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function setRow(key: number, field: keyof Omit<MedicineRow, "key">, value: string) {
    setRows((all) => all.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = rows.filter((r) => !isBlank(r));
    const found: Record<string, string> = {};
    if (form.diagnosis.trim().length < 2) found.diagnosis = "Write the diagnosis";
    for (const r of filled) {
      const message = rowError(r);
      if (message) found[r.key] = message;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await saveConsultationReport(appointment.id, {
        symptoms: form.symptoms.trim() || null,
        diagnosis: form.diagnosis.trim(),
        medicines: filled.map((r) => ({
          name: r.name.trim(),
          dose: r.dose.trim() || null,
          frequency: r.frequency.trim(),
          days: r.days.trim() ? Number(r.days) : null,
          notes: r.notes.trim() || null,
        })),
        prescription: form.prescription.trim() || null,
        advice: form.advice.trim() || null,
        follow_up_date: form.follow_up_date || null,
      });
      toast.success(`Saved the report for ${appointment.patient_name}`);
      refreshData();
      onClose?.();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      {onClose && (
        <PanelHeader>
          <h2 className="text-h4 font-semibold">Consultation report</h2>
          <p className="text-small text-muted">
            {appointment.patient_name} can read this report and print the prescription.
          </p>
        </PanelHeader>
      )}
      <PanelBody>
        <section className="flex flex-col gap-4">
          <h3 className="text-small text-subtle font-semibold tracking-wide uppercase">Notes</h3>
          <Field label="Symptoms" id="symptoms" optional>
            <Textarea rows={2} value={form.symptoms} onChange={set("symptoms")} />
          </Field>
          <Field label="Diagnosis" id="diagnosis" error={errors.diagnosis}>
            <Textarea rows={2} value={form.diagnosis} onChange={set("diagnosis")} />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-small text-subtle font-semibold tracking-wide uppercase">
            Medicines
          </h3>
          <datalist id="frequencies">
            {FREQUENCIES.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          {rows.map((r, i) => (
            <fieldset
              key={r.key}
              className="border-border flex flex-col gap-3 rounded-md border p-3"
            >
              <div className="flex items-center justify-between">
                <legend className="text-small font-semibold">Medicine {i + 1}</legend>
                <Button
                  variant="danger-ghost"
                  size="icon-sm"
                  aria-label={`Remove medicine ${i + 1}`}
                  onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <Field label="Name" id={`med-${r.key}-name`} error={errors[r.key]}>
                <Input
                  value={r.name}
                  onChange={(e) => setRow(r.key, "name", e.target.value)}
                  placeholder="Cetirizine"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Dose" id={`med-${r.key}-dose`} optional>
                  <Input
                    value={r.dose}
                    onChange={(e) => setRow(r.key, "dose", e.target.value)}
                    placeholder="10 mg"
                  />
                </Field>
                <Field label="How often" id={`med-${r.key}-frequency`}>
                  <Input
                    list="frequencies"
                    value={r.frequency}
                    onChange={(e) => setRow(r.key, "frequency", e.target.value)}
                  />
                </Field>
                <Field label="Days" id={`med-${r.key}-days`} optional>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={r.days}
                    onChange={(e) => setRow(r.key, "days", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Notes" id={`med-${r.key}-notes`} optional>
                <Input
                  value={r.notes}
                  onChange={(e) => setRow(r.key, "notes", e.target.value)}
                  placeholder="After food"
                />
              </Field>
            </fieldset>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setRows((all) => [...all, emptyRow()])}
          >
            <Plus aria-hidden /> Add medicine
          </Button>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-small text-subtle font-semibold tracking-wide uppercase">
            Advice and follow-up
          </h3>
          <Field label="Other instructions" id="prescription" optional>
            <Textarea rows={2} value={form.prescription} onChange={set("prescription")} />
          </Field>
          <Field label="Advice" id="advice" optional>
            <Textarea rows={2} value={form.advice} onChange={set("advice")} />
          </Field>
          <Field label="Follow-up date" id="follow_up_date" optional>
            <Input type="date" value={form.follow_up_date} onChange={set("follow_up_date")} />
          </Field>
        </section>
      </PanelBody>

      <PanelFooter>
        {saved && (
          <Link
            to={prescriptionPath("doctor", appointment.id)}
            target="_blank"
            className={buttonClass("ghost")}
          >
            <Printer aria-hidden /> Print prescription
          </Link>
        )}
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
        <Button type="submit" loading={saving}>
          Save report
        </Button>
      </PanelFooter>
    </form>
  );
}
