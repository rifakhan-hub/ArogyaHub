import { Check } from "lucide-react";

const POINTS = [
  "Choose your own slot lengths, from 5 to 30 minutes",
  "See the patient's reports before the call starts",
  "Write notes and prescriptions that go straight to the patient's vault",
  "Get verified once, then patients across India can find you",
];

export function ForDoctors() {
  return (
    <section id="for-doctors" className="scroll-mt-16 border-t border-border bg-surface py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-12 px-8">
        <div>
          <h2 className="text-h1 text-text">For doctors: your clinic, your hours</h2>
          <p className="mt-3 text-body-lg text-muted">
            AarogyaHub works around the way you practise. Open the hours you want and decide how long each consultation runs.
          </p>
          <a
            href="mailto:doctors@aarogyahub.in?subject=Joining%20AarogyaHub"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-primary px-6 text-body font-semibold text-on-primary hover:bg-primary-hover"
          >
            Talk to our doctor team
          </a>
        </div>
        <ul className="flex flex-col gap-4">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-body text-text">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Check className="size-4" strokeWidth={2.5} aria-hidden />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
