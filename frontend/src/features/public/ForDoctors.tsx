import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const POINTS = [
  "Choose your own slot lengths, from 5 to 30 minutes",
  "See the patient's reports before the call starts",
  "Write notes and prescriptions that go straight to the patient's vault",
  "Get verified once, then patients across India can find you",
];

export function ForDoctors() {
  return (
    <section id="for-doctors" className="border-border bg-surface scroll-mt-16 border-t py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-12 px-8">
        <Reveal>
          <h2 className="text-h1 text-text">For doctors: your clinic, your hours</h2>
          <p className="text-body-lg text-muted mt-3">
            AarogyaHub works around the way you practise. Open the hours you want and decide how
            long each consultation runs.
          </p>
          <a
            href="mailto:doctors@aarogyahub.in?subject=Joining%20AarogyaHub"
            className="bg-primary text-body text-on-primary hover:bg-primary-hover mt-8 inline-flex h-12 items-center rounded-md px-6 font-semibold"
          >
            Talk to our doctor team
          </a>
        </Reveal>
        <ul className="flex flex-col gap-4">
          {POINTS.map((point, i) => (
            <li key={point}>
              <Reveal delay={i * 100} className="text-body text-text flex items-start gap-3">
                <span className="bg-primary-soft text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-4" strokeWidth={2.5} aria-hidden />
                </span>
                {point}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
