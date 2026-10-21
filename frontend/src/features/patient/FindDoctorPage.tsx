import { BadgeCheck, SearchX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { bookAppointment } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { Appointment, DoctorCard, Paginated, Slot } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { SearchBox, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { SPECIALITIES } from "@/features/doctor/profileForm";
import { MonthCalendar } from "@/features/portal/MonthCalendar";
import { refreshData, useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { formatLongDate } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatTime, todayIST } from "@/lib/dates";
import { formatINR } from "@/lib/format";

const SPECIALITY_OPTIONS = [{ value: "", label: "All specialities" }, ...SPECIALITIES.map((s) => ({ value: s, label: s }))];

export default function FindDoctorPage() {
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const q = useDebounced(query, 300);
  const { data, error, reload } = useApi<Paginated<DoctorCard>>("/doctors", { q, specialization, page_size: 50 });
  const doctor = data?.items.find((d) => d.id === doctorId) ?? data?.items[0];

  return (
    <>
      <title>Find a doctor · Patient portal</title>
      <PageHeader title="Find a doctor" description="Pick a doctor, then a day and a time that suits you." />

      <div className="flex flex-wrap gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name or speciality" />
        <Select
          aria-label="Speciality"
          value={specialization}
          onChange={setSpecialization}
          options={SPECIALITY_OPTIONS}
          className="w-56"
        />
      </div>

      {error ? (
        <ErrorMessage error={error} onRetry={reload} />
      ) : !data ? (
        <Spinner />
      ) : !doctor ? (
        <Card>
          <EmptyState icon={SearchX} title="No doctors match" body="Try another name or speciality." />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  aria-pressed={d.id === doctor.id}
                  onClick={() => setDoctorId(d.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                    d.id === doctor.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <Avatar name={d.name} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {d.name}
                      <BadgeCheck className="size-4 text-primary" aria-label="Licence verified" />
                    </span>
                    <span className="block text-small text-muted">
                      {d.specialization} · {formatINR(d.consultation_fee)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <BookingPanel key={doctor.id} doctor={doctor} />
        </>
      )}
    </>
  );
}

function BookingPanel({ doctor }: { doctor: DoctorCard }) {
  const navigate = useNavigate();
  const today = todayIST();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const slots = useApi<Slot[]>(`/doctors/${doctor.id}/slots`, { date: selected });
  const appointments = useApi<Appointment[]>("/appointments/me");

  const booked = (appointments.data ?? []).filter((a) => a.status !== "cancelled");

  function dayInfo(date: string) {
    return {
      count: booked.filter((a) => todayIST(new Date(a.start_time)) === date).length,
      disabled: date < today,
    };
  }

  async function handleBook() {
    if (!slot) return;
    setSaving(true);
    try {
      await bookAppointment(doctor.id, slot.start, reason.trim() || null);
      toast.success(`Booked ${doctor.name} at ${formatTime(slot.start)}`);
      refreshData();
      navigate("/patient/appointments");
    } catch (err) {
      toast.error((err as ApiError).message);
      setSlot(null);
      slots.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
      <Card className="p-6">
        <MonthCalendar
          year={view.year}
          month={view.month}
          today={today}
          selected={selected}
          onSelect={(date) => {
            setSelected(date);
            setSlot(null);
          }}
          onMonthChange={setView}
          dayInfo={dayInfo}
          countLabel="My appointments"
        />
      </Card>

      <Card className="flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-h4 font-semibold">{formatLongDate(selected)}</h2>
          <p className="text-small text-muted">
            {doctor.name} · {doctor.qualifications} · {doctor.experience_years} years
            {doctor.city ? ` · ${doctor.city}` : ""}
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-small font-semibold uppercase tracking-wide text-subtle">Free times</h3>
          {slots.error ? (
            <ErrorMessage error={slots.error} onRetry={slots.reload} />
          ) : !slots.data ? (
            <Spinner />
          ) : slots.data.length === 0 ? (
            <p className="text-small text-muted">No free times on this day. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.data.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  aria-pressed={slot?.start === s.start}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "h-10 rounded-md border text-small font-medium",
                    slot?.start === s.start
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border-strong bg-surface hover:bg-surface-muted",
                  )}
                >
                  {formatTime(s.start)}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <Field label="Reason for the visit" id="reason" optional>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{formatINR(doctor.consultation_fee)}</span>
            <Button onClick={handleBook} disabled={!slot} loading={saving}>
              Book appointment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
