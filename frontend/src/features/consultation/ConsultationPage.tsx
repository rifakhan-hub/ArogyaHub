import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { endConsultation, startConsultation } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment } from "@/api/types";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/dates";
import { DoctorNotes, PatientNotes } from "./NotesPanel";
import { useCall } from "./useCall";
import { usePeerCall } from "./usePeerCall";
import { CallScreen, PeerVideo } from "./VideoRoom";

const STATUS_CHECK_MS = 10_000;

export default function ConsultationPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const { data: appointment, error, reload } = useApi<Appointment>(`/appointments/${id}`);
  const status = appointment?.status;
  const live = status === "scheduled" || status === "in_progress";
  const { call, error: callError } = useCall(id, live && (!isDoctor || status === "in_progress"));
  const peer = usePeerCall(id, call && !call.waiting ? call.ice_servers : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(reload, STATUS_CHECK_MS);
    return () => clearInterval(timer);
  }, [live, reload]);

  useEffect(() => {
    if (peer.state === "ended") reload();
  }, [peer.state, reload]);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      refreshData();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!appointment) return <Spinner fullScreen />;

  const other = isDoctor ? appointment.patient_name : appointment.doctor_name;
  const role = isDoctor ? "doctor" : "patient";

  function stage() {
    if (!live) {
      return (
        <CallScreen
          title="This consultation has ended"
          body={
            isDoctor
              ? "Finish the notes and prescription on the right."
              : "Your notes and prescription are on the right."
          }
        />
      );
    }
    if (callError) {
      return <CallScreen title="We couldn't open the call" body={callError.message} />;
    }
    if (isDoctor && status === "scheduled") {
      return (
        <CallScreen
          preview
          title={`Ready to see ${other}?`}
          body="Starting the consultation opens the call and lets the patient in."
        >
          <Button
            loading={busy}
            onClick={() => run(() => startConsultation(id), `Started with ${other}`)}
          >
            Start consultation
          </Button>
        </CallScreen>
      );
    }
    if (call && !call.waiting) {
      return (
        <PeerVideo
          call={peer}
          otherName={other}
          onLeave={isDoctor ? undefined : () => navigate("/patient/appointments")}
        />
      );
    }
    return (
      <CallScreen
        preview
        title={isDoctor ? "Opening the call…" : `Waiting for ${other}`}
        body={
          isDoctor
            ? "This takes a few seconds."
            : "Your doctor will start the consultation soon. This page opens the call by itself."
        }
      />
    );
  }

  return (
    <div className="bg-bg text-text flex min-h-dvh flex-col lg:h-dvh">
      <title>Consultation · AarogyaHub</title>
      <header className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/${role}/appointments`}
            aria-label="Back to appointments"
            className={buttonClass("ghost", "icon-sm")}
          >
            <ArrowLeft aria-hidden />
          </Link>
          <div>
            <h1 className="font-semibold">Consultation with {other}</h1>
            <p className="text-small text-muted">
              {formatDateTime(appointment.start_time)} · {appointment.reason ?? "No reason given"}
            </p>
          </div>
          <AppointmentBadge status={appointment.status} />
        </div>
        {isDoctor && status === "in_progress" && (
          <Button
            variant="danger"
            loading={busy}
            onClick={() =>
              run(async () => {
                peer.hangup();
                await endConsultation(id);
              }, `Ended with ${other}`)
            }
          >
            End consultation
          </Button>
        )}
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[1fr_440px]">
        <section aria-label="Video" className="flex flex-col lg:min-h-0">
          {stage()}
        </section>
        <aside
          aria-label="Notes and prescription"
          className="border-border bg-surface flex flex-col overflow-hidden rounded-lg border lg:min-h-0"
        >
          {isDoctor ? (
            <DoctorNotes appointment={appointment} />
          ) : (
            <PatientNotes appointment={appointment} />
          )}
        </aside>
      </main>
    </div>
  );
}
