import { CalendarDays, ClipboardList, LayoutDashboard, UserRound } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router";
import type { AppointmentStatus } from "@/api/types";
import { SidebarLayout } from "@/features/portal/SidebarLayout";
import { type AvailabilityBlock, type DoctorAppointment, SAMPLE_APPOINTMENTS, SAMPLE_BLOCKS } from "./data";

export interface DoctorData {
  appointments: DoctorAppointment[];
  blocks: AvailabilityBlock[];
  daysOff: string[];
  setStatus: (id: string, status: AppointmentStatus) => void;
  addBlock: (block: Omit<AvailabilityBlock, "id">) => void;
  removeBlock: (id: string) => void;
  toggleDayOff: (date: string) => void;
}

export function useDoctorData() {
  return useOutletContext<DoctorData>();
}

const LINKS = [
  { to: "/doctor", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/doctor/appointments", label: "Appointments", icon: ClipboardList },
  { to: "/doctor/profile", label: "Profile", icon: UserRound },
];

export function DoctorLayout() {
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [blocks, setBlocks] = useState(SAMPLE_BLOCKS);
  const [daysOff, setDaysOff] = useState<string[]>([]);

  const data: DoctorData = {
    appointments,
    blocks,
    daysOff,
    setStatus: (id, status) => setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a))),
    addBlock: (block) => setBlocks((list) => [...list, { ...block, id: `b${Date.now()}` }]),
    removeBlock: (id) => setBlocks((list) => list.filter((b) => b.id !== id)),
    toggleDayOff: (date) =>
      setDaysOff((list) => (list.includes(date) ? list.filter((d) => d !== date) : [...list, date])),
  };

  return <SidebarLayout title="Doctor portal" links={LINKS} context={data} />;
}
