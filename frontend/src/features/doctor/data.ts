import type { AppointmentStatus } from "@/api/types";
import { istDateTime } from "@/lib/dates";

export interface DoctorAppointment {
  id: string;
  patient: string;
  reason: string;
  start: string;
  status: AppointmentStatus;
}

export interface AvailabilityBlock {
  id: string;
  day: number;
  start: string;
  end: string;
  slotMinutes: number;
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const SLOT_LENGTHS = [5, 10, 15, 20, 30];

export const SAMPLE_APPOINTMENTS: DoctorAppointment[] = [
  { id: "d1", patient: "Priya Sharma", reason: "Fever for three days", start: istDateTime(0, "10:00"), status: "completed" },
  { id: "d2", patient: "Rahul Verma", reason: "Follow-up on blood test", start: istDateTime(0, "18:30"), status: "scheduled" },
  { id: "d3", patient: "Simran Kaur", reason: "Skin rash", start: istDateTime(0, "19:00"), status: "scheduled" },
  { id: "d4", patient: "Aman Gill", reason: "Headaches", start: istDateTime(1, "10:30"), status: "scheduled" },
  { id: "d5", patient: "Neha Arora", reason: "Diabetes check-up", start: istDateTime(2, "11:00"), status: "scheduled" },
  { id: "d6", patient: "Karan Bedi", reason: "Cough and cold", start: istDateTime(-2, "16:00"), status: "no_show" },
];

export const SAMPLE_BLOCKS: AvailabilityBlock[] = [
  { id: "b1", day: 0, start: "09:00", end: "12:00", slotMinutes: 15 },
  { id: "b2", day: 2, start: "16:00", end: "19:00", slotMinutes: 20 },
  { id: "b3", day: 4, start: "09:00", end: "13:00", slotMinutes: 15 },
];

export const STATUS_BORDER: Record<AppointmentStatus, string> = {
  scheduled: "border-l-primary",
  in_progress: "border-l-primary",
  completed: "border-l-success",
  cancelled: "border-l-danger",
  no_show: "border-l-warning",
};
