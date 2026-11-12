import { BadgeCheck, Clock, SearchX } from "lucide-react";
import { Link } from "react-router";
import type { ApiError } from "@/api/client";
import type { DoctorCard, Paginated } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { bookPath, nextSlotText } from "./content";

interface DoctorCardsProps {
  result: Paginated<DoctorCard> | undefined;
  error: ApiError | undefined;
  onRetry: () => void;
  filter: string;
  onClear: () => void;
}

export function DoctorCards({ result, error, onRetry, filter, onClear }: DoctorCardsProps) {
  const { user } = useAuth();
  const canBook = !user || user.role === "patient";

  return (
    <section id="doctors" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-8">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h1 text-text">Find a doctor</h2>
            <p className="text-body-lg text-muted mt-2">
              {filter
                ? `Doctors for “${filter}”.`
                : "Every doctor here has had their registration checked with their state medical council."}
            </p>
          </div>
          {filter ? (
            <button
              type="button"
              onClick={onClear}
              className="text-small text-primary font-semibold hover:underline"
            >
              Show all doctors
            </button>
          ) : (
            result && (
              <p className="text-small text-muted">
                {result.total} verified {result.total === 1 ? "doctor" : "doctors"}
              </p>
            )
          )}
        </Reveal>

        {error ? (
          <ErrorMessage error={error} onRetry={onRetry} />
        ) : !result ? (
          <ul
            aria-label="Loading doctors"
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3].map((n) => (
              <li key={n} className="bg-surface-muted h-40 animate-pulse rounded-lg" />
            ))}
          </ul>
        ) : result.items.length === 0 ? (
          <div className="border-border-strong mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
            <SearchX className="text-subtle size-8" aria-hidden />
            <p className="text-body text-text font-semibold">
              {filter ? "No doctor for that yet" : "No doctors have joined yet"}
            </p>
            <p className="text-small text-muted">
              {filter
                ? "Try a speciality like General Physician, or describe the symptom differently."
                : "Check back soon."}
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((doctor, i) => (
              <li key={doctor.id}>
                <Reveal delay={(i % 3) * 100} className="h-full">
                  <Card className="lift flex h-full flex-col p-5">
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
                          {doctor.specialization} · {doctor.experience_years} yrs experience
                        </p>
                        <p className="text-small text-muted">
                          {doctor.qualifications}
                          {doctor.city ? ` · ${doctor.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="border-border text-small mt-auto flex items-center justify-between gap-3 border-t pt-4">
                      <span className="text-muted flex items-center gap-1.5">
                        <Clock className="size-4 shrink-0" aria-hidden />
                        <span>
                          Next slot{" "}
                          <span className="text-text font-semibold">
                            {nextSlotText(doctor.next_slot)}
                          </span>
                        </span>
                      </span>
                      <span className="text-text font-semibold">
                        {formatINR(doctor.consultation_fee)}
                      </span>
                    </div>
                    {canBook && (
                      <Link
                        to={bookPath(doctor.id)}
                        className={cn(buttonClass("primary", "sm"), "mt-4")}
                        aria-label={`Book ${doctor.name}`}
                      >
                        Book consultation
                      </Link>
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
