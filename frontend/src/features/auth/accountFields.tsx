import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { isEmail, isPhone } from "@/lib/validators";

export interface AccountForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  confirm: string;
}

export type AccountErrors = Partial<Record<keyof AccountForm, string>>;

export const EMPTY_ACCOUNT: AccountForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  password: "",
  confirm: "",
};

export function passwordChecks(password: string) {
  return [
    { label: "8 or more characters", ok: password.length >= 8 },
    { label: "A lowercase letter", ok: /[a-z]/.test(password) },
    { label: "An uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "A number", ok: /[0-9]/.test(password) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function passwordStrength(password: string) {
  const [long, ...kinds] = passwordChecks(password);
  const count = kinds.filter((k) => k.ok).length;
  if (!long.ok) return { label: "Too short", score: 0 };
  if (count < 3) return { label: "Weak", score: 1 };
  if (count === 4 || password.length >= 12) return { label: "Strong", score: 3 };
  return { label: "Good", score: 2 };
}

export function validateAccount(form: AccountForm): AccountErrors {
  const errors: AccountErrors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name";
  if (!isEmail(form.email)) errors.email = "Enter an email address, like name@example.com";
  if (form.phone.trim() && !isPhone(form.phone))
    errors.phone = "Use 10 to 15 digits, with an optional + at the start";
  if (passwordStrength(form.password).score < 2) errors.password = "Choose a stronger password";
  else if (form.confirm !== form.password) errors.confirm = "The passwords don't match";
  return errors;
}

export function toAccountInput(form: AccountForm) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    city: form.city.trim() || null,
    password: form.password,
  };
}

const BAR_COLOURS = ["bg-danger", "bg-danger", "bg-haldi-400", "bg-success"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = passwordStrength(password);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1" aria-hidden>
        {[1, 2, 3].map((part) => (
          <span
            key={part}
            className={cn(
              "h-1.5 rounded-full",
              part <= Math.max(strength.score, 1) ? BAR_COLOURS[strength.score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-small font-medium">
        Password strength: {strength.label}
      </p>
      <ul className="text-caption text-muted grid grid-cols-2 gap-x-3 gap-y-1">
        {passwordChecks(password).map((check) => (
          <li
            key={check.label}
            className={cn("flex items-center gap-1.5", check.ok && "text-success")}
          >
            {check.ok ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Circle className="size-3" aria-hidden />
            )}
            <span>
              {check.label}
              <span className="sr-only">{check.ok ? " (done)" : " (missing)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountFields({
  idPrefix,
  form,
  errors,
  onChange,
}: {
  idPrefix: string;
  form: AccountForm;
  errors: AccountErrors;
  onChange: (form: AccountForm) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const set = (key: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [key]: e.target.value });
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="flex flex-col gap-5">
      <Field label="Full name" id={id("name")} error={errors.name}>
        <Input autoComplete="name" value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Email" id={id("email")} error={errors.email}>
        <Input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" id={id("phone")} optional error={errors.phone}>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="+919812345678"
            value={form.phone}
            onChange={set("phone")}
          />
        </Field>
        <Field label="City" id={id("city")} optional>
          <Input autoComplete="address-level2" value={form.city} onChange={set("city")} />
        </Field>
      </div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Field label="Password" id={id("password")} error={errors.password}>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-11"
              value={form.password}
              onChange={set("password")}
            />
          </Field>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="text-subtle hover:bg-surface-muted hover:text-text absolute top-[30px] right-1 inline-flex size-9 items-center justify-center rounded-md"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>
      <Field label="Confirm password" id={id("confirm")} error={errors.confirm}>
        <Input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
        />
      </Field>
    </div>
  );
}
