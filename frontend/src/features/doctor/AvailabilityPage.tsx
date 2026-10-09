import { CalendarClock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { toMinutes } from "@/lib/dates";
import { plural } from "@/lib/format";
import { type AvailabilityBlock, DAYS, SLOT_LENGTHS } from "./data";
import { useDoctorData } from "./DoctorLayout";

const DAY_OPTIONS = DAYS.map((d, i) => ({ value: String(i), label: d }));
const SLOT_OPTIONS = SLOT_LENGTHS.map((m) => ({ value: String(m), label: `${m} minutes` }));

function slotCount(block: AvailabilityBlock) {
  return Math.floor((toMinutes(block.end) - toMinutes(block.start)) / block.slotMinutes);
}

export default function AvailabilityPage() {
  const { blocks, addBlock, removeBlock } = useDoctorData();
  const [day, setDay] = useState("0");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [error, setError] = useState("");

  const sorted = [...blocks].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const dayNumber = Number(day);
    if (toMinutes(end) <= toMinutes(start)) {
      setError("The end time must be after the start time.");
      return;
    }
    const overlaps = blocks.some(
      (b) => b.day === dayNumber && toMinutes(start) < toMinutes(b.end) && toMinutes(end) > toMinutes(b.start),
    );
    if (overlaps) {
      setError(`These hours overlap hours you already have on ${DAYS[dayNumber]}.`);
      return;
    }
    setError("");
    addBlock({ day: dayNumber, start, end, slotMinutes: Number(slotMinutes) });
    toast.success(`Added ${DAYS[dayNumber]} ${start}–${end}`);
  }

  return (
    <>
      <title>Availability · Doctor portal</title>
      <PageHeader title="Availability" description="The hours patients can book you each week." />

      <Card className="p-6">
        <h2 className="text-h4 font-semibold">Add hours</h2>
        <form onSubmit={handleAdd} noValidate className="mt-4 grid items-start gap-4 sm:grid-cols-5">
          <Field label="Day" id="day">
            <Select value={day} onChange={setDay} options={DAY_OPTIONS} />
          </Field>
          <Field label="From" id="start">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To" id="end" error={error || undefined}>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Slot length" id="slot">
            <Select value={slotMinutes} onChange={setSlotMinutes} options={SLOT_OPTIONS} />
          </Field>
          <Button type="submit" className="sm:mt-[26px]">
            Add hours
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-h4 font-semibold">Weekly hours</h2>
        {sorted.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No hours yet" body="Add the hours you can take consultations." />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sorted.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{DAYS[b.day]}</p>
                  <p className="text-small text-muted">
                    {b.start}–{b.end} · {b.slotMinutes}-minute slots · {plural(slotCount(b), "slot")}
                  </p>
                </div>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => removeBlock(b.id)}
                  aria-label={`Remove ${DAYS[b.day]} ${b.start}–${b.end}`}
                >
                  <Trash2 aria-hidden />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
