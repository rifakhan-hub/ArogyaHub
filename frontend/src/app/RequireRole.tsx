import { Navigate, useLocation } from "react-router";
import type { Role } from "@/api/types";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export function RequireRole({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Spinner fullScreen />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.role !== allow) return <Navigate to="/403" replace />;
  return children;
}
