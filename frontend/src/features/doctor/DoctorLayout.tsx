import { CalendarDays, ClipboardList, FileText, LayoutDashboard, UserRound } from "lucide-react";
import { useOutletContext } from "react-router";
import type { Doctor } from "@/api/types";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { SidebarLayout } from "@/features/portal/SidebarLayout";
import { useApi } from "@/hooks/useApi";
import { DoctorStatusScreen } from "./DoctorStatusScreen";

export interface DoctorData {
  profile: Doctor;
}

export function useDoctorData() {
  return useOutletContext<DoctorData>();
}

const LINKS = [
  { to: "/doctor", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/doctor/appointments", label: "Appointments", icon: ClipboardList },
  { to: "/doctor/reports", label: "Patient reports", icon: FileText },
  { to: "/doctor/profile", label: "Profile", icon: UserRound },
];

export function DoctorLayout() {
  const { data: profile, error, reload } = useApi<Doctor>("/doctors/me");

  if (error?.code === "NO_DOCTOR_PROFILE") return <DoctorStatusScreen doctor={null} onUpdated={reload} />;
  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <ErrorMessage error={error} onRetry={reload} />
      </div>
    );
  }
  if (!profile) return <Spinner fullScreen />;
  if (profile.verification_status !== "verified") return <DoctorStatusScreen doctor={profile} onUpdated={reload} />;

  return <SidebarLayout title="Doctor portal" links={LINKS} context={{ profile }} />;
}
