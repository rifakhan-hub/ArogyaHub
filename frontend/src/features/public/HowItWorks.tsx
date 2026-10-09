import { Card } from "@/components/ui/Card";
import { STEPS } from "./content";
import { Reveal } from "@/components/ui/Reveal";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-border bg-surface scroll-mt-16 border-y py-20">
      <div className="mx-auto max-w-6xl px-8">
        <Reveal>
          <h2 className="text-h1 text-text">A consultation in three steps</h2>
          <p className="text-body-lg text-muted mt-2">
            From symptom to prescription, usually in under an hour.
          </p>
        </Reveal>

        <ol className="mt-8 grid grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 120} className="h-full">
                <Card className="lift h-full p-6">
                  <span className="bg-primary-soft text-body text-primary flex size-10 items-center justify-center rounded-full font-bold">
                    {i + 1}
                  </span>
                  <h3 className="text-h4 text-text mt-4">{step.title}</h3>
                  <p className="text-body text-muted mt-2">{step.body}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
