import type { RouteObject } from "react-router";
import { Spinner } from "@/components/ui/Spinner";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { EmptyPage } from "@/features/admin/EmptyPage";
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
      { path: "/register/doctor", lazy: page(() => import("@/features/auth/DoctorRegisterPage")) },
      { path: "/logout", element: <LogoutPage /> },
      {
        path: "/admin",
        element: (
          <RequireRole allow="admin">
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <EmptyPage title="Overview" /> },
          { path: "doctors", lazy: page(() => import("@/features/admin/doctors/DoctorsPage")) },
          { path: "patients", lazy: page(() => import("@/features/admin/patients/PatientsPage")) },
          { path: "appointments", element: <EmptyPage title="Appointments" /> },
          { path: "kb", element: <EmptyPage title="Knowledge base" /> },
          { path: "audit", element: <EmptyPage title="Audit log" /> },
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
          { path: "profile", lazy: page(() => import("@/features/patient/PatientProfilePage")) },
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
          { path: "reports", lazy: page(() => import("@/features/doctor/SharedReportsPage")) },
          { path: "profile", lazy: page(() => import("@/features/doctor/DoctorProfilePage")) },
          { path: "*", element: <NotFound /> },
        ],
      },
      { path: "/403", element: <Forbidden /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
