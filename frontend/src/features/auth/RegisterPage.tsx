import { AlertCircle, CheckCircle2, Stethoscope, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { register, registerDoctor } from "@/api/auth";
import type { ApiError } from "@/api/client";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
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
import {
  type AccountErrors,
  AccountFields,
  EMPTY_ACCOUNT,
  toAccountInput,
  validateAccount,
} from "./accountFields";

export default function RegisterPage() {
  return (
    <div className="bg-bg text-text min-h-dvh">
      <title>Create an account · AarogyaHub</title>
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link to="/" aria-label="AarogyaHub home">
            <Logo onDark={false} subtitle="Online doctor consultations" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8">
        <h1 className="text-h1">Create your account</h1>
        <p className="text-body text-muted mt-2">
          Sign up as a patient to see doctors online, or as a doctor to start taking consultations.
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log in
          </Link>
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          <PatientForm />
          <DoctorForm />
        </div>
      </main>
    </div>
  );
}

function PatientForm() {
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAccount(account);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await register(toAccountInput(account));
      setDone(true);
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "EMAIL_TAKEN") setErrors({ email: error.message });
      else if (error.code === "PHONE_TAKEN") setErrors({ phone: error.message });
      else setServerError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <section aria-labelledby="patient-heading">
        <CardHeading
          id="patient-heading"
          icon={<UserRound className="size-6" strokeWidth={1.75} aria-hidden />}
          title="I'm a patient"
          body="Book verified doctors and keep your reports in one place."
        />
        {done ? (
          <Done
            title="Account created"
            body={`Welcome to AarogyaHub, ${account.name.trim()}. Your patient account is ready.`}
            email={account.email.trim()}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
            <ServerError message={serverError} />
            <AccountFields
              idPrefix="patient"
              form={account}
              errors={errors}
              onChange={setAccount}
            />
            <Button type="submit" size="lg" className="w-full" loading={saving}>
              Create account
            </Button>
          </form>
        )}
      </section>
    </Card>
  );
}

function DoctorForm() {
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [confirmed, setConfirmed] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const foundAccount = validateAccount(account);
    const foundProfile = { ...validateProfessional(profile), ...validateAbout(profile) };
    setAccountErrors(foundAccount);
    setProfileErrors(foundProfile);
    setServerError(confirmed ? "" : "Tick the box to confirm your details.");
    if (Object.keys(foundAccount).length || Object.keys(foundProfile).length || !confirmed) return;

    setSaving(true);
    try {
      await registerDoctor({ ...toAccountInput(account), ...toProfileInput(profile) });
      setDone(true);
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "EMAIL_TAKEN") setAccountErrors({ email: error.message });
      else if (error.code === "PHONE_TAKEN") setAccountErrors({ phone: error.message });
      else if (error.code === "LICENSE_TAKEN") setProfileErrors({ license_number: error.message });
      else setServerError(error.message);
    } finally {
      setSaving(false);
    }
  }

  const setProfileField = (key: keyof ProfileForm, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  return (
    <Card className="p-6 sm:p-8">
      <section aria-labelledby="doctor-heading">
        <CardHeading
          id="doctor-heading"
          icon={<Stethoscope className="size-6" strokeWidth={1.75} aria-hidden />}
          title="I'm a doctor"
          body="An admin checks your licence before patients can book you."
        />
        {done ? (
          <Done
            title="Profile sent for review"
            body={`Thank you, ${account.name.trim()}. Our team will check your licence with ${profile.council.trim()}. You can log in any time to see your status.`}
            email={account.email.trim()}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
            <fieldset className="flex flex-col gap-5">
              <legend className="text-small text-subtle mb-4 font-semibold tracking-wide uppercase">
                Account
              </legend>
              <AccountFields
                idPrefix="doctor"
                form={account}
                errors={accountErrors}
                onChange={setAccount}
              />
            </fieldset>
            <fieldset className="border-border flex flex-col gap-5 border-t pt-6">
              <legend className="text-small text-subtle mb-4 font-semibold tracking-wide uppercase">
                Professional details
              </legend>
              <ProfessionalFields
                form={profile}
                errors={profileErrors}
                onChange={setProfileField}
              />
              <AboutFields form={profile} errors={profileErrors} onChange={setProfileField} />
            </fieldset>
            <label className="text-small flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="accent-primary mt-0.5 size-4"
              />
              I confirm these details are correct and my medical registration is valid.
            </label>
            <ServerError message={serverError} />
            <Button type="submit" size="lg" className="w-full" loading={saving}>
              Submit for review
            </Button>
          </form>
        )}
      </section>
    </Card>
  );
}

function CardHeading({
  id,
  icon,
  title,
  body,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="bg-primary-soft text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </span>
      <div>
        <h2 id={id} className="text-h3 font-semibold">
          {title}
        </h2>
        <p className="text-small text-muted mt-1">{body}</p>
      </div>
    </div>
  );
}

function ServerError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="bg-danger-soft text-small flex items-start gap-2 rounded-md p-3">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

function Done({ title, body, email }: { title: string; body: string; email: string }) {
  return (
    <div className="mt-6 flex flex-col items-start gap-4" role="status">
      <span className="bg-success-soft text-success flex size-12 items-center justify-center rounded-lg">
        <CheckCircle2 className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-h3 font-semibold">{title}</h3>
      <p className="text-body text-muted">{body}</p>
      <Link
        to={`/login?email=${encodeURIComponent(email)}`}
        className={buttonClass("primary", "md")}
      >
        Log in
      </Link>
    </div>
  );
}
