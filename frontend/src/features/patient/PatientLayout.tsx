import { useState } from "react";
import { useOutletContext } from "react-router";
import { PortalLayout } from "@/features/portal/PortalLayout";
import { SAMPLE_APPOINTMENTS, type PatientAppointment } from "./data";

type NewBooking = Omit<PatientAppointment, "id" | "status">;

export interface PatientData {
  appointments: PatientAppointment[];
  book: (booking: NewBooking) => void;
  cancel: (id: string) => void;
}

export function usePatientData() {
  return useOutletContext<PatientData>();
}

const LINKS = [
  { to: "/patient", label: "Home", end: true },
  { to: "/patient/doctors", label: "Find a doctor" },
  { to: "/patient/appointments", label: "My appointments" },
  { to: "/patient/profile", label: "Profile" },
];

export function PatientLayout() {
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);

  function book(booking: NewBooking) {
    setAppointments((list) => [...list, { ...booking, id: `p${Date.now()}`, status: "scheduled" }]);
  }

  function cancel(id: string) {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  }

  return <PortalLayout title="Patient portal" links={LINKS} context={{ appointments, book, cancel }} />;
}
