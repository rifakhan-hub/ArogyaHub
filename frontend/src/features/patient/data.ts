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

export type ReportType = "pdf" | "image" | "dicom";

export interface PatientReport {
  id: string;
  name: string;
  type: ReportType;
  uploadedAt: string;
  size: number;
  shared: boolean;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  pdf: "PDF",
  image: "Image",
  dicom: "Scan (DICOM)",
};

export const SAMPLE_REPORTS: PatientReport[] = [
  { id: "r1", name: "Blood test - CBC.pdf", type: "pdf", uploadedAt: istDateTime(-3, "09:15"), size: 240_000, shared: true },
  { id: "r2", name: "Chest X-ray.dcm", type: "dicom", uploadedAt: istDateTime(-12, "18:40"), size: 8_400_000, shared: true },
  { id: "r3", name: "Skin rash photo.jpg", type: "image", uploadedAt: istDateTime(-20, "11:05"), size: 1_200_000, shared: false },
  { id: "r4", name: "Thyroid profile.pdf", type: "pdf", uploadedAt: istDateTime(-45, "10:30"), size: 180_000, shared: false },
];

export function reportTypeOf(file: File): ReportType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".dcm") || name.endsWith(".zip")) return "dicom";
  if (file.type.startsWith("image/")) return "image";
  return null;
}
