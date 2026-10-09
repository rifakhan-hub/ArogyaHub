import { FACTS } from "./content";
import { Reveal } from "@/components/ui/Reveal";

export function Stats() {
  return (
    <section aria-label="AarogyaHub in numbers" className="py-16">
      <dl className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8">
        {FACTS.map((fact, i) => (
          <Reveal key={fact.label} delay={i * 100}>
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <p className="text-h1 text-primary tabular">
                {fact.value}
                {fact.suffix}
              </p>
              <p className="text-small text-muted mt-2">{fact.label}</p>
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
