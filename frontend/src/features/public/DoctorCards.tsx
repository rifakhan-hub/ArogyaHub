import { BadgeCheck, Clock, SearchX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatINR } from "@/lib/format";
import { DOCTORS, type SampleDoctor, SYMPTOM_WORDS } from "./content";
import { Reveal } from "@/components/ui/Reveal";

function matches(doctor: SampleDoctor, query: string, speciality: string) {
  if (speciality && doctor.speciality !== speciality) return false;
  const words = query.trim().toLowerCase();
  if (!words) return true;
  const keywords = [
    doctor.speciality.toLowerCase(),
    doctor.name.toLowerCase(),
    ...(SYMPTOM_WORDS[doctor.speciality] ?? []),
  ];
  return keywords.some((keyword) => keyword.includes(words) || words.includes(keyword));
}

interface DoctorCardsProps {
  query: string;
  speciality: string;
  onClear: () => void;
}

export function DoctorCards({ query, speciality, onClear }: DoctorCardsProps) {
  const doctors = DOCTORS.filter((d) => matches(d, query, speciality));
  const filtered = query.trim() || speciality;

  return (
    <section id="doctors" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-8">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h1 text-text">Find a doctor</h2>
            <p className="text-body-lg text-muted mt-2">
              {filtered
                ? `Doctors for “${speciality || query.trim()}”.`
                : "Every doctor here has had their registration checked with their state medical council."}
            </p>
          </div>
          {filtered && (
            <button
              type="button"
              onClick={onClear}
              className="text-small text-primary font-semibold hover:underline"
            >
              Show all doctors
            </button>
          )}
        </Reveal>

        {doctors.length === 0 ? (
          <div className="border-border-strong mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
            <SearchX className="text-subtle size-8" aria-hidden />
            <p className="text-body text-text font-semibold">No doctor for that yet</p>
            <p className="text-small text-muted">
              Try a speciality like General Physician, or describe the symptom differently.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-3 gap-5">
            {doctors.map((doctor, i) => (
              <li key={doctor.name}>
                <Reveal delay={(i % 3) * 100} className="h-full">
                  <Card className="lift h-full p-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={doctor.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-body-lg text-text flex items-center gap-1.5 font-semibold">
                          <span className="truncate">{doctor.name}</span>
                          <BadgeCheck
                            className="text-primary size-5 shrink-0"
                            aria-label="Licence verified"
                          />
                        </h3>
                        <p className="text-small text-muted">
                          {doctor.speciality} · {doctor.experience} yrs experience
                        </p>
                      </div>
                    </div>
                    <div className="border-border text-small mt-5 flex items-center justify-between border-t pt-4">
                      <span className="text-muted flex items-center gap-1.5">
                        <Clock className="size-4" aria-hidden />
                        Next slot <span className="text-text font-semibold">
                          {doctor.nextSlot}
                        </span>{" "}
                        · {doctor.slotMinutes} min
                      </span>
                      <span className="text-text font-semibold">{formatINR(doctor.fee)}</span>
                    </div>
                    {doctor.liveNow && (
                      <div className="mt-3">
                        <Badge tone="success">Online now</Badge>
                      </div>
                    )}
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
