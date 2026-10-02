import { Navigate, useLocation } from "react-router";
import type { Role } from "@/api/types";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

/**
 * Only lets users with the given role see the page inside.
 * Signed-out visitors go to the login page; other roles go to the "no access" page.
 * This only shapes the screens: the backend still checks every request (design doc 9.2).
 */
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
