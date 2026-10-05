import { ChevronDown } from "lucide-react";
import { FAQS } from "./content";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border py-20">
      <div className="mx-auto max-w-3xl px-8">
        <h2 className="text-h1 text-text">Questions</h2>
        <p className="mt-2 text-body-lg text-muted">
          Something else? Write to{" "}
          <a href="mailto:help@aarogyahub.in" className="font-semibold text-primary hover:underline">
            help@aarogyahub.in
          </a>
          .
        </p>
        <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-body-lg font-semibold text-text [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="size-5 shrink-0 text-subtle group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 text-body text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
