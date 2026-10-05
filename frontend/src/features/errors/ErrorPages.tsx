import { Compass, ShieldAlert, TriangleAlert } from "lucide-react";
import { Link, useNavigate, useRouteError } from "react-router";
import { toApiError } from "@/api/client";
import { Button, buttonClass } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

function ErrorLayout({ icon: Icon, title, body, children }: {
  icon: typeof Compass;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-surface-muted text-subtle">
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="text-h2 max-sm:text-h3">{title}</h1>
      <p className="mt-2 max-w-md text-body text-muted">{body}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function NotFound() {
  return (
    <ErrorLayout icon={Compass} title="This page doesn't exist" body="The link may be old or mistyped.">
      <Link to="/admin" className={buttonClass()}>
        Go to overview
      </Link>
    </ErrorLayout>
  );
}

export function Forbidden() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <ErrorLayout
      icon={ShieldAlert}
      title="You don't have access to the admin console"
      body="Only admin accounts can open this area. If you need access, ask an existing admin."
    >
      <Button variant="outline" onClick={() => signOut().then(() => navigate("/login", { replace: true }))}>
        Log in with a different account
      </Button>
    </ErrorLayout>
  );
}

export function RouteError() {
  const error = toApiError(useRouteError());
  return (
    <ErrorLayout icon={TriangleAlert} title="Something went wrong" body={error.message}>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </ErrorLayout>
  );
}
