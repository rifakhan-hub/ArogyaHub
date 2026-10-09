import { Bot, FileImage, Pill, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Every doctor licence-checked",
    body: "Our team checks each registration number on the state medical council register, with the doctor's degree and ID, before they can take a single booking.",
  },
  {
    icon: FileImage,
    title: "MedVault: reports and scans in one place",
    body: "Upload blood tests, prescriptions and even X-ray and MRI scans (DICOM). Share them with your doctor in one click, and take them back when you want.",
  },
  {
    icon: Bot,
    title: "An AI assistant, any time",
    body: "Ask how to book, join a call or share a report. Health answers come only from articles reviewed by doctors, and it never diagnoses. Open it from the button in the bottom-right corner.",
  },
  {
    icon: Pill,
    title: "Prescriptions, ready when the call ends",
    body: "Your doctor's notes and prescription are saved to your vault, ready to download or show at any pharmacy.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-border scroll-mt-16 border-t py-20">
      <div className="mx-auto max-w-6xl px-8">
        <Reveal>
          <h2 className="text-h1 text-text">Care you can check</h2>
          <p className="text-body-lg text-muted mt-2">
            Verified doctors, your records in one place, and an assistant that is always on.
          </p>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-5">
          {FEATURES.map((feature, i) => (
            <li key={feature.title}>
              <Reveal delay={(i % 2) * 120} className="h-full">
                <Card className="lift flex h-full gap-4 p-6">
                  <span className="bg-primary-soft text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <feature.icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-h4 text-text">{feature.title}</h3>
                    <p className="text-body text-muted mt-2">{feature.body}</p>
                  </div>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
