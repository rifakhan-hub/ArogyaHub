import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApiError } from "@/api/client";
import { addAvailability, removeAvailability } from "@/api/doctors";
import type { Appointment, AvailabilityBlock } from "@/api/types";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { refreshData, useApi } from "@/hooks/useApi";
import { formatLongDate, weekdayIndex } from "@/lib/calendar";
import { formatTime, todayIST, toMinutes } from "@/lib/dates";
import { plural } from "@/lib/format";
import { DAYS, SLOT_LENGTHS, shortTime } from "./data";
import { MonthCalendar } from "./MonthCalendar";

const SLOT_OPTIONS = SLOT_LENGTHS.map((m) => ({ value: String(m), label: `${m} minutes` }));

function slotCount(block: AvailabilityBlock) {
  return Math.floor((toMinutes(block.end_time) - toMinutes(block.start_time)) / block.slot_minutes);
}

function istDay(iso: string) {
  return todayIST(new Date(iso));
}

export default function SchedulePage() {
  const blocks = useApi<AvailabilityBlock[]>("/doctors/me/availability");
  const appointments = useApi<Appointment[]>("/appointments/me");
  const today = todayIST();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });

  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadError = blocks.error ?? appointments.error;
  if (loadError) return <ErrorMessage error={loadError} onRetry={blocks.reload} />;
  if (!blocks.data || !appointments.data) return <Spinner />;

  const allBlocks = blocks.data;
  const active = appointments.data.filter((a) => a.status !== "cancelled");
  const weekday = weekdayIndex(selected);
  const dayName = DAYS[weekday];
  const dayBlocks = allBlocks.filter((b) => b.day_of_week === weekday);
  const dayAppointments = active.filter((a) => istDay(a.start_time) === selected);

  function dayInfo(date: string) {
    return {
      consultations: active.filter((a) => istDay(a.start_time) === date).length,
      hasHours: allBlocks.some((b) => b.day_of_week === weekdayIndex(date)),
    };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (toMinutes(end) <= toMinutes(start)) {
      setError("The end time must be after the start time.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addAvailability({ day_of_week: weekday, start_time: start, end_time: end, slot_minutes: Number(slotMinutes) });
      toast.success(`Added ${start}–${end} every ${dayName}`);
      refreshData();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(block: AvailabilityBlock) {
    try {
      await removeAvailability(block.id);
      toast.success(`Removed ${dayName} ${shortTime(block.start_time)}–${shortTime(block.end_time)}`);
      refreshData();
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  }

  return (
    <>
      <title>Schedule · Doctor portal</title>
      <PageHeader title="Schedule" description="Pick a day to see its consultations and set your weekly hours." />

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="p-6">
          <MonthCalendar
            year={view.year}
            month={view.month}
            today={today}
            selected={selected}
            onSelect={(date) => {
              setSelected(date);
              setError("");
            }}
            onMonthChange={setView}
            dayInfo={dayInfo}
          />
        </Card>

        <Card className="flex flex-col gap-6 p-6">
          <h2 className="text-h4 font-semibold">{formatLongDate(selected)}</h2>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-semibold uppercase tracking-wide text-subtle">Consultations</h3>
            {dayAppointments.length === 0 ? (
              <p className="text-small text-muted">No consultations on this day.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayAppointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-3 py-2">
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-small font-semibold">{formatTime(a.start_time)}</span>
                      <span className="text-small">{a.patient_name}</span>
                    </span>
                    <AppointmentBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-semibold uppercase tracking-wide text-subtle">Hours every {dayName}</h3>
            {dayBlocks.length === 0 ? (
              <p className="text-small text-muted">You don't work on {dayName}s yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayBlocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                    <span className="text-small">
                      <span className="font-semibold">
                        {shortTime(b.start_time)}–{shortTime(b.end_time)}
                      </span>{" "}
                      · {b.slot_minutes}-minute slots · {plural(slotCount(b), "slot")}
                    </span>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(b)}
                      aria-label={`Remove ${dayName} ${shortTime(b.start_time)}–${shortTime(b.end_time)}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={handleAdd} noValidate className="flex flex-col gap-4 border-t border-border pt-5">
            <h3 className="text-body font-semibold">Add hours every {dayName}</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="From" id="start">
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="To" id="end">
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </Field>
              <Field label="Slot length" id="slot">
                <Select value={slotMinutes} onChange={setSlotMinutes} options={SLOT_OPTIONS} />
              </Field>
            </div>
            {error && (
              <p role="alert" className="text-small text-danger">
                {error}
              </p>
            )}
            <Button type="submit" className="self-start" loading={saving}>
              Add hours
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
