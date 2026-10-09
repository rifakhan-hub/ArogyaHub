import { BadgeCheck, SearchX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DOCTORS, SPECIALITIES, type SampleDoctor } from "@/features/public/content";
import { cn } from "@/lib/cn";
import { formatRelativeDay, istDateTime } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { SLOT_TIMES } from "./data";
import { usePatientData } from "./PatientLayout";

const SPECIALITY_OPTIONS = [{ value: "", label: "All specialities" }, ...SPECIALITIES.map((s) => ({ value: s, label: s }))];

export default function FindDoctorPage() {
  const { appointments, book } = usePatientData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [doctor, setDoctor] = useState<SampleDoctor | null>(null);
  const [time, setTime] = useState("");

  const q = query.trim().toLowerCase();
  const doctors = DOCTORS.filter(
    (d) =>
      (!speciality || d.speciality === speciality) &&
      (!q || d.name.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q)),
  );

  const takenTimes = (d: SampleDoctor) =>
    appointments.filter((a) => a.doctor === d.name && a.status === "scheduled").map((a) => a.start);

  function openBooking(d: SampleDoctor) {
    setDoctor(d);
    setTime("");
  }

  function confirmBooking() {
    if (!doctor || !time) return;
    book({ doctor: doctor.name, speciality: doctor.speciality, start: istDateTime(1, time), fee: doctor.fee });
    toast.success(`Booked ${doctor.name} for tomorrow at ${time}`);
    setDoctor(null);
    navigate("/patient/appointments");
  }

  return (
    <>
      <title>Find a doctor · Patient portal</title>
      <PageHeader title="Find a doctor" description="Every doctor here has a checked medical licence." />

      <div className="flex flex-wrap gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name or speciality" />
        <Select
          aria-label="Speciality"
          value={speciality}
          onChange={setSpeciality}
          options={SPECIALITY_OPTIONS}
          className="w-56"
        />
      </div>

      {doctors.length === 0 ? (
        <Card>
          <EmptyState icon={SearchX} title="No doctors match" body="Try another name or speciality." />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <li key={d.name}>
              <Card className="lift flex h-full flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={d.name} size="lg" />
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold">
                      {d.name}
                      <BadgeCheck className="size-4 text-primary" aria-label="Licence verified" />
                    </p>
                    <p className="text-small text-muted">{d.speciality}</p>
                  </div>
                </div>
                <p className="text-small text-muted">
                  {d.experience} years · {d.council} registered · {d.slotMinutes} min consultation
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-semibold">{formatINR(d.fee)}</span>
                  <Button size="sm" onClick={() => openBooking(d)} aria-label={`Book ${d.name}`}>
                    Book
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={doctor !== null} onClose={() => setDoctor(null)} label={`Book ${doctor?.name ?? ""}`}>
        {doctor && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-h4 font-semibold">Book {doctor.name}</h2>
              <p className="text-small text-muted">
                {doctor.speciality} · {formatINR(doctor.fee)} · {formatRelativeDay(istDateTime(1, "10:00"))}
              </p>
            </div>
            <fieldset>
              <legend className="mb-2 text-small font-semibold">Choose a time</legend>
              <div className="grid grid-cols-3 gap-2">
                {SLOT_TIMES.map((t) => {
                  const taken = takenTimes(doctor).includes(istDateTime(1, t));
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={taken}
                      aria-pressed={time === t}
                      onClick={() => setTime(t)}
                      className={cn(
                        "h-10 rounded-md border text-small font-medium disabled:cursor-not-allowed disabled:opacity-40",
                        time === t
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-strong bg-surface hover:bg-surface-muted",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDoctor(null)}>
                Cancel
              </Button>
              <Button onClick={confirmBooking} disabled={!time}>
                Confirm booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
