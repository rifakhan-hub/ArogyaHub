import type { AppointmentStatus } from "@/api/types";
import { istDateTime } from "@/lib/dates";

export interface PatientAppointment {
  id: string;
  doctor: string;
  speciality: string;
  start: string;
  fee: number;
  status: AppointmentStatus;
}

export const SLOT_TIMES = ["10:00", "10:30", "11:00", "16:00", "16:30", "17:00"];

export const SAMPLE_APPOINTMENTS: PatientAppointment[] = [
  {
    id: "p1",
    doctor: "Dr. Simran Kaur",
    speciality: "General Physician",
    start: istDateTime(1, "10:30"),
    fee: 400,
    status: "scheduled",
  },
  {
    id: "p2",
    doctor: "Dr. Farah Khan",
    speciality: "Dermatology",
    start: istDateTime(4, "16:00"),
    fee: 600,
    status: "scheduled",
  },
  {
    id: "p3",
    doctor: "Dr. Arjun Mehta",
    speciality: "Paediatrics",
    start: istDateTime(-6, "11:00"),
    fee: 500,
    status: "completed",
  },
  {
    id: "p4",
    doctor: "Dr. Simran Kaur",
    speciality: "General Physician",
    start: istDateTime(-20, "17:00"),
    fee: 400,
    status: "completed",
  },
];

export function isUpcoming(appointment: PatientAppointment) {
  return appointment.status === "scheduled" && new Date(appointment.start) > new Date();
}

export function byStart(a: { start: string }, b: { start: string }) {
  return a.start.localeCompare(b.start);
}
