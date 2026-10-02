import { Bot, Clock, Lock, Search, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { DOCTORS, SPECIALITIES } from "./content";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  speciality: string;
  onSpecialityChange: (value: string) => void;
  /** Scrolls down to the doctors. */
  onSearch: () => void;
}

/** The top of the page: headline, symptom search, and the doctors available now (design doc 8.2). */
export function Hero({ query, onQueryChange, speciality, onSpecialityChange, onSearch }: HeroProps) {
  const availableNow = DOCTORS.slice(0, 3);

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-[7fr_5fr] items-center gap-12 px-8 py-20">
        <div>
          <h1 className="text-display text-text">See a verified doctor today, without leaving home.</h1>
          <p className="mt-5 max-w-xl text-body-lg text-muted">
            Video consultations with licence-checked doctors, right in your browser. Keep your reports and scans in one place, and
            ask our AI assistant anything, any time.
          </p>

          {/* symptom search */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="mt-8 flex max-w-xl gap-2"
          >
            <label htmlFor="symptom" className="sr-only">
              Symptom or speciality
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
              <input
                id="symptom"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Fever, skin rash, child specialist…"
                className="h-12 w-full rounded-md border border-border-strong bg-surface pl-11 pr-3 text-body text-text placeholder:text-subtle focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30"
              />
            </div>
            <button type="submit" className="h-12 rounded-md bg-primary px-6 text-body font-semibold text-on-primary hover:bg-primary-hover">
              Find doctors
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {SPECIALITIES.slice(0, 4).map((name) => {
              const active = speciality === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onSpecialityChange(active ? "" : name);
                    onSearch();
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-small font-medium",
                    active ? "border-primary bg-primary text-on-primary" : "border-border-strong text-muted hover:bg-surface-muted",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-small text-muted">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Every doctor licence-checked
            </li>
            <li className="flex items-center gap-2">
              <Bot className="size-4 text-primary" aria-hidden />
              AI assistant, 24/7
            </li>
            <li className="flex items-center gap-2">
              <Lock className="size-4 text-primary" aria-hidden />
              Reports kept private
            </li>
          </ul>
        </div>

        {/* doctors you could see in the next hour */}
        <Card className="p-6">
          <h2 className="text-h4 text-text">Available in the next hour</h2>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {availableNow.map((doctor) => (
              <li key={doctor.name} className="flex items-center gap-3 py-3">
                <Avatar name={doctor.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-text">{doctor.name}</p>
                  <p className="text-small text-muted">{doctor.speciality}</p>
                </div>
                {doctor.liveNow ? (
                  <Badge tone="success">Online now</Badge>
                ) : (
                  <span className="flex items-center gap-1 text-small text-muted">
                    <Clock className="size-4" aria-hidden />
                    {doctor.nextSlot}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <a href="#doctors" className="mt-4 block text-small font-semibold text-primary hover:underline">
            See all doctors
          </a>
        </Card>
      </div>
    </section>
  );
}
