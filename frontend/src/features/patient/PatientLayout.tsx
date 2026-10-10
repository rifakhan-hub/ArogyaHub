import { CalendarCheck, FileText, LayoutDashboard, Search, UserRound } from "lucide-react";
import { SidebarLayout } from "@/features/portal/SidebarLayout";

const LINKS = [
  { to: "/patient", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/patient/reports", label: "Reports", icon: FileText },
  { to: "/patient/doctors", label: "Find a doctor", icon: Search },
  { to: "/patient/profile", label: "Profile", icon: UserRound },
];

export function PatientLayout() {
  return <SidebarLayout title="Patient portal" links={LINKS} context={null} />;
}
