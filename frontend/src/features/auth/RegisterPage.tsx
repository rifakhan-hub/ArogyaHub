import { AlertCircle, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "@/api/client";
import type { RegisterRequest, User } from "@/api/types";
import { registerUser } from "@/api/users";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { isEmail } from "@/lib/validators";

type Role = RegisterRequest["role"];

interface Form {
  name: string;
  email: string;
  phone: string;
  city: string;
  role: Role;
  password: string;
  confirm: string;
}

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { name: "", email: "", phone: "", city: "", role: "patient", password: "", confirm: "" };

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "patient", label: "Patient", hint: "Book consultations and keep your reports" },
  { value: "doctor", label: "Doctor", hint: "Consult patients after licence verification" },
];

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name";
  if (!isEmail(form.email)) errors.email = "Enter an email address, like name@example.com";
  if (form.phone.trim() && !/^\+?[0-9]{10,15}$/.test(form.phone.trim()))
    errors.phone = "Use 10 to 15 digits, with an optional + at the start";
  if (form.password.length < 8) errors.password = "Use at least 8 characters";
  else if (form.confirm !== form.password) errors.confirm = "The passwords don't match";
  return errors;
}

export default function RegisterPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<User | null>(null);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);
    setServerError("");
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        role: form.role,
        password: form.password,
      });
      setCreated(user);
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "EMAIL_TAKEN") setErrors({ email: error.message });
      else if (error.code === "PHONE_TAKEN") setErrors({ phone: error.message });
      else setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-text">
      <title>Create an account · AarogyaHub</title>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <Link to="/" aria-label="AarogyaHub home">
            <Logo onDark={false} subtitle="Online doctor consultations" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-12">
        <Card className="p-8">
          {created ? (
            <div className="flex flex-col items-start gap-4" role="status">
              <span className="flex size-12 items-center justify-center rounded-lg bg-success-soft text-success">
                <CheckCircle2 className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <h1 className="text-h2">Account created</h1>
              <p className="text-body text-muted">
                Welcome to AarogyaHub, {created.name}. Your {created.role} account for {created.email} is ready.
              </p>
              <Link to="/" className={buttonClass("primary", "md")}>
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <span className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <UserPlus className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <h1 className="text-h2">Create your account</h1>
              <p className="mt-2 text-body text-muted">See verified doctors online, from home.</p>

              <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
                {serverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md bg-danger-soft p-3 text-small text-sindoor-700 dark:text-sindoor-200"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {serverError}
                  </div>
                )}

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-small font-semibold text-text">I am a</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <label
                        key={r.value}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors",
                          form.role === r.value
                            ? "border-primary bg-primary-soft"
                            : "border-border-strong bg-surface hover:bg-surface-muted",
                        )}
                      >
                        <span className="flex items-center gap-2 text-body font-semibold">
                          <input
                            type="radio"
                            name="role"
                            value={r.value}
                            checked={form.role === r.value}
                            onChange={() => update("role", r.value)}
                            className="accent-primary"
                          />
                          {r.label}
                        </span>
                        <span className="text-small text-muted">{r.hint}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label="Full name" id="name" error={errors.name}>
                  <Input autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="Email" id="email" error={errors.email}>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone" id="phone" optional error={errors.phone}>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+919812345678"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="City" id="city" optional>
                    <Input
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="relative">
                  <Field label="Password" id="password" hint="At least 8 characters" error={errors.password}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-11"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-[30px] inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-surface-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                <Field label="Confirm password" id="confirm" error={errors.confirm}>
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                  />
                </Field>

                <Button type="submit" size="lg" className="mt-1 w-full" loading={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
