import { AlertCircle, Eye, EyeOff, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/lib/env";
import { isEmail } from "@/lib/validators";
import { RibbonMotif } from "./RibbonMotif";

const DEMO = { email: "admin@aarogyahub.in", password: "Admin@123" };

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/admin") ? searchParams.get("next")! : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user?.role === "admin" && !submitting) return <Navigate to={next} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = {
      email: isEmail(email) ? undefined : "Enter an email address, like name@aarogyahub.in",
      password: password ? undefined : "Enter your password",
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setSubmitting(true);
    setServerError("");
    try {
      const signedIn = await signIn(email, password);
      navigate(signedIn.role === "admin" ? next : "/403", { replace: true });
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[5fr_7fr]">
      <section className="hidden flex-col justify-between bg-stone-800 p-10 text-stone-50 lg:flex xl:p-14">
        <Logo />
        <div className="flex max-w-lg flex-col gap-10">
          <div>
            <h1 className="text-h1 text-stone-50">Every doctor licence-checked. Every action on record.</h1>
            <p className="mt-4 text-body-lg text-stone-300">
              Verify doctors, keep consultations on track and curate what the assistant tells patients.
            </p>
          </div>
          <RibbonMotif />
        </div>
        <p className="flex items-center gap-2 text-small text-stone-400">
          <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
          Access is logged. Sign out on shared computers.
        </p>
      </section>

      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="lg:invisible">
            <Logo onDark={false} />
          </span>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <span className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Lock className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-h2 max-sm:text-h3">Log in to the admin console</h2>
          <p className="mt-2 text-body text-muted">For the AarogyaHub operations team.</p>

          {env.USE_MOCKS && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-haldi-200 bg-accent-soft p-3 text-small text-warning dark:border-haldi-800">
              <FlaskConical className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <div className="flex flex-col gap-1.5">
                <p>
                  Demo backend is on. Use {DEMO.email} / {DEMO.password}.
                </p>
                <button
                  type="button"
                  className="self-start font-semibold underline underline-offset-2 hover:no-underline"
                  onClick={() => {
                    setEmail(DEMO.email);
                    setPassword(DEMO.password);
                    setErrors({});
                  }}
                >
                  Fill demo login
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
            {serverError && (
              <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-soft p-3 text-small text-sindoor-700 dark:text-sindoor-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {serverError}
              </div>
            )}
            <Field label="Email" id="email" error={errors.email}>
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="relative">
              <Field label="Password" id="password" error={errors.password}>
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <Button type="submit" size="lg" className="mt-1 w-full" loading={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
