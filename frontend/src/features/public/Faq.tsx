import { ChevronDown } from "lucide-react";
import { FAQS } from "./content";
import { Reveal } from "@/components/ui/Reveal";

export function Faq() {
  return (
    <section id="faq" className="border-border scroll-mt-16 border-t py-20">
      <Reveal className="mx-auto max-w-3xl px-8">
        <h2 className="text-h1 text-text">Questions</h2>
        <p className="text-body-lg text-muted mt-2">
          Something else? Write to{" "}
          <a
            href="mailto:help@aarogyahub.in"
            className="text-primary font-semibold hover:underline"
          >
            help@aarogyahub.in
          </a>
          .
        </p>
        <div className="divide-border border-border bg-surface mt-8 divide-y rounded-lg border">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5">
              <summary className="text-body-lg text-text flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  className="text-subtle size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-body text-muted pb-5">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
