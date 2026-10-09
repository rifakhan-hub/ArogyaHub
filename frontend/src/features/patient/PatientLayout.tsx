import { CalendarCheck, FileText, LayoutDashboard, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router";
import { SidebarLayout } from "@/features/portal/SidebarLayout";
import { type PatientAppointment, type PatientReport, SAMPLE_APPOINTMENTS, SAMPLE_REPORTS } from "./data";

type NewBooking = Omit<PatientAppointment, "id" | "status">;
type NewReport = Omit<PatientReport, "id" | "uploadedAt" | "shared">;

export interface PatientData {
  appointments: PatientAppointment[];
  reports: PatientReport[];
  book: (booking: NewBooking) => void;
  cancel: (id: string) => void;
  addReport: (report: NewReport) => void;
  removeReport: (id: string) => void;
  toggleShare: (id: string) => void;
}

export function usePatientData() {
  return useOutletContext<PatientData>();
}

const LINKS = [
  { to: "/patient", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/patient/reports", label: "Reports", icon: FileText },
  { to: "/patient/doctors", label: "Find a doctor", icon: Search },
  { to: "/patient/profile", label: "Profile", icon: UserRound },
];

export function PatientLayout() {
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [reports, setReports] = useState(SAMPLE_REPORTS);

  const data: PatientData = {
    appointments,
    reports,
    book: (booking) => setAppointments((list) => [...list, { ...booking, id: `p${Date.now()}`, status: "scheduled" }]),
    cancel: (id) => setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))),
    addReport: (report) =>
      setReports((list) => [
        { ...report, id: `r${Date.now()}`, uploadedAt: new Date().toISOString(), shared: false },
        ...list,
      ]),
    removeReport: (id) => setReports((list) => list.filter((r) => r.id !== id)),
    toggleShare: (id) => setReports((list) => list.map((r) => (r.id === id ? { ...r, shared: !r.shared } : r))),
  };

  return <SidebarLayout title="Patient portal" links={LINKS} context={data} />;
}
