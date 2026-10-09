import { useState } from "react";
import { useOutletContext } from "react-router";
import type { AppointmentStatus } from "@/api/types";
import { PortalLayout } from "@/features/portal/PortalLayout";
import { type AvailabilityBlock, type DoctorAppointment, SAMPLE_APPOINTMENTS, SAMPLE_BLOCKS } from "./data";

export interface DoctorData {
  appointments: DoctorAppointment[];
  blocks: AvailabilityBlock[];
  setStatus: (id: string, status: AppointmentStatus) => void;
  addBlock: (block: Omit<AvailabilityBlock, "id">) => void;
  removeBlock: (id: string) => void;
}

export function useDoctorData() {
  return useOutletContext<DoctorData>();
}

const LINKS = [
  { to: "/doctor", label: "Home", end: true },
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/availability", label: "Availability" },
  { to: "/doctor/profile", label: "Profile" },
];

export function DoctorLayout() {
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [blocks, setBlocks] = useState(SAMPLE_BLOCKS);

  function setStatus(id: string, status: AppointmentStatus) {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function addBlock(block: Omit<AvailabilityBlock, "id">) {
    setBlocks((list) => [...list, { ...block, id: `b${Date.now()}` }]);
  }

  function removeBlock(id: string) {
    setBlocks((list) => list.filter((b) => b.id !== id));
  }

  return (
    <PortalLayout
      title="Doctor portal"
      links={LINKS}
      context={{ appointments, blocks, setStatus, addBlock, removeBlock }}
    />
  );
}
