import type { Appointment } from "@/api/types";

export function isUpcoming(appointment: Appointment, now = new Date()) {
  const active = appointment.status === "scheduled" || appointment.status === "in_progress";
  return active && new Date(appointment.end_time) > now;
}

export function byStart(a: Appointment, b: Appointment) {
  return a.start_time.localeCompare(b.start_time);
}

export function prescriptionPath(role: "patient" | "doctor", appointmentId: string) {
  return `/${role}/prescription/${appointmentId}`;
}

export function canJoin(appointment: Appointment, now = new Date()) {
  const active = appointment.status === "scheduled" || appointment.status === "in_progress";
  const opens = new Date(appointment.start_time).getTime() - 10 * 60_000;
  const closes = new Date(appointment.end_time).getTime() + 15 * 60_000;
  return active && now.getTime() >= opens && now.getTime() <= closes;
}

export function consultationPath(role: "patient" | "doctor", appointmentId: string) {
  return `/${role}/consultation/${appointmentId}`;
}
