import { Bot, FileImage, Pill, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
    <section id="features" className="scroll-mt-16 border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="text-h1 text-text">Care you can check</h2>
        <p className="mt-2 text-body-lg text-muted">
          Verified doctors, your records in one place, and an assistant that is always on.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <Card className="flex h-full gap-4 p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <feature.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-h4 text-text">{feature.title}</h3>
                  <p className="mt-2 text-body text-muted">{feature.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
