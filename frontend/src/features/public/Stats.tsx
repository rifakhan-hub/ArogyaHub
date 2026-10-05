import { FACTS } from "./content";

export function Stats() {
  return (
    <section aria-label="AarogyaHub in numbers" className="py-16">
      <dl className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8">
        {FACTS.map((fact) => (
          <div key={fact.label}>
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <p className="text-h1 text-primary tabular">
                {fact.value}
                {fact.suffix}
              </p>
              <p className="mt-2 text-small text-muted">{fact.label}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
