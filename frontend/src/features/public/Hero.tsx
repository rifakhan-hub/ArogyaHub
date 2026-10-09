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
  onSearch: () => void;
}

export function Hero({
  query,
  onQueryChange,
  speciality,
  onSpecialityChange,
  onSearch,
}: HeroProps) {
  const availableNow = DOCTORS.slice(0, 3);

  return (
    <section className="border-border bg-surface border-b">
      <div className="mx-auto grid max-w-6xl grid-cols-[7fr_5fr] items-center gap-12 px-8 py-20">
        <div>
          <h1 className="animate-rise text-display text-text">
            See a verified doctor today, without leaving home.
          </h1>
          <p
            className="animate-rise text-body-lg text-muted mt-5 max-w-xl"
            style={{ animationDelay: "100ms" }}
          >
            Video consultations with licence-checked doctors, right in your browser. Keep your
            reports and scans in one place, and ask our AI assistant anything, any time.
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="animate-rise mt-8 flex max-w-xl gap-2"
            style={{ animationDelay: "200ms" }}
          >
            <label htmlFor="symptom" className="sr-only">
              Symptom or speciality
            </label>
            <div className="relative flex-1">
              <Search
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                aria-hidden
              />
              <input
                id="symptom"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Fever, skin rash, child specialist…"
                className="border-border-strong bg-surface text-body text-text placeholder:text-subtle focus-visible:border-focus focus-visible:ring-focus/30 h-12 w-full rounded-md border pr-3 pl-11 focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-body text-on-primary hover:bg-primary-hover h-12 rounded-md px-6 font-semibold"
            >
              Find doctors
            </button>
          </form>

          <div
            className="animate-rise mt-4 flex flex-wrap gap-2"
            style={{ animationDelay: "300ms" }}
          >
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
                    "text-small rounded-full border px-3.5 py-1.5 font-medium",
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border-strong text-muted hover:bg-surface-muted",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <ul
            className="animate-rise text-small text-muted mt-10 flex flex-wrap gap-x-6 gap-y-3"
            style={{ animationDelay: "400ms" }}
          >
            <li className="flex items-center gap-2">
              <ShieldCheck className="text-primary size-4" aria-hidden />
              Every doctor licence-checked
            </li>
            <li className="flex items-center gap-2">
              <Bot className="text-primary size-4" aria-hidden />
              AI assistant, 24/7
            </li>
            <li className="flex items-center gap-2">
              <Lock className="text-primary size-4" aria-hidden />
              Reports kept private
            </li>
          </ul>
        </div>

        <div className="animate-rise" style={{ animationDelay: "300ms" }}>
          <Card className="animate-float shadow-2 p-6">
            <h2 className="text-h4 text-text">Available in the next hour</h2>
            <ul className="divide-border mt-4 flex flex-col divide-y">
              {availableNow.map((doctor) => (
                <li key={doctor.name} className="flex items-center gap-3 py-3">
                  <Avatar name={doctor.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-text truncate font-semibold">{doctor.name}</p>
                    <p className="text-small text-muted">{doctor.speciality}</p>
                  </div>
                  {doctor.liveNow ? (
                    <Badge tone="success">Online now</Badge>
                  ) : (
                    <span className="text-small text-muted flex items-center gap-1">
                      <Clock className="size-4" aria-hidden />
                      {doctor.nextSlot}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <a
              href="#doctors"
              className="text-small text-primary mt-4 block font-semibold hover:underline"
            >
              See all doctors
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
}
