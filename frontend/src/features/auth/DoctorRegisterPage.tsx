import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { registerDoctor } from "@/api/auth";
import type { ApiError } from "@/api/client";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { DetailList } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  AboutFields,
  EMPTY_PROFILE,
  ProfessionalFields,
  type ProfileErrors,
  type ProfileForm,
  toProfileInput,
  validateAbout,
  validateProfessional,
} from "@/features/doctor/profileForm";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { isEmail, isPhone } from "@/lib/validators";

const STEPS = ["Account", "Professional details", "About you", "Review"];

interface AccountForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  confirm: string;
}

type AccountErrors = Partial<Record<keyof AccountForm, string>>;

const EMPTY_ACCOUNT: AccountForm = { name: "", email: "", phone: "", city: "", password: "", confirm: "" };

function validateAccount(form: AccountForm): AccountErrors {
  const errors: AccountErrors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name";
  if (!isEmail(form.email)) errors.email = "Enter an email address, like name@example.com";
  if (form.phone.trim() && !isPhone(form.phone)) errors.phone = "Use 10 to 15 digits, with an optional + at the start";
  if (form.password.length < 8) errors.password = "Use at least 8 characters";
  else if (form.confirm !== form.password) errors.confirm = "The passwords don't match";
  return errors;
}

export default function DoctorRegisterPage() {
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [confirmed, setConfirmed] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function next() {
    if (step === 0) {
      const errors = validateAccount(account);
      setAccountErrors(errors);
      if (Object.keys(errors).length) return;
    }
    if (step === 1 || step === 2) {
      const errors = step === 1 ? validateProfessional(profile) : validateAbout(profile);
      setProfileErrors(errors);
      if (Object.keys(errors).length) return;
    }
    setStep(step + 1);
  }

  async function submit() {
    if (!confirmed) {
      setServerError("Tick the box to confirm your details.");
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      await registerDoctor({
        name: account.name.trim(),
        email: account.email.trim(),
        phone: account.phone.trim() || null,
        city: account.city.trim() || null,
        password: account.password,
        ...toProfileInput(profile),
      });
      setDone(true);
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "EMAIL_TAKEN" || error.code === "PHONE_TAKEN") {
        setAccountErrors({ [error.code === "EMAIL_TAKEN" ? "email" : "phone"]: error.message });
        setStep(0);
      } else if (error.code === "LICENSE_TAKEN") {
        setProfileErrors({ license_number: error.message });
        setStep(1);
      } else {
        setServerError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-text">
      <title>Join as a doctor · AarogyaHub</title>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <Link to="/" aria-label="AarogyaHub home">
            <Logo onDark={false} subtitle="Online doctor consultations" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <Card className="p-8">
          {done ? (
            <div className="flex flex-col items-start gap-4" role="status">
              <span className="flex size-12 items-center justify-center rounded-lg bg-success-soft text-success">
                <CheckCircle2 className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <h1 className="text-h2">Profile sent for review</h1>
              <p className="text-body text-muted">
                Thank you, {account.name.trim()}. Our team will check your licence with {profile.council.trim()}. You can
                log in any time to see your status.
              </p>
              <Link to={`/login?email=${encodeURIComponent(account.email.trim())}`} className={buttonClass("primary", "md")}>
                Log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-h2">Join AarogyaHub as a doctor</h1>
              <p className="mt-2 text-body text-muted">Four short steps. An admin checks your licence before patients can book you.</p>

              <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Sign-up steps">
                {STEPS.map((label, i) => (
                  <li key={label} className="flex flex-col gap-2" aria-current={i === step ? "step" : undefined}>
                    <span className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-caption font-medium",
                        i === step ? "text-primary" : "text-muted",
                      )}
                    >
                      {i < step ? <Check className="size-3.5" aria-hidden /> : `${i + 1}.`} {label}
                    </span>
                  </li>
                ))}
              </ol>

              <h2 className="mt-8 text-h4 font-semibold">{STEPS[step]}</h2>

              <div className="mt-5">
                {step === 0 && <AccountStep form={account} errors={accountErrors} onChange={setAccount} />}
                {step === 1 && (
                  <ProfessionalFields
                    form={profile}
                    errors={profileErrors}
                    onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
                  />
                )}
                {step === 2 && (
                  <AboutFields
                    form={profile}
                    errors={profileErrors}
                    onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
                  />
                )}
                {step === 3 && (
                  <ReviewStep account={account} profile={profile} onEdit={setStep} confirmed={confirmed} onConfirm={setConfirmed} />
                )}
              </div>

              {serverError && (
                <p role="alert" className="mt-5 flex items-start gap-2 rounded-md bg-danger-soft p-3 text-small">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {serverError}
                </p>
              )}

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                {step > 0 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                ) : (
                  <Link to="/register" className="text-small font-semibold text-primary hover:underline">
                    I'm a patient
                  </Link>
                )}
                {step < STEPS.length - 1 ? (
                  <Button onClick={next}>Continue</Button>
                ) : (
                  <Button onClick={submit} loading={submitting}>
                    Submit for review
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

function AccountStep({
  form,
  errors,
  onChange,
}: {
  form: AccountForm;
  errors: AccountErrors;
  onChange: (form: AccountForm) => void;
}) {
  const set = (key: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [key]: e.target.value });

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" id="name" error={errors.name}>
        <Input autoComplete="name" placeholder="Dr. Kavya Rao" value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Email" id="email" error={errors.email}>
        <Input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
      </Field>
      <Field label="Phone" id="phone" optional error={errors.phone}>
        <Input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      </Field>
      <Field label="City" id="city" optional>
        <Input autoComplete="address-level2" value={form.city} onChange={set("city")} />
      </Field>
      <Field label="Password" id="password" hint="At least 8 characters" error={errors.password}>
        <Input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
      </Field>
      <Field label="Confirm password" id="confirm" error={errors.confirm}>
        <Input type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
      </Field>
    </div>
  );
}

function ReviewStep({
  account,
  profile,
  onEdit,
  confirmed,
  onConfirm,
}: {
  account: AccountForm;
  profile: ProfileForm;
  onEdit: (step: number) => void;
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  const sections: { title: string; step: number; items: [string, string][] }[] = [
    {
      title: "Account",
      step: 0,
      items: [
        ["Name", account.name],
        ["Email", account.email],
        ["Phone", account.phone || "—"],
        ["City", account.city || "—"],
      ],
    },
    {
      title: "Professional details",
      step: 1,
      items: [
        ["Speciality", profile.specialization],
        ["Licence number", profile.license_number],
        ["Medical council", profile.council],
        ["Experience", `${profile.experience_years} years`],
        ["Fee", formatINR(Number(profile.consultation_fee))],
      ],
    },
    {
      title: "About you",
      step: 2,
      items: [
        ["Qualifications", profile.qualifications],
        ["About", profile.bio || "—"],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-small font-semibold text-subtle">{section.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(section.step)}
              className="text-small font-semibold text-primary hover:underline"
              aria-label={`Edit ${section.title.toLowerCase()}`}
            >
              Edit
            </button>
          </div>
          <DetailList items={section.items} />
        </section>
      ))}
      <label className="flex items-start gap-3 text-small">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        I confirm these details are correct and my medical registration is valid.
      </label>
    </div>
  );
}
