import type { Appointment } from "@/api/types";

export function isUpcoming(appointment: Appointment, now = new Date()) {
  const active = appointment.status === "scheduled" || appointment.status === "in_progress";
  return active && new Date(appointment.end_time) > now;
}

export function byStart(a: Appointment, b: Appointment) {
  return a.start_time.localeCompare(b.start_time);
}

export function canStart(appointment: Appointment, now = new Date()) {
  const opens = new Date(appointment.start_time).getTime() - 10 * 60_000;
  return appointment.status === "scheduled" && now.getTime() >= opens && now < new Date(appointment.end_time);
}
