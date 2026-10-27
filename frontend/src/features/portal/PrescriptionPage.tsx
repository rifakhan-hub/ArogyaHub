import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import type { ConsultationReport } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LogoMark } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatTime } from "@/lib/dates";
import { MedicineTable } from "./MedicineTable";

export default function PrescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: report, error } = useApi<ConsultationReport>(
    `/appointments/${id}/consultation/report`,
  );

  return (
    <main className="bg-bg text-text min-h-dvh px-4 py-8 print:bg-white print:p-0">
      <title>Prescription · AarogyaHub</title>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex justify-between gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden /> Back
          </Button>
          <Button size="sm" onClick={() => window.print()} disabled={!report}>
            <Printer aria-hidden /> Print
          </Button>
        </div>

        {error ? (
          <ErrorMessage error={error} />
        ) : !report ? (
          <Spinner />
        ) : (
          <article className="border-border bg-surface flex flex-col gap-6 rounded-xl border p-8 print:rounded-none print:border-0 print:p-0">
            <header className="border-primary flex flex-wrap items-start justify-between gap-4 border-b-2 pb-4">
              <div>
                <h1 className="text-h3 font-bold">{report.doctor_name}</h1>
                <p className="text-small">
                  {report.doctor_qualifications} · {report.specialization}
                </p>
                <p className="text-small text-muted">Reg. no. {report.doctor_registration}</p>
              </div>
              <span className="flex items-center gap-2 font-bold">
                <LogoMark /> AarogyaHub
              </span>
            </header>

            <dl className="bg-surface-muted text-small grid gap-3 rounded-md p-4 sm:grid-cols-3 print:bg-white print:px-0">
              <Detail label="Patient" value={report.patient_name} />
              <Detail
                label="Age / gender"
                value={
                  [report.patient_age && `${report.patient_age} years`, report.patient_gender]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Detail
                label="Date"
                value={`${formatDate(report.consulted_at)}, ${formatTime(report.consulted_at)}`}
              />
              {report.patient_allergies && (
                <Detail label="Allergies" value={report.patient_allergies} />
              )}
            </dl>

            {report.symptoms && <Section title="Symptoms">{report.symptoms}</Section>}
            <Section title="Diagnosis">{report.diagnosis}</Section>

            <section className="flex flex-col gap-2">
              <h2 className="text-h4 text-primary font-bold">Rx</h2>
              <MedicineTable medicines={report.medicines} />
            </section>

            {report.prescription && (
              <Section title="Other instructions">{report.prescription}</Section>
            )}
            {report.advice && <Section title="Advice">{report.advice}</Section>}
            {report.follow_up_date && (
              <Section title="Follow-up">{formatDate(report.follow_up_date)}</Section>
            )}

            <footer className="text-small mt-6 flex items-end justify-between gap-4">
              <p className="text-muted">Online consultation through AarogyaHub.</p>
              <p className="border-text border-t pt-1 text-center font-semibold">
                {report.doctor_name}
              </p>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-subtle font-medium">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-caption text-subtle font-semibold tracking-wide uppercase">{title}</h2>
      <p className="text-body whitespace-pre-line">{children}</p>
    </section>
  );
}
