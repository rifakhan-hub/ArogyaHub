import type { RouteObject } from "react-router";
import { Spinner } from "@/components/ui/Spinner";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { Forbidden, NotFound, RouteError } from "@/features/errors/ErrorPages";
import { RequireRole } from "./RequireRole";

/**
 * Loads a page's code only when someone opens it, so the first download stays small.
 * Every page file ends with `export default function SomethingPage()`.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

/** Every URL in the admin app and the page it shows (design doc 8.1). */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <Spinner fullScreen />,
    children: [
      { path: "/", lazy: page(() => import("@/features/public/HomePage")) },
      { path: "/login", lazy: page(() => import("@/features/auth/LoginPage")) },
      {
        path: "/admin",
        element: (
          <RequireRole allow="admin">
            <AdminLayout />
          </RequireRole>
        ),
        // these pages show inside AdminLayout, below the top bar
        children: [
          { index: true, lazy: page(() => import("@/features/admin/overview/OverviewPage")) },
          { path: "verifications", lazy: page(() => import("@/features/admin/verifications/VerificationsPage")) },
          { path: "users", lazy: page(() => import("@/features/admin/users/UsersPage")) },
          { path: "appointments", lazy: page(() => import("@/features/admin/appointments/AppointmentsPage")) },
          { path: "kb", lazy: page(() => import("@/features/admin/kb/KbListPage")) },
          { path: "kb/new", lazy: page(() => import("@/features/admin/kb/KbEditorPage")) },
          { path: "kb/:articleId", lazy: page(() => import("@/features/admin/kb/KbEditorPage")) },
          { path: "audit", lazy: page(() => import("@/features/admin/audit/AuditPage")) },
          { path: "*", element: <NotFound /> },
        ],
      },
      { path: "/403", element: <Forbidden /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
