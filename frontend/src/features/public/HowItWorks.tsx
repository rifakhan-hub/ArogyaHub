import { Card } from "@/components/ui/Card";
import { STEPS } from "./content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-y border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="text-h1 text-text">A consultation in three steps</h2>
        <p className="mt-2 text-body-lg text-muted">From symptom to prescription, usually in under an hour.</p>

        <ol className="mt-8 grid grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-body font-bold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-h4 text-text">{step.title}</h3>
                <p className="mt-2 text-body text-muted">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
