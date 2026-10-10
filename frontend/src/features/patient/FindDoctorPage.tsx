import { BadgeCheck, SearchX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { bookAppointment } from "@/api/appointments";
import type { ApiError } from "@/api/client";
import type { DoctorCard, Paginated, Slot } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { SearchBox, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { SPECIALITIES } from "@/features/doctor/profileForm";
import { refreshData, useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { cn } from "@/lib/cn";
import { daysFromToday, formatDay, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";

const SPECIALITY_OPTIONS = [{ value: "", label: "All specialities" }, ...SPECIALITIES.map((s) => ({ value: s, label: s }))];

const NEXT_DAYS = Array.from({ length: 7 }, (_, i) => daysFromToday(i));

export default function FindDoctorPage() {
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [doctor, setDoctor] = useState<DoctorCard | null>(null);
  const q = useDebounced(query, 300);
  const { data, error, reload } = useApi<Paginated<DoctorCard>>("/doctors", { q, specialization, page_size: 50 });

  return (
    <>
      <title>Find a doctor · Patient portal</title>
      <PageHeader title="Find a doctor" description="Every doctor here has a checked medical licence." />

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
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon={SearchX} title="No doctors match" body="Try another name or speciality." />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((d) => (
            <li key={d.id}>
              <Card className="lift flex h-full flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={d.name} size="lg" />
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold">
                      {d.name}
                      <BadgeCheck className="size-4 text-primary" aria-label="Licence verified" />
                    </p>
                    <p className="text-small text-muted">{d.specialization}</p>
                  </div>
                </div>
                <p className="text-small text-muted">
                  {d.qualifications} · {d.experience_years} years{d.city ? ` · ${d.city}` : ""}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-semibold">{formatINR(d.consultation_fee)}</span>
                  <Button size="sm" onClick={() => setDoctor(d)} aria-label={`Book ${d.name}`}>
                    Book
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <BookingModal doctor={doctor} onClose={() => setDoctor(null)} />
    </>
  );
}

function BookingModal({ doctor, onClose }: { doctor: DoctorCard | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [day, setDay] = useState(NEXT_DAYS[0]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const slots = useApi<Slot[]>(doctor ? `/doctors/${doctor.id}/slots` : null, { date: day });

  function close() {
    setDay(NEXT_DAYS[0]);
    setSlot(null);
    setReason("");
    onClose();
  }

  async function confirm() {
    if (!doctor || !slot) return;
    setSaving(true);
    try {
      await bookAppointment(doctor.id, slot.start, reason.trim() || null);
      toast.success(`Booked ${doctor.name} at ${formatTime(slot.start)}`);
      refreshData();
      close();
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
    <Modal open={doctor !== null} onClose={close} label={`Book ${doctor?.name ?? ""}`}>
      {doctor && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-h4 font-semibold">Book {doctor.name}</h2>
            <p className="text-small text-muted">
              {doctor.specialization} · {formatINR(doctor.consultation_fee)}
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-small font-semibold">Choose a day</legend>
            <div className="flex flex-wrap gap-2">
              {NEXT_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === d}
                  onClick={() => {
                    setDay(d);
                    setSlot(null);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-small font-medium",
                    day === d ? "border-primary bg-primary text-on-primary" : "border-border-strong hover:bg-surface-muted",
                  )}
                >
                  {formatDay(d)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-small font-semibold">Choose a time</legend>
            {!slots.data ? (
              <Spinner />
            ) : slots.data.length === 0 ? (
              <p className="text-small text-muted">No free times on this day. Try another day.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
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
          </fieldset>

          <Field label="Reason for the visit" id="reason" optional>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!slot} loading={saving}>
              Confirm booking
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
