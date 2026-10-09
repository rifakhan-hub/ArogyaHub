import { CalendarOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatTime, todayIST, toMinutes } from "@/lib/dates";
import { plural } from "@/lib/format";
import { dateKey, formatLongDate, weekdayIndex } from "@/lib/calendar";
import { type AvailabilityBlock, DAYS, SLOT_LENGTHS } from "./data";
import { useDoctorData } from "./DoctorLayout";
import { MonthCalendar } from "./MonthCalendar";

const SLOT_OPTIONS = SLOT_LENGTHS.map((m) => ({ value: String(m), label: `${m} minutes` }));

function slotCount(block: AvailabilityBlock) {
  return Math.floor((toMinutes(block.end) - toMinutes(block.start)) / block.slotMinutes);
}

export default function SchedulePage() {
  const { appointments, blocks, daysOff, addBlock, removeBlock, toggleDayOff } = useDoctorData();
  const today = todayIST();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });

  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [error, setError] = useState("");

  const weekday = weekdayIndex(selected);
  const dayName = DAYS[weekday];
  const dayOff = daysOff.includes(selected);
  const dayBlocks = blocks.filter((b) => b.day === weekday).sort((a, b) => a.start.localeCompare(b.start));
  const dayAppointments = appointments
    .filter((a) => dateKey(a.start) === selected)
    .sort((a, b) => a.start.localeCompare(b.start));

  function dayInfo(date: string) {
    return {
      consultations: appointments.filter((a) => dateKey(a.start) === date && a.status !== "cancelled").length,
      hasHours: blocks.some((b) => b.day === weekdayIndex(date)),
      dayOff: daysOff.includes(date),
    };
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (toMinutes(end) <= toMinutes(start)) {
      setError("The end time must be after the start time.");
      return;
    }
    const overlaps = dayBlocks.some((b) => toMinutes(start) < toMinutes(b.end) && toMinutes(end) > toMinutes(b.start));
    if (overlaps) {
      setError(`These hours overlap hours you already have on ${dayName}s.`);
      return;
    }
    setError("");
    addBlock({ day: weekday, start, end, slotMinutes: Number(slotMinutes) });
    toast.success(`Added ${start}–${end} every ${dayName}`);
  }

  function handleDayOff() {
    toggleDayOff(selected);
    toast.success(dayOff ? "You're working this day again" : "Marked as a day off. Patients can't book it.");
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-h4 font-semibold">{formatLongDate(selected)}</h2>
            <Button variant={dayOff ? "secondary" : "outline"} size="sm" onClick={handleDayOff}>
              <CalendarOff aria-hidden />
              {dayOff ? "Undo day off" : "Take this day off"}
            </Button>
          </div>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-semibold uppercase tracking-wide text-subtle">Consultations</h3>
            {dayAppointments.length === 0 ? (
              <p className="text-small text-muted">No consultations on this day.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayAppointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-3 py-2">
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-small font-semibold">{formatTime(a.start)}</span>
                      <span className="text-small">{a.patient}</span>
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
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-small">
                      <span className="font-semibold">
                        {b.start}–{b.end}
                      </span>{" "}
                      · {b.slotMinutes}-minute slots · {plural(slotCount(b), "slot")}
                    </span>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      onClick={() => removeBlock(b.id)}
                      aria-label={`Remove ${dayName} ${b.start}–${b.end}`}
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
            <Button type="submit" className="self-start">
              Add hours
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
