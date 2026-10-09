import { AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import type { Role } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { HOME_PATH } from "@/lib/roles";
import { isEmail } from "@/lib/validators";
import { RibbonMotif } from "./RibbonMotif";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startPage = (role: Role) => {
    const next = searchParams.get("next");
    return next?.startsWith(HOME_PATH[role]) ? next : HOME_PATH[role];
  };

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={startPage(user.role)} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = {
      email: isEmail(email) ? undefined : "Enter an email address, like name@example.com",
      password: password ? undefined : "Enter your password",
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setSubmitting(true);
    setServerError("");
    try {
      const signedIn = await signIn(email, password);
      navigate(startPage(signedIn.role), { replace: true });
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[5fr_7fr]">
      <section className="hidden flex-col justify-between bg-stone-800 p-10 text-stone-50 lg:flex xl:p-14">
        <Link to="/" aria-label="AarogyaHub home">
          <Logo subtitle="Online doctor consultations" />
        </Link>
        <div className="flex max-w-lg flex-col gap-10">
          <div>
            <h1 className="text-h1 text-stone-50">See a verified doctor today, without leaving home.</h1>
            <p className="mt-4 text-body-lg text-stone-300">
              Book consultations, keep your reports in one place, and pick up where you left off.
            </p>
          </div>
          <RibbonMotif />
        </div>
        <p className="flex items-center gap-2 text-small text-stone-400">
          <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
          Your data stays private. Sign out on shared computers.
        </p>
      </section>

      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="lg:invisible">
            <Link to="/" aria-label="AarogyaHub home">
              <Logo onDark={false} subtitle="Online doctor consultations" />
            </Link>
          </span>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <span className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Lock className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-h2 max-sm:text-h3">Log in to AarogyaHub</h2>
          <p className="mt-2 text-body text-muted">For patients, doctors and the AarogyaHub team.</p>

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

          <p className="mt-6 text-center text-small text-muted">
            New to AarogyaHub?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
