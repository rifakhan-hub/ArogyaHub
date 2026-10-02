import { BadgeCheck, Clock, SearchX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatINR } from "@/lib/format";
import { DOCTORS, type SampleDoctor, SYMPTOM_WORDS } from "./content";

/** Keeps the doctors who match the typed symptom (or speciality name) and the chosen chip. */
function matches(doctor: SampleDoctor, query: string, speciality: string) {
  if (speciality && doctor.speciality !== speciality) return false;
  const words = query.trim().toLowerCase();
  if (!words) return true;
  const keywords = [doctor.speciality.toLowerCase(), doctor.name.toLowerCase(), ...(SYMPTOM_WORDS[doctor.speciality] ?? [])];
  return keywords.some((keyword) => keyword.includes(words) || words.includes(keyword));
}

interface DoctorCardsProps {
  query: string;
  speciality: string;
  onClear: () => void;
}

/** The doctors, filtered by the search at the top of the page. */
export function DoctorCards({ query, speciality, onClear }: DoctorCardsProps) {
  const doctors = DOCTORS.filter((d) => matches(d, query, speciality));
  const filtered = query.trim() || speciality;

  return (
    <section id="doctors" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h1 text-text">Find a doctor</h2>
            <p className="mt-2 text-body-lg text-muted">
              {filtered
                ? `Doctors for “${speciality || query.trim()}”.`
                : "Every doctor here has had their registration checked with their state medical council."}
            </p>
          </div>
          {filtered && (
            <button type="button" onClick={onClear} className="text-small font-semibold text-primary hover:underline">
              Show all doctors
            </button>
          )}
        </div>

        {doctors.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
            <SearchX className="size-8 text-subtle" aria-hidden />
            <p className="text-body font-semibold text-text">No doctor for that yet</p>
            <p className="text-small text-muted">Try a speciality like General Physician, or describe the symptom differently.</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-3 gap-5">
            {doctors.map((doctor) => (
              <li key={doctor.name}>
                <Card className="h-full p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={doctor.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="flex items-center gap-1.5 text-body-lg font-semibold text-text">
                        <span className="truncate">{doctor.name}</span>
                        <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Licence verified" />
                      </h3>
                      <p className="text-small text-muted">
                        {doctor.speciality} · {doctor.experience} yrs experience
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-small">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Clock className="size-4" aria-hidden />
                      Next slot <span className="font-semibold text-text">{doctor.nextSlot}</span> · {doctor.slotMinutes} min
                    </span>
                    <span className="font-semibold text-text">{formatINR(doctor.fee)}</span>
                  </div>
                  {doctor.liveNow && (
                    <div className="mt-3">
                      <Badge tone="success">Online now</Badge>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
