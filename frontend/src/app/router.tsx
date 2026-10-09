import type { RouteObject } from "react-router";
import { Spinner } from "@/components/ui/Spinner";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { LogoutPage } from "@/features/auth/LogoutPage";
import { DoctorLayout } from "@/features/doctor/DoctorLayout";
import { Forbidden, NotFound, RouteError } from "@/features/errors/ErrorPages";
import { PatientLayout } from "@/features/patient/PatientLayout";
import { RequireRole } from "./RequireRole";

const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <Spinner fullScreen />,
    children: [
      { path: "/", lazy: page(() => import("@/features/public/HomePage")) },
      { path: "/login", lazy: page(() => import("@/features/auth/LoginPage")) },
      { path: "/register", lazy: page(() => import("@/features/auth/RegisterPage")) },
      { path: "/logout", element: <LogoutPage /> },
      {
        path: "/admin",
        element: (
          <RequireRole allow="admin">
            <AdminLayout />
          </RequireRole>
        ),
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
      {
        path: "/patient",
        element: (
          <RequireRole allow="patient">
            <PatientLayout />
          </RequireRole>
        ),
        children: [
          { index: true, lazy: page(() => import("@/features/patient/PatientHomePage")) },
          { path: "doctors", lazy: page(() => import("@/features/patient/FindDoctorPage")) },
          { path: "appointments", lazy: page(() => import("@/features/patient/PatientAppointmentsPage")) },
          { path: "reports", lazy: page(() => import("@/features/patient/ReportsPage")) },
          { path: "profile", lazy: page(() => import("@/features/portal/ProfilePage")) },
          { path: "*", element: <NotFound /> },
        ],
      },
      {
        path: "/doctor",
        element: (
          <RequireRole allow="doctor">
            <DoctorLayout />
          </RequireRole>
        ),
        children: [
          { index: true, lazy: page(() => import("@/features/doctor/DoctorHomePage")) },
          { path: "appointments", lazy: page(() => import("@/features/doctor/DoctorAppointmentsPage")) },
          { path: "schedule", lazy: page(() => import("@/features/doctor/SchedulePage")) },
          { path: "profile", lazy: page(() => import("@/features/portal/ProfilePage")) },
          { path: "*", element: <NotFound /> },
        ],
      },
      { path: "/403", element: <Forbidden /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
